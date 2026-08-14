"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rsvpToEventAction } from "@/server/actions/events";
import { cn } from "@/lib/utils";

const OPTIONS: { value: "GOING" | "INTERESTED" | "NOT_GOING"; label: string }[] = [
  { value: "GOING", label: "Going" },
  { value: "INTERESTED", label: "Interested" },
  { value: "NOT_GOING", label: "Not going" },
];

export function RsvpButtons({ eventId, initialStatus }: { eventId: string; initialStatus?: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={status === opt.value ? "default" : "outline"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                const result = await rsvpToEventAction(eventId, opt.value);
                setStatus(result);
                if (result === "WAITLISTED") toast.info("This event is full — you've been added to the waitlist.");
                router.refresh();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Couldn't update your RSVP.");
              }
            })
          }
          className={cn(status === "WAITLISTED" && opt.value === "GOING" && "border-gold/50 bg-gold/10 text-gold-foreground")}
        >
          {status === "WAITLISTED" && opt.value === "GOING" ? "Waitlisted" : opt.label}
        </Button>
      ))}
    </div>
  );
}
