"use client";

import { Card, CardContent } from "@/components/ui/card";
import { InstallPrompt } from "@/components/install/install-prompt";
import { useIsStandalone } from "@/lib/use-standalone";

// Wraps InstallPrompt with the surrounding "why would I want this" copy for
// Settings, and hides the whole card once the app is already installed —
// showing that copy next to nothing to click would be confusing.
export function InstallSettingsCard() {
  const installed = useIsStandalone();

  if (installed) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">App</h2>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium">Install Groups on this device</p>
            <p className="text-sm text-muted-foreground">Add it to your home screen for quick, full-screen access.</p>
          </div>
          <InstallPrompt />
        </CardContent>
      </Card>
    </section>
  );
}
