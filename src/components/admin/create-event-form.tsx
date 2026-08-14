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
import { createEventAction } from "@/server/actions/admin-events";
import { EVENT_VISIBILITY_LABELS } from "@/lib/select-options";

export function CreateEventForm({ ministries }: { ministries: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    location: "",
    onlineLink: "",
    ministryId: "",
    capacity: "",
    allowWaitlist: false,
    visibility: "PUBLIC" as const,
  });

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Create event</Button>;
  }

  function submit() {
    startTransition(async () => {
      await createEventAction({
        title: form.title,
        description: form.description || undefined,
        startAt: form.startAt,
        endAt: form.endAt || undefined,
        location: form.location || undefined,
        onlineLink: form.onlineLink || undefined,
        ministryId: form.ministryId || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        allowWaitlist: form.allowWaitlist,
        visibility: form.visibility,
      });
      toast.success("Event created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Starts</Label>
          <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Ends</Label>
          <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Online link</Label>
          <Input value={form.onlineLink} onChange={(e) => setForm((f) => ({ ...f, onlineLink: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Ministry</Label>
          <Select items={ministries.map((m) => ({ value: m.id, label: m.name }))} value={form.ministryId} onValueChange={(v) => setForm((f) => ({ ...f, ministryId: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {ministries.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Capacity</Label>
          <Input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <Select items={EVENT_VISIBILITY_LABELS} value={form.visibility} onValueChange={(v) => setForm((f) => ({ ...f, visibility: (v ?? "PUBLIC") as typeof f.visibility }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_VISIBILITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Checkbox checked={form.allowWaitlist} onCheckedChange={(c) => setForm((f) => ({ ...f, allowWaitlist: c === true }))} />
          <Label className="font-normal">Allow waitlist</Label>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={submit} disabled={pending || !form.title || !form.startAt}>
          {pending ? "Creating…" : "Create event"}
        </Button>
      </div>
    </div>
  );
}
