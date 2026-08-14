"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/authz";
import { createEventSchema, type CreateEventInput } from "@/lib/validations/event";
import { slugify } from "@/lib/validations/media";

export async function createEventAction(input: CreateEventInput) {
  const admin = await requirePermission("events.manage_all");
  const parsed = createEventSchema.parse(input);

  const baseSlug = slugify(parsed.title);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const event = await prisma.event.create({
    data: {
      title: parsed.title,
      slug,
      description: parsed.description,
      startAt: new Date(parsed.startAt),
      endAt: parsed.endAt ? new Date(parsed.endAt) : undefined,
      location: parsed.location,
      onlineLink: parsed.onlineLink,
      ministryId: parsed.ministryId || undefined,
      capacity: parsed.capacity,
      allowWaitlist: parsed.allowWaitlist,
      visibility: parsed.visibility,
      createdById: admin.id,
    },
  });

  await logAudit({ actorId: admin.id, action: "event.created", targetType: "Event", targetId: event.id });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return event.id;
}

export async function duplicateEventAction(eventId: string) {
  const admin = await requirePermission("events.manage_all");
  const original = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  const weekLater = new Date(original.startAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const newEnd = original.endAt ? new Date(original.endAt.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined;

  const baseSlug = slugify(original.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const event = await prisma.event.create({
    data: {
      title: original.title,
      slug,
      description: original.description,
      startAt: weekLater,
      endAt: newEnd,
      location: original.location,
      onlineLink: original.onlineLink,
      ministryId: original.ministryId,
      capacity: original.capacity,
      allowWaitlist: original.allowWaitlist,
      visibility: original.visibility,
      createdById: admin.id,
    },
  });

  await logAudit({ actorId: admin.id, action: "event.duplicated", targetType: "Event", targetId: event.id });
  revalidatePath("/admin/events");
  return event.id;
}

export async function cancelEventAction(eventId: string) {
  const admin = await requirePermission("events.manage_all");
  await prisma.event.update({ where: { id: eventId }, data: { cancelledAt: new Date() } });
  await logAudit({ actorId: admin.id, action: "event.cancelled", targetType: "Event", targetId: eventId });
  revalidatePath("/admin/events");
  revalidatePath("/events");
}
