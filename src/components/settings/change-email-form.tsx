"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestEmailChangeAction, verifyEmailChangeAction } from "@/server/actions/security";
import { VerificationCodeStep } from "@/components/settings/verification-code-step";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<"form" | "code">("form");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function requestChange() {
    setError(null);
    startTransition(async () => {
      try {
        await requestEmailChangeAction({ newEmail });
        setStep("code");
        toast.success(`Check ${newEmail} for a verification code`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't start the email change.");
      }
    });
  }

  async function verify(code: string) {
    await verifyEmailChangeAction({ code });
    toast.success("Email updated — please sign in again with your new email");
    await signOut({ callbackUrl: "/sign-in" });
  }

  if (step === "code") {
    return (
      <VerificationCodeStep
        description={`We sent a 6-digit code to ${newEmail} to confirm this change.`}
        onVerify={verify}
        onResend={requestChange}
        onCancel={() => setStep("form")}
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Signed in as {currentEmail}</p>
      <Label htmlFor="new-email">New email address</Label>
      <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="sm" onClick={requestChange} disabled={pending || !newEmail}>
        {pending ? "Sending code…" : "Update email"}
      </Button>
    </div>
  );
}
