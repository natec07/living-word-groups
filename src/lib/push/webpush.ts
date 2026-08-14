import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const configured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  vapidConfigured = true;
}

// Pushes to a single Web Push subscription (one browser/device that ran
// pushManager.subscribe()). Silently no-ops (logging to the console) until
// VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT are set — same
// graceful-degradation pattern as the Resend email sender and APNs.
export async function sendWebPush(
  device: { id: string; deviceToken: string; p256dh: string | null; authKey: string | null },
  payload: { title: string; body?: string; deepLink?: string }
) {
  if (!device.p256dh || !device.authKey) return;

  if (!configured()) {
    console.log(`\n🔔 [dev web push] endpoint=${device.deviceToken.slice(0, 40)}… title="${payload.title}"\n`);
    return;
  }

  ensureVapidConfigured();

  const subscription = {
    endpoint: device.deviceToken,
    keys: { p256dh: device.p256dh, auth: device.authKey },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 404/410 — the browser is telling us this subscription no longer
    // exists, so stop trying to push to it.
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushDevice.delete({ where: { id: device.id } }).catch(() => {});
    } else {
      console.error("[webpush] push failed", err);
    }
  }
}
