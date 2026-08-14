import Link from "next/link";
import { Flame } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Treatment mirrors living-word.net's mark: a solid brand-primary circle
// with a white glyph, paired with a bold, letter-spaced wordmark.
export function Logo({ href = "/", className, iconOnly = false }: { href?: string; className?: string; iconOnly?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Flame className="h-4 w-4" aria-hidden="true" fill="currentColor" strokeWidth={0} />
      </span>
      {!iconOnly && (
        <span className="hidden text-base font-extrabold tracking-tight text-foreground uppercase sm:inline">{APP_NAME}</span>
      )}
    </Link>
  );
}
