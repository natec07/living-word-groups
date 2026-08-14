"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveUserAction, suspendUserAction, reactivateUserAction } from "@/server/actions/admin-users";

export function UserRowActions({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {status === "PENDING_APPROVAL" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await approveUserAction(userId);
              toast.success("Approved");
              router.refresh();
            })
          }
        >
          Approve
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await suspendUserAction(userId);
              toast.success("Suspended");
              router.refresh();
            })
          }
        >
          Suspend
        </Button>
      )}
      {status === "SUSPENDED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reactivateUserAction(userId);
              toast.success("Reactivated");
              router.refresh();
            })
          }
        >
          Reactivate
        </Button>
      )}
    </div>
  );
}
