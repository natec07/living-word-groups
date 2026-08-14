"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/authz";
import { createGroupSchema, createSpaceSchema, type CreateGroupInput, type CreateSpaceInput } from "@/lib/validations/group-admin";
import { slugify } from "@/lib/validations/media";
import { syncGroupConversationMember } from "@/server/data/messaging";

export async function archiveGroupAction(groupId: string, archived: boolean) {
  const admin = await requirePermission("groups.manage_all");
  await prisma.group.update({ where: { id: groupId }, data: { archivedAt: archived ? new Date() : null } });
  await logAudit({ actorId: admin.id, action: archived ? "group.archived" : "group.unarchived", targetType: "Group", targetId: groupId });
  revalidatePath("/admin/groups");
}

export async function archiveSpaceAction(spaceId: string, archived: boolean) {
  const admin = await requirePermission("spaces.manage_all");
  await prisma.space.update({ where: { id: spaceId }, data: { archivedAt: archived ? new Date() : null } });
  await logAudit({ actorId: admin.id, action: archived ? "space.archived" : "space.unarchived", targetType: "Space", targetId: spaceId });
  revalidatePath("/admin/groups");
}

export async function updateGroupCoverAction(groupId: string, coverImage: string) {
  const admin = await requirePermission("groups.manage_all");
  await prisma.group.update({ where: { id: groupId }, data: { coverImage } });
  await logAudit({ actorId: admin.id, action: "group.cover_updated", targetType: "Group", targetId: groupId });
  revalidatePath("/admin/groups");
  revalidatePath("/groups");
}

export async function updateSpaceCoverAction(spaceId: string, coverImage: string) {
  const admin = await requirePermission("spaces.manage_all");
  await prisma.space.update({ where: { id: spaceId }, data: { coverImage } });
  await logAudit({ actorId: admin.id, action: "space.cover_updated", targetType: "Space", targetId: spaceId });
  revalidatePath("/admin/groups");
}

export async function featurePostAction(postId: string, pinned: boolean) {
  const admin = await requirePermission("content.feature");
  await prisma.post.update({ where: { id: postId }, data: { pinned } });
  await logAudit({ actorId: admin.id, action: "post.featured", targetType: "Post", targetId: postId, metadata: { pinned } });
  revalidatePath("/admin/content");
}

export async function updateBrandingAction(input: {
  churchName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  registrationMode: string;
}) {
  const admin = await requirePermission("settings.manage");
  await prisma.appSetting.upsert({
    where: { key: "branding" },
    update: { value: input },
    create: { key: "branding", value: input },
  });
  await logAudit({ actorId: admin.id, action: "settings.branding_updated" });
  revalidatePath("/admin/settings");
}

async function uniqueGroupSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.group.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
  return slug;
}

async function uniqueSpaceSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.space.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
  return slug;
}

export async function createGroupAction(input: CreateGroupInput) {
  const admin = await requirePermission("groups.manage_all");
  const parsed = createGroupSchema.parse(input);
  const slug = await uniqueGroupSlug(parsed.name);

  const group = await prisma.group.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description,
      meetingSchedule: parsed.meetingSchedule,
      location: parsed.location,
      onlineLink: parsed.onlineLink,
      privacy: parsed.privacy,
      ageRestriction: parsed.ageRestriction,
      rules: parsed.rules,
      spaceId: parsed.spaceId || undefined,
      questions: parsed.questions.length
        ? { create: parsed.questions.map((question, order) => ({ question, order })) }
        : undefined,
    },
  });

  if (parsed.leaderId) {
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: parsed.leaderId, role: "LEADER", status: "ACTIVE" },
    });
    await prisma.group.update({ where: { id: group.id }, data: { memberCount: { increment: 1 } } });
    await syncGroupConversationMember(group.id, parsed.leaderId, true);
  }

  await logAudit({ actorId: admin.id, action: "group.created", targetType: "Group", targetId: group.id });
  revalidatePath("/admin/groups");
  revalidatePath("/groups");
  return group.id;
}

export async function createSpaceAction(input: CreateSpaceInput) {
  const admin = await requirePermission("spaces.manage_all");
  const parsed = createSpaceSchema.parse(input);
  const slug = await uniqueSpaceSlug(parsed.name);

  const space = await prisma.space.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description,
      type: parsed.type,
      privacy: parsed.privacy,
      ministryId: parsed.ministryId || undefined,
      guidelines: parsed.guidelines,
      createdById: admin.id,
    },
  });

  await logAudit({ actorId: admin.id, action: "space.created", targetType: "Space", targetId: space.id });
  revalidatePath("/admin/groups");
  return space.id;
}

export async function setGroupLeaderAction(groupId: string, userId: string) {
  const admin = await requirePermission("groups.manage_all");
  const currentLeader = await prisma.groupMember.findFirst({ where: { groupId, role: "LEADER" } });
  if (currentLeader && currentLeader.userId !== userId) {
    await prisma.groupMember.update({ where: { id: currentLeader.id }, data: { role: "MEMBER" } });
  }
  const existingMembership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: { role: "LEADER", status: "ACTIVE" },
    create: { groupId, userId, role: "LEADER", status: "ACTIVE" },
  });
  if (!existingMembership) {
    await prisma.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } });
  }
  await syncGroupConversationMember(groupId, userId, true);
  await logAudit({ actorId: admin.id, action: "group.leader_set", targetType: "Group", targetId: groupId, metadata: { userId } });
  revalidatePath("/admin/groups");
}
