"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfileAction } from "@/server/actions/profile";
import type { UpdateProfileInput } from "@/lib/validations/profile";
import { SUPPORTED_LANGUAGES } from "@/lib/translate/languages";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  bio: string;
  ageRange: string;
  preferredLanguage: string;
  ministryInterests: string[];
  serveInterests: string[];
  visibility: Record<string, "PUBLIC" | "MEMBERS" | "PRIVATE">;
};

const PRIVATE_TOGGLE_FIELDS = [
  { key: "bio", label: "Bio" },
  { key: "ageRange", label: "Age range" },
];

export function EditProfileForm({ profile }: { profile: ProfileFormData }) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function togglePrivate(field: string) {
    setForm((f) => ({
      ...f,
      visibility: { ...f.visibility, [field]: f.visibility[field] === "PRIVATE" ? "MEMBERS" : "PRIVATE" },
    }));
  }

  function submit() {
    startTransition(async () => {
      const input: UpdateProfileInput = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || undefined,
        ageRange: (form.ageRange || undefined) as UpdateProfileInput["ageRange"],
        preferredLanguage: form.preferredLanguage || undefined,
        ministryInterests: form.ministryInterests,
        serveInterests: form.serveInterests,
        visibility: form.visibility,
      };
      await updateProfileAction(input);
      toast.success("Profile updated");
      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short intro for other members" />
      </div>

      <div className="space-y-1.5">
        <Label>Age range</Label>
        <Select value={form.ageRange} onValueChange={(v) => set("ageRange", v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select a range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="YOUTH">Youth</SelectItem>
            <SelectItem value="YOUNG_ADULT">Young adult</SelectItem>
            <SelectItem value="ADULT">Adult</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Preferred language</Label>
        <p className="text-xs text-muted-foreground">Used by the &quot;Translate&quot; option on messages and announcements.</p>
        <Select value={form.preferredLanguage} onValueChange={(v) => set("preferredLanguage", v ?? "en")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Field visibility</Label>
        <p className="text-xs text-muted-foreground">Choose which optional fields other members can see.</p>
        <div className="mt-2 space-y-2">
          {PRIVATE_TOGGLE_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm">{f.label}</span>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={form.visibility[f.key] !== "PRIVATE"} onCheckedChange={() => togglePrivate(f.key)} />
                Visible to members
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={submit} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
