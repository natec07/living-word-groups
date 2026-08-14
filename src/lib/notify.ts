import "server-only";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import type { NotificationCategory } from "@/generated/prisma/client";

export async function notifyUser(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  deepLink?: string;
}) {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_category: { userId: params.userId, category: params.category } },
  });
  if (pref?.frequency === "OFF") return;

  await prisma.notification.create({
    data: {
      userId: params.userId,
      category: params.category,
      title: params.title,
      body: params.body,
      deepLink: params.deepLink,
    },
  });

  // Best-effort — a push failure (unconfigured APNs, dead token, network
  // hiccup) should never break whatever action triggered this notification.
  try {
    await sendPushToUser(params.userId, { title: params.title, body: params.body, deepLink: params.deepLink });
  } catch (err) {
    console.error("[notify] push failed", err);
  }
}
