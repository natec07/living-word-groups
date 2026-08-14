"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { magicLinkSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MagicLinkForm({ ctaLabel = "Email me a sign-in link" }: { ctaLabel?: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(magicLinkSchema) });

  async function onSubmit(values: { email: string }) {
    setLoading(true);
    await signIn("resend", { email: values.email, redirect: false, redirectTo: "/home" });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        If that email matches an account, we&apos;ve sent a secure sign-in link. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="magic-email">Email</Label>
        <Input id="magic-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
        {loading ? "Sending…" : ctaLabel}
      </Button>
    </form>
  );
}
