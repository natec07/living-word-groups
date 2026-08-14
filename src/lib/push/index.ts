import "server-only";
import { prisma } from "@/lib/prisma";
import { sendApnsPush } from "@/lib/push/apns";
import { sendWebPush } from "@/lib/push/webpush";

// Pushes to every device/subscription registered for this user, routing
// each to the right transport: "web" (the installable PWA, this app's
// actual distribution path) goes through Web Push; anything else (the
// dormant Capacitor iOS project, if ever built and shipped) goes through
// APNs.
export async function sendPushToUser(userId: string, payload: { title: string; body?: string; deepLink?: string }) {
  const devices = await prisma.pushDevice.findMany({ where: { userId } });
  if (devices.length === 0) return;

  await Promise.all(
    devices.map((device) => (device.platform === "web" ? sendWebPush(device, payload) : sendApnsPush(device, payload)))
  );
}
