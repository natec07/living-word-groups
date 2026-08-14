"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireActiveUser, logAudit } from "@/lib/authz";
import { createAnnouncementSchema, type CreateAnnouncementInput } from "@/lib/validations/announcement";
import { notifyUser } from "@/lib/notify";
import { sendAnnouncementEmail } from "@/lib/email/send";

async function resolveRecipientIds(targetType: string, targetId?: string): Promise<string[]> {
  switch (targetType) {
    case "EVERYONE": {
      const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
      return users.map((u) => u.id);
    }
    case "GROUP": {
      if (!targetId) return [];
      const members = await prisma.groupMember.findMany({ where: { groupId: targetId, status: "ACTIVE" }, select: { userId: true } });
      return members.map((m) => m.userId);
    }
    case "MINISTRY": {
      if (!targetId) return [];
      const spaces = await prisma.space.findMany({ where: { ministryId: targetId }, select: { id: true } });
      const members = await prisma.spaceMember.findMany({
        where: { spaceId: { in: spaces.map((s) => s.id) }, status: "ACTIVE" },
        select: { userId: true },
      });
      return [...new Set(members.map((m) => m.userId))];
    }
    case "ROLE": {
      if (!targetId) return [];
      const roles = await prisma.userRole.findMany({ where: { role: { key: targetId as never } }, select: { userId: true } });
      return roles.map((r) => r.userId);
    }
    case "NEW_MEMBERS": {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const users = await prisma.user.findMany({ where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } }, select: { id: true } });
      return users.map((u) => u.id);
    }
    default:
      // AGE_RANGE, EVENT_REGISTRANTS, VOLUNTEERS: not yet segmented in this MVP.
      return [];
  }
}

export async function createAnnouncementAction(input: CreateAnnouncementInput) {
  const user = await requirePermission("announcements.publish_churchwide");
  const parsed = createAnnouncementSchema.parse(input);

  const announcement = await prisma.announcement.create({
    data: {
      title: parsed.title,
      body: parsed.body,
      authorId: user.id,
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      priority: parsed.priority,
      pinned: parsed.pinned,
      requiresAck: parsed.requiresAck,
      sendEmail: parsed.sendEmail,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
    },
  });

  const recipientIds = await resolveRecipientIds(parsed.targetType, parsed.targetId);
  const category = parsed.targetType === "EVERYONE" ? "STAFF_ANNOUNCEMENT" : "GROUP_ANNOUNCEMENT";

  for (const userId of recipientIds) {
    await notifyUser({ userId, category, title: parsed.title, body: parsed.body, deepLink: "/home" });
  }

  if (parsed.sendEmail) {
    const recipients = await prisma.user.findMany({ where: { id: { in: recipientIds } }, select: { email: true } });
    for (const r of recipients) {
      await sendAnnouncementEmail(r.email, parsed.title, parsed.body, `${process.env.NEXT_PUBLIC_APP_URL}/home`);
    }
  }

  await logAudit({ actorId: user.id, action: "announcement.created", targetType: "Announcement", targetId: announcement.id });
  revalidatePath("/home");
  return announcement.id;
}

export async function acknowledgeAnnouncementAction(announcementId: string) {
  const user = await requireActiveUser();
  await prisma.announcementAck.upsert({
    where: { announcementId_userId: { announcementId, userId: user.id } },
    update: {},
    create: { announcementId, userId: user.id },
  });
}
