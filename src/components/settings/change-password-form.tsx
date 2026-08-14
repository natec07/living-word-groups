"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordChangeAction, verifyPasswordChangeAction } from "@/server/actions/security";
import { VerificationCodeStep } from "@/components/settings/verification-code-step";

export function ChangePasswordForm() {
  const [step, setStep] = useState<"form" | "code">("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function requestChange() {
    setError(null);
    startTransition(async () => {
      try {
        await requestPasswordChangeAction({ currentPassword, newPassword });
        setStep("code");
        toast.success("Check your email for a verification code");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't start the password change.");
      }
    });
  }

  async function verify(code: string) {
    await verifyPasswordChangeAction({ code });
    toast.success("Password updated");
    setStep("form");
    setCurrentPassword("");
    setNewPassword("");
  }

  if (step === "code") {
    return (
      <VerificationCodeStep
        description="We sent a 6-digit code to your email to confirm this change."
        onVerify={verify}
        onResend={requestChange}
        onCancel={() => setStep("form")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="sm" onClick={requestChange} disabled={pending || !currentPassword || newPassword.length < 8}>
        {pending ? "Sending code…" : "Update password"}
      </Button>
    </div>
  );
}
