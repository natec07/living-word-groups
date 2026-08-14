"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { archiveGroupAction, archiveSpaceAction } from "@/server/actions/admin-content";

export function ArchiveToggleButton({ id, archived, type }: { id: string; archived: boolean; type: "group" | "space" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const action = type === "group" ? archiveGroupAction : archiveSpaceAction;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await action(id, !archived);
          router.refresh();
        })
      }
    >
      {archived ? "Unarchive" : "Archive"}
    </Button>
  );
}
