import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * For inner screens (not the persistent app shell chrome): back chevron,
 * large bold title, optional trailing context action/overflow menu.
 * Sticky by default so it stays put while the screen's content scrolls
 * underneath it.
 */
export function LargeTitleHeader({
  title,
  backHref,
  action,
  className,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex items-center gap-1 bg-background/85 px-4 pt-safe pb-3 sm:px-6",
        "supports-backdrop-filter:[backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]",
        className
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-glass-surface"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <h1 className="flex-1 truncate text-[22px] font-bold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}
