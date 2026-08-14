"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerificationCodeStep({
  description,
  onVerify,
  onResend,
  onCancel,
}: {
  description: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resending, startResendTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await onVerify(code);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't verify that code.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{description}</p>
      <Label htmlFor="verification-code">6-digit code</Label>
      <Input
        id="verification-code"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        autoComplete="one-time-code"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={submit} disabled={pending || code.length !== 6}>
          {pending ? "Verifying…" : "Verify code"}
        </Button>
        <Button size="sm" variant="ghost" disabled={resending} onClick={() => startResendTransition(onResend)}>
          {resending ? "Sending…" : "Resend code"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
