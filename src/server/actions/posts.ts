"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, isGroupLeader, isSpaceLeaderOrAdmin, getEffectivePermissions, logAudit } from "@/lib/authz";
import { createPostSchema, createCommentSchema, reactionTypes, type CreatePostInput } from "@/lib/validations/post";
import { notifyUser } from "@/lib/notify";

// Space posts land on the church-wide Community feed, so posting there
// is restricted to admins/pastors (announcements.publish_churchwide) —
// everyone can still comment and react. Group posts stay open to any
// active member, except ANNOUNCEMENT-type posts: only that group's
// leaders (or global moderators) can send one, since an announcement is
// what surfaces on the Community tab for the whole group to see.
async function assertCanPostIn(userId: string, spaceId?: string, groupId?: string, type?: string) {
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (!membership || membership.status !== "ACTIVE") throw new Error("FORBIDDEN");
    if (type === "ANNOUNCEMENT") {
      const isLeader = membership.role === "LEADER" || membership.role === "CO_LEADER";
      if (!isLeader) {
        const permissions = await getEffectivePermissions(userId);
        if (!permissions.includes("content.moderate")) throw new Error("FORBIDDEN");
      }
    }
    return;
  }
  if (spaceId) {
    // The permission alone decides this, deliberately: church-wide posting is
    // staff-only, and staff are not necessarily explicit members of the
    // church-wide space. Also requiring a SpaceMember row meant a newly
    // promoted admin/pastor saw the composer (the UI gates purely on this
    // permission) but got FORBIDDEN on submit — the two checks have to agree.
    const permissions = await getEffectivePermissions(userId);
    if (!permissions.includes("announcements.publish_churchwide")) throw new Error("FORBIDDEN");
    return;
  }
  throw new Error("A post needs a space or group.");
}

export async function createPostAction(input: CreatePostInput) {
  const user = await requireActiveUser();
  const parsed = createPostSchema.parse(input);
  await assertCanPostIn(user.id, parsed.spaceId, parsed.groupId, parsed.type);

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      spaceId: parsed.spaceId,
      groupId: parsed.groupId,
      type: parsed.type,
      title: parsed.title || null,
      body: parsed.body,
    },
  });

  revalidatePath("/home");
  revalidatePath("/community");
  if (parsed.groupId) revalidatePath(`/groups/${parsed.groupId}`);
  return post.id;
}

async function assertCanModerate(userId: string, post: { authorId: string; spaceId: string | null; groupId: string | null }) {
  if (post.authorId === userId) return true;
  const permissions = await getEffectivePermissions(userId);
  if (permissions.includes("content.moderate")) return true;
  if (post.groupId && (await isGroupLeader(userId, post.groupId))) return true;
  if (post.spaceId && (await isSpaceLeaderOrAdmin(userId, post.spaceId))) return true;
  throw new Error("FORBIDDEN");
}

export async function deletePostAction(postId: string) {
  const user = await requireActiveUser();
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });
  await assertCanModerate(user.id, post);

  await prisma.post.update({ where: { id: postId }, data: { status: "REMOVED", deletedAt: new Date() } });
  await logAudit({ actorId: user.id, action: "post.removed", targetType: "Post", targetId: postId });
  revalidatePath("/home");
  revalidatePath("/community");
}

export async function togglePinPostAction(postId: string) {
  const user = await requireActiveUser();
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });
  await assertCanModerate(user.id, post);
  await prisma.post.update({ where: { id: postId }, data: { pinned: !post.pinned } });
  revalidatePath("/home");
  revalidatePath("/community");
  if (post.groupId) revalidatePath(`/groups/${post.groupId}`);
}

export async function reactToPostAction(postId: string, type: (typeof reactionTypes)[number]) {
  const user = await requireActiveUser();
  const existing = await prisma.reaction.findFirst({ where: { postId, userId: user.id, type } });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId, userId: user.id, type } });
  }
  revalidatePath("/home");
  revalidatePath("/community");
}

export async function toggleBookmarkPostAction(postId: string) {
  const user = await requireActiveUser();
  const existing = await prisma.bookmark.findFirst({ where: { postId, userId: user.id, type: "POST" } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.bookmark.create({ data: { userId: user.id, type: "POST", postId } });
  return true;
}

export async function createCommentAction(input: { postId: string; parentId?: string; body: string }) {
  const user = await requireActiveUser();
  const parsed = createCommentSchema.parse(input);
  const post = await prisma.post.findUniqueOrThrow({ where: { id: parsed.postId } });
  if (post.commentsLocked) throw new Error("Comments are locked on this post.");

  const comment = await prisma.comment.create({
    data: { postId: parsed.postId, authorId: user.id, parentId: parsed.parentId, body: parsed.body },
  });

  const deepLink = `/community/posts/${parsed.postId}`;
  if (parsed.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parsed.parentId } });
    if (parent && parent.authorId !== user.id) {
      await notifyUser({ userId: parent.authorId, category: "REPLY", title: "New reply to your comment", deepLink });
    }
  } else if (post.authorId !== user.id) {
    await notifyUser({ userId: post.authorId, category: "COMMENT", title: "New comment on your post", deepLink });
  }

  revalidatePath(`/community/posts/${parsed.postId}`);
  return comment.id;
}
