"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { duplicateEventAction, cancelEventAction } from "@/server/actions/admin-events";

export function EventAdminActions({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/admin/events/${eventId}/export`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Export attendees
      </a>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await duplicateEventAction(eventId);
            toast.success("Event duplicated one week later");
            router.refresh();
          })
        }
      >
        Duplicate
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await cancelEventAction(eventId);
            toast.success("Event cancelled");
            router.refresh();
          })
        }
      >
        Cancel
      </Button>
    </div>
  );
}
