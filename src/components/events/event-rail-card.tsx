import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function EventRailCard({
  slug,
  title,
  startAt,
  location,
  coverImage,
  className,
}: {
  slug: string;
  title: string;
  startAt: Date;
  location?: string | null;
  coverImage?: string | null;
  className?: string;
}) {
  return (
    <Link href={`/events/${slug}`} className={cn("group block w-44 shrink-0 snap-start sm:w-52", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="(min-width: 640px) 208px, 176px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <CalendarDays className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-lg bg-background/95 px-2 py-1 text-center leading-none shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-primary">{format(startAt, "MMM")}</p>
          <p className="text-sm font-bold">{format(startAt, "d")}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">{title}</p>
      {location && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      )}
    </Link>
  );
}
