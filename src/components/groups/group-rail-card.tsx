import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";

export function GroupRailCard({
  slug,
  name,
  coverImage,
  memberCount,
}: {
  slug: string;
  name: string;
  coverImage?: string | null;
  memberCount: number;
}) {
  return (
    <Link href={`/groups/${slug}`} className="group block w-36 shrink-0 snap-start sm:w-40">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="(min-width: 640px) 160px, 144px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Users className="h-8 w-8" />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium group-hover:text-primary">{name}</p>
      <p className="text-xs text-muted-foreground">
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </p>
    </Link>
  );
}
