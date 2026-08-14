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
import { createAnnouncementAction } from "@/server/actions/announcements";
import type { announcementTargets, announcementPriorities } from "@/lib/validations/announcement";
import { ANNOUNCEMENT_AUDIENCE_LABELS, ANNOUNCEMENT_PRIORITY_LABELS } from "@/lib/select-options";

type TargetType = (typeof announcementTargets)[number];
type Priority = (typeof announcementPriorities)[number];

export function CreateAnnouncementForm({ groups }: { groups: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    title: string;
    body: string;
    targetType: TargetType;
    targetId: string;
    priority: Priority;
    pinned: boolean;
    requiresAck: boolean;
    sendEmail: boolean;
  }>({
    title: "",
    body: "",
    targetType: "EVERYONE",
    targetId: "",
    priority: "NORMAL",
    pinned: false,
    requiresAck: false,
    sendEmail: false,
  });

  function submit() {
    startTransition(async () => {
      await createAnnouncementAction({
        title: form.title,
        body: form.body,
        targetType: form.targetType,
        targetId: form.targetId || undefined,
        priority: form.priority,
        pinned: form.pinned,
        requiresAck: form.requiresAck,
        sendEmail: form.sendEmail,
      });
      toast.success("Announcement published");
      setForm((f) => ({ ...f, title: "", body: "" }));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Message</Label>
        <Textarea rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Audience</Label>
          <Select items={ANNOUNCEMENT_AUDIENCE_LABELS} value={form.targetType} onValueChange={(v) => setForm((f) => ({ ...f, targetType: (v ?? "EVERYONE") as typeof f.targetType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ANNOUNCEMENT_AUDIENCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.targetType === "GROUP" && (
          <div className="space-y-1.5">
            <Label>Group</Label>
            <Select items={groups.map((g) => ({ value: g.id, label: g.name }))} value={form.targetId} onValueChange={(v) => setForm((f) => ({ ...f, targetId: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select items={ANNOUNCEMENT_PRIORITY_LABELS} value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: (v ?? "NORMAL") as typeof f.priority }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ANNOUNCEMENT_PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.pinned} onCheckedChange={(c) => setForm((f) => ({ ...f, pinned: c === true }))} /> Pin to top
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.requiresAck} onCheckedChange={(c) => setForm((f) => ({ ...f, requiresAck: c === true }))} /> Require acknowledgment
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.sendEmail} onCheckedChange={(c) => setForm((f) => ({ ...f, sendEmail: c === true }))} /> Also send email
        </label>
      </div>
      <Button onClick={submit} disabled={pending || !form.title || !form.body}>
        {pending ? "Publishing…" : "Publish announcement"}
      </Button>
    </div>
  );
}
