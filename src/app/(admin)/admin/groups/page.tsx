import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArchiveToggleButton } from "@/components/admin/archive-toggle-button";
import { CreateGroupForm } from "@/components/admin/create-group-form";
import { CreateSpaceForm } from "@/components/admin/create-space-form";
import { SetGroupLeader } from "@/components/admin/set-group-leader";
import { CoverImageUpload } from "@/components/admin/cover-image-upload";

export default async function AdminGroupsPage() {
  const [groups, spaces, ministries, members, pendingCounts] = await Promise.all([
    prisma.group.findMany({
      orderBy: { name: "asc" },
      include: { members: { where: { role: "LEADER" }, include: { user: { include: { profile: true } } }, take: 1 } },
    }),
    prisma.space.findMany({ orderBy: { name: "asc" } }),
    prisma.ministry.findMany({ orderBy: { name: "asc" } }),
    prisma.profile.findMany({
      where: { user: { status: "ACTIVE" } },
      select: { userId: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.groupMember.groupBy({ by: ["groupId"], where: { status: "PENDING" }, _count: true }),
  ]);

  const memberOptions = members.map((m) => ({ id: m.userId, name: `${m.firstName} ${m.lastName}` }));
  const pendingByGroup = new Map(pendingCounts.map((p) => [p.groupId, p._count]));
  const totalPending = pendingCounts.reduce((sum, p) => sum + p._count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Groups &amp; Spaces</h1>
        <p className="mt-1 text-muted-foreground">Create and manage every community, its leadership, and membership requests.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{groups.length}</p><p className="mt-1 text-xs text-muted-foreground">Groups</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{spaces.length}</p><p className="mt-1 text-xs text-muted-foreground">Spaces</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{groups.filter((g) => g.archivedAt).length}</p><p className="mt-1 text-xs text-muted-foreground">Archived groups</p></CardContent></Card>
        <Card className={totalPending > 0 ? "border-gold/40 bg-gold/5" : undefined}>
          <CardContent className="p-4"><p className="text-2xl font-semibold">{totalPending}</p><p className="mt-1 text-xs text-muted-foreground">Pending join requests</p></CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Spaces</h2>
          <CreateSpaceForm ministries={ministries} />
        </div>
        <div className="space-y-2">
          {spaces.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
              <div className="flex items-center gap-4">
                <CoverImageUpload id={s.id} type="space" currentUrl={s.coverImage} />
                <div>
                  <p className="font-medium">{s.name}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="outline">{s.type.replace("_", " ")}</Badge>
                    <Badge variant="outline">{s.privacy.replace("_", " ")}</Badge>
                    <Badge variant="secondary">{s.memberCount} members</Badge>
                  </div>
                </div>
              </div>
              <ArchiveToggleButton id={s.id} archived={!!s.archivedAt} type="space" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Groups</h2>
          <CreateGroupForm spaces={spaces} members={memberOptions} />
        </div>
        <div className="space-y-2">
          {groups.map((g) => {
            const pending = pendingByGroup.get(g.id) ?? 0;
            const leader = g.members[0]?.user;
            return (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-4">
                  <CoverImageUpload id={g.id} type="group" currentUrl={g.coverImage} />
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{g.privacy.replace("_", " ")}</Badge>
                      <Badge variant="secondary">{g.memberCount} members</Badge>
                      {g.archivedAt && <Badge variant="outline">Archived</Badge>}
                      {pending > 0 && (
                        <Link href={`/groups/${g.slug}`} className="text-xs font-medium text-primary hover:underline">
                          {pending} pending request{pending === 1 ? "" : "s"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SetGroupLeader
                    groupId={g.id}
                    currentLeaderId={leader?.id}
                    members={memberOptions}
                  />
                  <ArchiveToggleButton id={g.id} archived={!!g.archivedAt} type="group" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
