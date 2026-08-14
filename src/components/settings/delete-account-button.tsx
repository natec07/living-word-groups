"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestAccountDeletionAction } from "@/server/actions/security";

export function DeleteAccountButton() {
  const [requested, setRequested] = useState(false);
  const [pending, startTransition] = useTransition();

  if (requested) {
    return <p className="text-sm text-muted-foreground">Request received — our team will follow up with you.</p>;
  }

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await requestAccountDeletionAction();
          setRequested(true);
          toast.success("Deletion request submitted");
        })
      }
    >
      Request account deletion
    </Button>
  );
}
