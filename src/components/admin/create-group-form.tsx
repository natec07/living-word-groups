"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGroupAction } from "@/server/actions/admin-content";
import { groupPrivacyLevels } from "@/lib/validations/group-admin";

type Option = { id: string; name: string };

export function CreateGroupForm({ spaces, members }: { spaces: Option[]; members: Option[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    meetingSchedule: "",
    location: "",
    onlineLink: "",
    privacy: "OPEN" as (typeof groupPrivacyLevels)[number],
    ageRestriction: "",
    spaceId: "",
    leaderId: "",
  });

  if (!open) return <Button onClick={() => setOpen(true)}>New group</Button>;

  function submit() {
    startTransition(async () => {
      await createGroupAction({
        name: form.name,
        description: form.description || undefined,
        meetingSchedule: form.meetingSchedule || undefined,
        location: form.location || undefined,
        onlineLink: form.onlineLink || undefined,
        privacy: form.privacy,
        ageRestriction: (form.ageRestriction || undefined) as never,
        spaceId: form.spaceId || undefined,
        leaderId: form.leaderId || undefined,
        questions: questions.filter((q) => q.trim()),
      });
      toast.success("Group created");
      setOpen(false);
      setForm({ name: "", description: "", meetingSchedule: "", location: "", onlineLink: "", privacy: "OPEN", ageRestriction: "", spaceId: "", leaderId: "" });
      setQuestions([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. High School Small Group" />
        </div>
        <div className="space-y-1.5">
          <Label>Privacy</Label>
          <Select value={form.privacy} onValueChange={(v) => setForm((f) => ({ ...f, privacy: (v ?? "OPEN") as typeof f.privacy }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open — anyone can join</SelectItem>
              <SelectItem value="APPROVAL_REQUIRED">Approval required</SelectItem>
              <SelectItem value="INVITE_ONLY">Invite only</SelectItem>
              <SelectItem value="HIDDEN">Hidden (leadership)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Age restriction</Label>
          <Select value={form.ageRestriction} onValueChange={(v) => setForm((f) => ({ ...f, ageRestriction: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="YOUTH">Youth</SelectItem>
              <SelectItem value="YOUNG_ADULT">Young adult</SelectItem>
              <SelectItem value="ADULT">Adult</SelectItem>
              <SelectItem value="SENIOR">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Meeting schedule</Label>
          <Input value={form.meetingSchedule} onChange={(e) => setForm((f) => ({ ...f, meetingSchedule: e.target.value }))} placeholder="Thursdays, 7:00 PM" />
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
          <Label>Parent space</Label>
          <Select value={form.spaceId} onValueChange={(v) => setForm((f) => ({ ...f, spaceId: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Leader</Label>
          <Select value={form.leaderId} onValueChange={(v) => setForm((f) => ({ ...f, leaderId: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="Assign later" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      {form.privacy === "APPROVAL_REQUIRED" && (
        <div className="space-y-2">
          <Label>Membership questions</Label>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={q}
                onChange={(e) => setQuestions((qs) => qs.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder="e.g. Why would you like to join this group?"
              />
              <Button variant="ghost" size="icon" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, ""])}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={submit} disabled={pending || !form.name}>{pending ? "Creating…" : "Create group"}</Button>
      </div>
    </div>
  );
}
