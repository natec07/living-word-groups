"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resetOnboardingAction } from "@/server/actions/admin-users";

export function ResetOnboardingButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await resetOnboardingAction(userId);
          toast.success("Onboarding reset");
          router.refresh();
        })
      }
    >
      Reset onboarding
    </Button>
  );
}
