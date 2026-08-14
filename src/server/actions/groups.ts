"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, canManageGroup, logAudit } from "@/lib/authz";
import { joinGroupSchema, type JoinGroupInput } from "@/lib/validations/group";
import { sendGroupRequestReceivedEmail, sendGroupRequestApprovedEmail } from "@/lib/email/send";
import { notifyUser } from "@/lib/notify";
import { syncGroupConversationMember } from "@/server/data/messaging";

export async function requestJoinGroupAction(input: JoinGroupInput) {
  const user = await requireActiveUser();
  const parsed = joinGroupSchema.parse(input);
  const group = await prisma.group.findUniqueOrThrow({ where: { id: parsed.groupId } });

  if (group.privacy === "HIDDEN" || group.privacy === "INVITE_ONLY") {
    throw new Error("This group can only be joined by invitation.");
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  if (existing && existing.status !== "REMOVED") return existing.status;

  // Questions marked required are rendered with a "*" and are the whole point
  // of an approval-required group — a leader reviewing a request needs the
  // answers. Nothing enforced them before, so a request could be submitted
  // with every required field blank.
  const requiredQuestions = await prisma.groupMembershipQuestion.findMany({
    where: { groupId: group.id, required: true },
    select: { id: true },
  });
  const answerByQuestionId = new Map(parsed.answers.map((a) => [a.questionId, a.answer.trim()]));
  const missing = requiredQuestions.filter((q) => !answerByQuestionId.get(q.id));
  if (missing.length > 0) {
    throw new Error("Please answer all required questions before sending your request.");
  }

  const status = group.privacy === "OPEN" ? "ACTIVE" : "PENDING";

  const member = existing
    ? await prisma.groupMember.update({ where: { id: existing.id }, data: { status } })
    : await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id, status } });

  for (const a of parsed.answers) {
    await prisma.groupMembershipAnswer.create({
      data: { questionId: a.questionId, userId: user.id, groupMemberId: member.id, answer: a.answer },
    });
  }

  if (status === "ACTIVE") {
    await prisma.group.update({ where: { id: group.id }, data: { memberCount: { increment: 1 } } });
    await syncGroupConversationMember(group.id, user.id, true);
  } else {
    await sendGroupRequestReceivedEmail(user.email, group.name);
  }

  revalidatePath(`/groups/${group.slug}`);
  return status;
}

export async function leaveGroupAction(groupId: string) {
  const user = await requireActiveUser();
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: user.id } } });
  if (!membership) return;

  await prisma.groupMember.update({ where: { id: membership.id }, data: { status: "REMOVED" } });
  if (membership.status === "ACTIVE") {
    await prisma.group.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } });
  }
  await syncGroupConversationMember(groupId, user.id, false);
  revalidatePath("/groups");
}

async function assertGroupLeader(userId: string, groupId: string) {
  const permitted = await canManageGroup(userId, groupId);
  if (!permitted) throw new Error("FORBIDDEN");
}

export async function approveGroupMemberAction(groupId: string, memberUserId: string) {
  const user = await requireActiveUser();
  await assertGroupLeader(user.id, groupId);

  const membership = await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: memberUserId } },
    data: { status: "ACTIVE" },
    include: { group: true, user: true },
  });
  await prisma.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } });
  await syncGroupConversationMember(groupId, memberUserId, true);
  await notifyUser({
    userId: memberUserId,
    category: "MEMBERSHIP_APPROVAL",
    title: `You're in! Welcome to ${membership.group.name}`,
    deepLink: `/groups/${membership.group.slug}`,
  });
  await sendGroupRequestApprovedEmail(
    membership.user.email,
    membership.group.name,
    `${process.env.NEXT_PUBLIC_APP_URL}/groups/${membership.group.slug}`
  );
  await logAudit({ actorId: user.id, action: "group.member_approved", targetType: "Group", targetId: groupId, metadata: { memberUserId } });
  revalidatePath(`/groups/${membership.group.slug}`);
}

export async function denyGroupMemberAction(groupId: string, memberUserId: string) {
  const user = await requireActiveUser();
  await assertGroupLeader(user.id, groupId);

  const membership = await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: memberUserId } },
    data: { status: "REMOVED" },
    include: { group: true },
  });
  await syncGroupConversationMember(groupId, memberUserId, false);
  await logAudit({ actorId: user.id, action: "group.member_denied", targetType: "Group", targetId: groupId, metadata: { memberUserId } });
  revalidatePath(`/groups/${membership.group.slug}`);
}

export async function muteGroupMemberAction(groupId: string, memberUserId: string, days: number) {
  const user = await requireActiveUser();
  await assertGroupLeader(user.id, groupId);

  const mutedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: memberUserId } },
    data: { status: "MUTED", mutedUntil },
  });
  await logAudit({ actorId: user.id, action: "group.member_muted", targetType: "Group", targetId: groupId, metadata: { memberUserId, days } });
  revalidatePath(`/groups`);
}
