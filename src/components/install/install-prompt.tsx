"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { GlassButton } from "@/components/glass/buttons";
import { useIsStandalone, useIsIosSafari } from "@/lib/use-standalone";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Lets someone install this app straight from a shared link, no app store
// involved. Android/desktop Chrome expose a native beforeinstallprompt
// event we can trigger programmatically; iOS Safari has no such API, so
// there we just point at the manual Share → Add to Home Screen step.
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const installed = useIsStandalone();
  const showIosHint = useIsIosSafari() && !installed;

  useEffect(() => {
    if (installed || showIosHint) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [installed, showIosHint]);

  if (installed || (!deferredPrompt && !showIosHint)) return null;

  if (showIosHint) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        Tap <Share className="h-4 w-4" aria-hidden="true" /> then &ldquo;Add to Home Screen&rdquo; to install
      </p>
    );
  }

  return (
    <GlassButton
      size="lg"
      onClick={async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      }}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Install app
    </GlassButton>
  );
}
