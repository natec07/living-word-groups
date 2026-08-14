"use client";

import { useEffect } from "react";
import { registerPushDeviceAction } from "@/server/actions/push";

// Mounted once in the signed-in app shell. No-ops entirely in the browser —
// only registers for push when actually running inside the native iOS
// wrapper (Capacitor), since APNs device tokens don't exist on the web.
// The token is deliberately never unregistered on unmount: it should stay
// registered for as long as it's valid, regardless of component lifecycle —
// re-registering on a later sign-in just reassigns it (see PushDevice
// model), so a stale owner self-heals on next launch.
export function PushRegistration() {
  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");

      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === "prompt") {
        permission = await PushNotifications.requestPermissions();
      }
      if (permission.receive !== "granted" || cancelled) return;

      PushNotifications.addListener("registration", (token) => {
        registerPushDeviceAction(token.value, Capacitor.getPlatform());
      });
      PushNotifications.addListener("registrationError", (err) => {
        console.error("[push] registration error", err);
      });

      await PushNotifications.register();
    }

    // Platform detection edge cases (or a plugin that isn't actually wired
    // up on this build) should degrade to "no push" quietly, never an
    // unhandled rejection in a component that's mounted on every page.
    setup().catch((err) => console.error("[push] setup failed", err));

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
