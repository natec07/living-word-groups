"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBrandingAction } from "@/server/actions/admin-content";

type Branding = {
  churchName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  registrationMode: string;
};

export function BrandingForm({ initial }: { initial: Branding }) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      await updateBrandingAction(form);
      toast.success("Branding updated");
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Church name</Label>
          <Input value={form.churchName} onChange={(e) => setForm((f) => ({ ...f, churchName: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Primary color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="h-9 w-9 rounded border border-input" />
            <Input value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Accent color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.accentColor} onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))} className="h-9 w-9 rounded border border-input" />
            <Input value={form.accentColor} onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Contact email</Label>
          <Input value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
        </div>
      </div>
      <Button onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save branding"}</Button>
    </div>
  );
}
