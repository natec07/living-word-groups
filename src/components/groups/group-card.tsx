import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import { JoinGroupButton } from "@/components/groups/join-group-button";

type Question = { id: string; question: string; required: boolean };

export function GroupCard({
  groupId,
  slug,
  name,
  description,
  memberCount,
  privacy,
  coverImage,
  leaderName,
  membershipStatus,
  questions,
}: {
  groupId: string;
  slug: string;
  name: string;
  description?: string | null;
  memberCount: number;
  privacy: "OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY" | "HIDDEN";
  coverImage?: string | null;
  leaderName?: string | null;
  membershipStatus: "ACTIVE" | "PENDING" | "MUTED" | "INVITED" | null;
  questions: Question[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/30">
      <Link href={`/groups/${slug}`} className="group block">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 341px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Users className="h-8 w-8" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/groups/${slug}`} className="block">
          <p className="font-semibold leading-snug hover:text-primary">{name}</p>
          {description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        </Link>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-0.5 text-xs text-muted-foreground">
            {leaderName && <p className="truncate">Led by {leaderName}</p>}
            <p className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {memberCount} {memberCount === 1 ? "member" : "members"}
            </p>
          </div>
          <div className="shrink-0">
            <JoinGroupButton groupId={groupId} privacy={privacy} membershipStatus={membershipStatus} questions={questions} />
          </div>
        </div>
      </div>
    </div>
  );
}
