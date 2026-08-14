"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestJoinGroupAction, leaveGroupAction } from "@/server/actions/groups";

type Question = { id: string; question: string; required: boolean };

export function JoinGroupButton({
  groupId,
  privacy,
  membershipStatus,
  questions,
}: {
  groupId: string;
  privacy: "OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY" | "HIDDEN";
  membershipStatus: "ACTIVE" | "PENDING" | "MUTED" | "INVITED" | null;
  questions: Question[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  if (membershipStatus === "ACTIVE") {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await leaveGroupAction(groupId);
            router.refresh();
          })
        }
      >
        {pending ? "Leaving…" : "Leave group"}
      </Button>
    );
  }

  if (membershipStatus === "PENDING") {
    return (
      <Button variant="outline" disabled>
        Request pending
      </Button>
    );
  }

  if (privacy === "INVITE_ONLY" || privacy === "HIDDEN") {
    return (
      <Button variant="outline" disabled>
        Invite only
      </Button>
    );
  }

  async function submit() {
    startTransition(async () => {
      const status = await requestJoinGroupAction({
        groupId,
        answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
      });
      setOpen(false);
      toast.success(status === "ACTIVE" ? "You're in!" : "Request sent to the group leader.");
      router.refresh();
    });
  }

  if (privacy === "OPEN") {
    return (
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await requestJoinGroupAction({ groupId, answers: [] });
            toast.success("You're in!");
            router.refresh();
          })
        }
      >
        {pending ? "Joining…" : "Join group"}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Request to join</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to join</DialogTitle>
            <DialogDescription>The group leader will review your answers before approving.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label htmlFor={q.id}>
                  {q.question} {q.required && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id={q.id}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
