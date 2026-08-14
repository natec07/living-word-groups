"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setGroupLeaderAction } from "@/server/actions/admin-content";

export function SetGroupLeader({ groupId, currentLeaderId, members }: { groupId: string; currentLeaderId?: string; members: { id: string; name: string }[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <Select
      value={currentLeaderId}
      onValueChange={(userId) =>
        userId &&
        startTransition(async () => {
          await setGroupLeaderAction(groupId, userId);
          toast.success("Leader updated");
          router.refresh();
        })
      }
    >
      <SelectTrigger className="w-44">
        <SelectValue placeholder="No leader">
          {(value: string | null) => (value ? (members.find((m) => m.id === value)?.name ?? "No leader") : "No leader")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
