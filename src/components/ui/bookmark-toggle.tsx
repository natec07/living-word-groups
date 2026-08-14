"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookmarkToggle({
  initialSaved,
  onToggle,
  className,
}: {
  initialSaved: boolean;
  onToggle: () => Promise<boolean | void>;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Save for later"}
      onClick={() =>
        startTransition(async () => {
          setSaved((s) => !s);
          await onToggle();
        })
      }
      className={cn(
        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        saved ? "border-gold/40 bg-gold/10 text-gold-foreground" : "border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
