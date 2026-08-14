"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resolveReportAction } from "@/server/actions/moderation";

export function ResolveReportButtons({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => { await resolveReportAction(reportId, "RESOLVED"); router.refresh(); })}
      >
        Resolve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => { await resolveReportAction(reportId, "DISMISSED"); router.refresh(); })}
      >
        Dismiss
      </Button>
    </div>
  );
}
