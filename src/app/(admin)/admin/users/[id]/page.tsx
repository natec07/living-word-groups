import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { RoleAssignment } from "@/components/admin/role-assignment";
import { ResetOnboardingButton } from "@/components/admin/reset-onboarding-button";
import type { RoleKeyType } from "@/lib/rbac";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      roles: { include: { role: true } },
      groupMemberships: { where: { status: "ACTIVE" }, include: { group: true } },
    },
  });
  if (!user) notFound();

  const [postCount, prayerCount, eventRsvpCount] = await Promise.all([
    prisma.post.count({ where: { authorId: id } }),
    prisma.prayerRequest.count({ where: { authorId: id } }),
    prisma.eventRSVP.count({ where: { userId: id, status: "GOING" } }),
  ]);

  const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.name || "Unnamed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>{user.status.replace("_", " ")}</Badge>
          </div>
        </div>
        <UserRowActions userId={user.id} status={user.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xl font-semibold">{postCount}</p><p className="text-xs text-muted-foreground">Posts</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-semibold">{prayerCount}</p><p className="text-xs text-muted-foreground">Prayer requests</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-semibold">{eventRsvpCount}</p><p className="text-xs text-muted-foreground">Events attending</p></CardContent></Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Groups</h2>
        <div className="flex flex-wrap gap-2">
          {user.groupMemberships.map((m) => (
            <Badge key={m.groupId} variant="outline">{m.group.name}</Badge>
          ))}
          {user.groupMemberships.length === 0 && <p className="text-sm text-muted-foreground">Not in any groups.</p>}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Roles</h2>
        <RoleAssignment userId={user.id} currentRoles={user.roles.map((r) => r.role.key as RoleKeyType)} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Account</h2>
        <div className="flex flex-wrap gap-2">
          <ResetOnboardingButton userId={user.id} />
        </div>
      </div>
    </div>
  );
}
