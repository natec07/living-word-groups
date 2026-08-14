"use client";

import { useEffect } from "react";

// Mounted once, site-wide (root layout) — a registered service worker is
// one of the browser signals (alongside the manifest) that makes this app
// installable from a plain shared link.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => console.error("[sw] registration failed", err));
  }, []);

  return null;
}
