import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FeedSort } from "@/server/data/feed";

const OPTIONS: { value: FeedSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "active", label: "Most active" },
];

export function FeedSortTabs({ current, basePath }: { current: FeedSort; basePath: string }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1 text-sm">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={`${basePath}?sort=${opt.value}`}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium transition-colors",
            current === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
