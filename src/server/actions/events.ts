"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, logAudit } from "@/lib/authz";

type RsvpStatus = "GOING" | "INTERESTED" | "NOT_GOING";

export async function rsvpToEventAction(eventId: string, status: RsvpStatus) {
  const user = await requireActiveUser();
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, include: { rsvps: { where: { status: "GOING" } } } });

  let finalStatus: RsvpStatus | "WAITLISTED" = status;
  if (status === "GOING" && event.capacity) {
    const existing = await prisma.eventRSVP.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
    const goingCount = event.rsvps.filter((r) => r.userId !== user.id).length;
    if (goingCount >= event.capacity && existing?.status !== "GOING") {
      finalStatus = event.allowWaitlist ? "WAITLISTED" : "GOING";
      if (!event.allowWaitlist && goingCount >= event.capacity) {
        throw new Error("This event is full.");
      }
    }
  }

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { status: finalStatus, respondedAt: new Date() },
    create: { eventId, userId: user.id, status: finalStatus },
  });

  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/events");
  return finalStatus;
}

export async function submitEventRegistrationAnswersAction(eventId: string, answers: { questionId: string; answer: string }[]) {
  const user = await requireActiveUser();
  for (const a of answers) {
    await prisma.eventRegistrationAnswer.create({
      data: { questionId: a.questionId, userId: user.id, answer: a.answer },
    });
  }
  revalidatePath(`/events`);
}

export async function exportEventAttendeesAction(eventId: string) {
  const user = await requireActiveUser();
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  const rsvps = await prisma.eventRSVP.findMany({
    where: { eventId, status: "GOING" },
    include: { user: { include: { profile: true } } },
  });

  await logAudit({ actorId: user.id, action: "event.attendees_exported", targetType: "Event", targetId: eventId });

  const header = "Name,Email,Status,RSVP Date\n";
  const rows = rsvps
    .map((r) => {
      const name = r.user.profile ? `${r.user.profile.firstName} ${r.user.profile.lastName}` : r.user.name || "";
      return `"${name}","${r.user.email}","${r.status}","${r.respondedAt.toISOString()}"`;
    })
    .join("\n");

  return { filename: `${event.slug}-attendees.csv`, csv: header + rows };
}
