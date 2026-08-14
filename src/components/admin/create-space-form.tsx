"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSpaceAction } from "@/server/actions/admin-content";

export function CreateSpaceForm({ ministries }: { ministries: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "MINISTRY" as const,
    privacy: "MEMBERS_ONLY" as const,
    ministryId: "",
  });

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>New space</Button>;

  function submit() {
    startTransition(async () => {
      await createSpaceAction({
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        privacy: form.privacy,
        ministryId: form.ministryId || undefined,
      });
      toast.success("Space created");
      setOpen(false);
      setForm({ name: "", description: "", type: "MINISTRY", privacy: "MEMBERS_ONLY", ministryId: "" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: (v ?? "MINISTRY") as typeof f.type }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CHURCH_WIDE">Church-wide</SelectItem>
              <SelectItem value="MINISTRY">Ministry</SelectItem>
              <SelectItem value="GROUP_HUB">Group hub</SelectItem>
              <SelectItem value="EVENT_TEMP">Temporary (event/conference)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Privacy</Label>
          <Select value={form.privacy} onValueChange={(v) => setForm((f) => ({ ...f, privacy: (v ?? "MEMBERS_ONLY") as typeof f.privacy }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="MEMBERS_ONLY">Members only</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="INVITE_ONLY">Invite only</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Ministry</Label>
          <Select value={form.ministryId} onValueChange={(v) => setForm((f) => ({ ...f, ministryId: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {ministries.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={submit} disabled={pending || !form.name}>{pending ? "Creating…" : "Create space"}</Button>
      </div>
    </div>
  );
}
