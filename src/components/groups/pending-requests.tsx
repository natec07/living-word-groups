"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { approveGroupMemberAction, denyGroupMemberAction } from "@/server/actions/groups";
import { initials } from "@/lib/format";

type PendingMember = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  answers: { question: string; answer: string }[];
};

export function PendingRequests({ groupId, members }: { groupId: string; members: PendingMember[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (members.length === 0) return null;

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.userId} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{initials(m.firstName, m.lastName)}</AvatarFallback>
              </Avatar>
              <p className="font-medium">{m.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => startTransition(async () => { await approveGroupMemberAction(groupId, m.userId); router.refresh(); })}
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => startTransition(async () => { await denyGroupMemberAction(groupId, m.userId); router.refresh(); })}
              >
                <X className="h-4 w-4" /> Deny
              </Button>
            </div>
          </div>
          {m.answers.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              {m.answers.map((a, i) => (
                <div key={i}>
                  <p className="text-muted-foreground">{a.question}</p>
                  <p>{a.answer || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
