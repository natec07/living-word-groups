import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { initials } from "@/lib/format";
import { isFieldVisible } from "@/lib/profile-visibility";

export default async function MemberProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: targetUserId } = await params;
  const session = await auth();
  const viewerId = session!.user.id;
  const isOwner = viewerId === targetUserId;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId, status: "ACTIVE" },
    include: {
      profile: true,
      groupMemberships: { where: { status: "ACTIVE" }, include: { group: true } },
    },
  });
  if (!user || !user.profile) notFound();

  const p = user.profile;
  const name = `${p.firstName} ${p.lastName}`;
  const canSee = (field: string) => isFieldVisible(p.visibility, field, isOwner);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={p.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-lg">{initials(p.firstName, p.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">{name}</h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Member since {user.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          {isOwner && <ButtonLink href="/profile/edit" variant="outline">Edit profile</ButtonLink>}
        </div>

        {canSee("bio") && p.bio && <p className="mt-4 text-foreground/90">{p.bio}</p>}

        {canSee("ageRange") && p.ageRange && (
          <p className="mt-3 text-sm text-muted-foreground">{p.ageRange.replace("_", " ").toLowerCase()}</p>
        )}

        {p.ministryInterests.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Ministry interests</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {p.ministryInterests.map((m) => (
                <Badge key={m} variant="secondary">{m}</Badge>
              ))}
            </div>
          </div>
        )}

        {user.groupMemberships.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Groups</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {user.groupMemberships.map((m) => (
                <Badge key={m.groupId} variant="outline">{m.group.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
