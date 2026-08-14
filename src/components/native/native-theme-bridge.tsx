"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// Tells the native iOS shell (MainViewController.swift) which theme is
// actually rendered, so the WKWebView's status-bar-area background can
// match it exactly. The device's OS-level light/dark setting isn't a
// reliable proxy — this app's theme can be pinned to Light or Dark
// independently of the system (see Settings → Appearance), so relying on
// the OS trait alone leaves the status bar mismatched whenever they diverge.
export function NativeThemeBridge() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const bridge = (
      window as unknown as { webkit?: { messageHandlers?: { themeBridge?: { postMessage: (msg: string) => void } } } }
    ).webkit?.messageHandlers?.themeBridge;
    bridge?.postMessage(resolvedTheme);
  }, [resolvedTheme]);

  return null;
}
