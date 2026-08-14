"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireActiveUser();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireActiveUser();
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/notifications");
}

export async function updateNotificationPreferenceAction(category: string, frequency: string) {
  const user = await requireActiveUser();
  if (!NOTIFICATION_CATEGORIES.includes(category as never)) throw new Error("Invalid category");
  await prisma.notificationPreference.upsert({
    where: { userId_category: { userId: user.id, category: category as never } },
    update: { frequency: frequency as never },
    create: { userId: user.id, category: category as never, frequency: frequency as never },
  });
  revalidatePath("/settings");
}
