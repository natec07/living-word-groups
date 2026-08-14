"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";

// A device token can only ever belong to whoever is currently signed in
// on it — re-registering (new login, reinstall) just reassigns it.
export async function registerPushDeviceAction(deviceToken: string, platform: string) {
  const user = await requireActiveUser();
  await prisma.pushDevice.upsert({
    where: { deviceToken },
    update: { userId: user.id, platform },
    create: { userId: user.id, deviceToken, platform },
  });
}

export async function unregisterPushDeviceAction(deviceToken: string) {
  await prisma.pushDevice.deleteMany({ where: { deviceToken } });
}

// Same reassign-on-reregister behavior as registerPushDeviceAction, but for
// a Web Push subscription (the installable PWA's push path). The
// subscription's endpoint URL plays the role a device token does — it's
// unique per browser+origin registration.
export async function registerWebPushSubscriptionAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const user = await requireActiveUser();
  await prisma.pushDevice.upsert({
    where: { deviceToken: subscription.endpoint },
    update: { userId: user.id, platform: "web", p256dh: subscription.keys.p256dh, authKey: subscription.keys.auth },
    create: {
      userId: user.id,
      deviceToken: subscription.endpoint,
      platform: "web",
      p256dh: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
    },
  });
}
