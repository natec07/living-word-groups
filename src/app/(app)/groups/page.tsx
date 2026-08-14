import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupCard } from "@/components/groups/group-card";

export default async function GroupsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [groups, myMemberships] = await Promise.all([
    prisma.group.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      include: {
        questions: { orderBy: { order: "asc" } },
        members: {
          where: { role: { in: ["LEADER", "CO_LEADER"] }, status: "ACTIVE" },
          include: { user: { include: { profile: true } } },
          orderBy: { role: "asc" },
          take: 1,
        },
      },
    }),
    prisma.groupMember.findMany({ where: { userId, status: { in: ["ACTIVE", "PENDING"] } } }),
  ]);

  const myMembershipByGroup = new Map(myMemberships.map((m) => [m.groupId, m.status]));
  const myGroups = groups.filter((g) => myMembershipByGroup.has(g.id));
  const otherGroups = groups.filter((g) => !myMembershipByGroup.has(g.id));

  function leaderName(group: (typeof groups)[number]) {
    const leader = group.members[0];
    if (!leader) return null;
    return leader.user.profile ? `${leader.user.profile.firstName} ${leader.user.profile.lastName}` : leader.user.name;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold">Groups</h1>
        <p className="mt-1 text-muted-foreground">Find your people — small groups, teams, and classes.</p>
      </div>

      {myGroups.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your groups</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((group) => (
              <GroupCard
                key={group.id}
                groupId={group.id}
                slug={group.slug}
                name={group.name}
                description={group.description}
                memberCount={group.memberCount}
                privacy={group.privacy}
                coverImage={group.coverImage}
                leaderName={leaderName(group)}
                membershipStatus={
                  (myMembershipByGroup.get(group.id) as "ACTIVE" | "PENDING" | "MUTED" | "INVITED") ?? null
                }
                questions={group.questions}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Discover groups</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherGroups.map((group) => (
            <GroupCard
              key={group.id}
              groupId={group.id}
              slug={group.slug}
              name={group.name}
              description={group.description}
              memberCount={group.memberCount}
              privacy={group.privacy}
              coverImage={group.coverImage}
              leaderName={leaderName(group)}
              membershipStatus={null}
              questions={group.questions}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
