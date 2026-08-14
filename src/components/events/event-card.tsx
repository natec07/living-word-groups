import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEventWhen } from "@/lib/format";

export function EventCard({
  slug,
  title,
  startAt,
  location,
  ministryName,
  rsvpStatus,
}: {
  slug: string;
  title: string;
  startAt: Date;
  location?: string | null;
  ministryName?: string | null;
  rsvpStatus?: "GOING" | "INTERESTED" | "NOT_GOING" | "WAITLISTED" | null;
}) {
  return (
    <Link href={`/events/${slug}`} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gold-foreground">
        <CalendarDays className="h-3.5 w-3.5" /> {formatEventWhen(startAt)}
      </p>
      <p className="mt-1.5 font-medium">{title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {location}
          </span>
        )}
        {ministryName && <Badge variant="outline">{ministryName}</Badge>}
        {rsvpStatus === "GOING" && <Badge>Going</Badge>}
        {rsvpStatus === "INTERESTED" && <Badge variant="secondary">Interested</Badge>}
      </div>
    </Link>
  );
}
