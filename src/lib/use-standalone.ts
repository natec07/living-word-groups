"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own (non-standard) flag for "already added to home screen".
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getServerSnapshot() {
  return false;
}

// Whether this page is currently running as an installed PWA (vs. a
// regular browser tab). Unknown during SSR, so the server always renders
// the "not installed" branch; React reconciles to the real client value
// right after hydration.
export function useIsStandalone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// iOS Safari has no beforeinstallprompt API — the only way to install is
// the manual Share → Add to Home Screen step, so callers need to know
// when to show that hint instead of an "Install app" button. The user
// agent never changes mid-session, so there's nothing to subscribe to.
function noopSubscribe() {
  return () => {};
}

function getIosSafariSnapshot() {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

export function useIsIosSafari() {
  return useSyncExternalStore(noopSubscribe, getIosSafariSnapshot, getServerSnapshot);
}
