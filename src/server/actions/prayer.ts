"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, requirePermission, logAudit } from "@/lib/authz";
import { getVisiblePrayerWhere, canManagePrayerTeam } from "@/server/data/prayer";
import { createPrayerRequestSchema, type CreatePrayerRequestInput } from "@/lib/validations/prayer";
import { sendPrayerUpdateEmail } from "@/lib/email/send";
import { notifyUser } from "@/lib/notify";

// Every request is routed to the Prayer Team, never posted to a public
// wall — privacy is always forced server-side regardless of what the
// client sends, so this can't be bypassed by calling the action directly.
export async function createPrayerRequestAction(input: CreatePrayerRequestInput) {
  const user = await requireActiveUser();
  const parsed = createPrayerRequestSchema.parse(input);

  const request = await prisma.prayerRequest.create({
    data: {
      authorId: user.id,
      title: parsed.title,
      details: parsed.details,
      category: parsed.category,
      urgency: parsed.urgency,
      privacy: "PRAYER_TEAM",
      concealName: parsed.concealName,
    },
  });

  revalidatePath("/prayer");
  return request.id;
}

// Re-fetches the request through the visibility filter before allowing
// the interaction — a user can't "pray" for a request they aren't
// authorized to see, even if they know its ID.
async function assertCanSeeRequest(userId: string, requestId: string) {
  const where = await getVisiblePrayerWhere(userId);
  const request = await prisma.prayerRequest.findFirst({ where: { AND: [where, { id: requestId }] } });
  if (!request) throw new Error("NOT_FOUND");
  return request;
}

export async function prayForRequestAction(requestId: string) {
  const user = await requireActiveUser();
  await assertCanSeeRequest(user.id, requestId);

  const existing = await prisma.prayerInteraction.findUnique({
    where: { prayerRequestId_userId: { prayerRequestId: requestId, userId: user.id } },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.prayerInteraction.create({ data: { prayerRequestId: requestId, userId: user.id } }),
    prisma.prayerRequest.update({ where: { id: requestId }, data: { prayerCount: { increment: 1 } } }),
  ]);

  revalidatePath(`/prayer/${requestId}`);
  revalidatePath("/prayer");
}

export async function addPrayerUpdateAction(requestId: string, body: string, isPraiseReport = false) {
  const user = await requireActiveUser();
  const request = await assertCanSeeRequest(user.id, requestId);

  const canManage = await canManagePrayerTeam(user.id);
  if (request.authorId !== user.id && !canManage) throw new Error("FORBIDDEN");

  await prisma.prayerUpdate.create({ data: { prayerRequestId: requestId, authorId: user.id, body } });
  if (isPraiseReport && request.authorId === user.id) {
    await prisma.prayerRequest.update({ where: { id: requestId }, data: { isPraiseReport: true, status: "ANSWERED" } });
  }

  if (request.authorId !== user.id) {
    await notifyUser({
      userId: request.authorId,
      category: "PRAYER_UPDATE",
      title: "There's an update on your prayer request",
      deepLink: `/prayer/${requestId}`,
    });
  }

  revalidatePath(`/prayer/${requestId}`);
}

export async function updatePrayerStatusAction(requestId: string, status: string) {
  const user = await requirePermission("prayer.manage_prayer_team");
  await prisma.prayerRequest.update({ where: { id: requestId }, data: { status: status as never } });
  await logAudit({ actorId: user.id, action: "prayer.status_updated", targetType: "PrayerRequest", targetId: requestId, metadata: { status } });
  revalidatePath(`/prayer/${requestId}`);
  revalidatePath("/prayer");
}

export async function assignPrayerRequestAction(requestId: string, assignedToId: string) {
  const user = await requirePermission("prayer.manage_prayer_team");
  await prisma.prayerAssignment.create({ data: { prayerRequestId: requestId, assignedToId, assignedById: user.id } });
  await logAudit({ actorId: user.id, action: "prayer.assigned", targetType: "PrayerRequest", targetId: requestId, metadata: { assignedToId } });
  revalidatePath(`/prayer/${requestId}`);
}

// Pastoral care notes are the most sensitive data in the schema — gated
// on a dedicated permission and always audit-logged, per spec.
export async function addPastoralCareNoteAction(requestId: string, note: string) {
  const user = await requirePermission("prayer.manage_pastoral_notes");
  await prisma.pastoralCareNote.create({ data: { prayerRequestId: requestId, authorId: user.id, note } });
  await logAudit({
    actorId: user.id,
    action: "prayer.pastoral_note_added",
    targetType: "PrayerRequest",
    targetId: requestId,
  });
  revalidatePath(`/prayer/${requestId}`);
}

export async function convertToPraiseReportAction(requestId: string) {
  const user = await requirePermission("prayer.manage_prayer_team");
  const request = await prisma.prayerRequest.update({
    where: { id: requestId },
    data: { isPraiseReport: true, status: "ANSWERED", privacy: "PUBLIC" },
    include: { author: true },
  });
  await logAudit({ actorId: user.id, action: "prayer.converted_to_praise", targetType: "PrayerRequest", targetId: requestId });
  await sendPrayerUpdateEmail(request.author.email, request.title, `${process.env.NEXT_PUBLIC_APP_URL}/prayer/${requestId}`);
  revalidatePath("/prayer");
  revalidatePath(`/prayer/${requestId}`);
}
