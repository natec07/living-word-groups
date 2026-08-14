"use client";

import { useEffect } from "react";
import { registerWebPushSubscriptionAction } from "@/server/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function subscriptionToPlain(sub: PushSubscription) {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

// Mounted once in the signed-in app shell, mirroring PushRegistration
// (the dormant Capacitor/APNs path) but for Web Push — the installable
// PWA's actual push mechanism. Skips entirely inside the native wrapper
// (PushRegistration owns that path there) and wherever the browser
// doesn't support the Push API (older Safari, etc.).
export function WebPushRegistration() {
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) return;

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
      if (Notification.permission !== "granted" || cancelled) return;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      if (cancelled) return;

      const plain = subscriptionToPlain(subscription);
      if (plain) await registerWebPushSubscriptionAction(plain);
    }

    // Platform/permission edge cases should degrade to "no push" quietly,
    // never an unhandled rejection in a component mounted on every page.
    setup().catch((err) => console.error("[web push] setup failed", err));

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
