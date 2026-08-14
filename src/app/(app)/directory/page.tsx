import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string }>;
}) {
  const { q, group } = await searchParams;

  const [members, groups] = await Promise.all([
    prisma.profile.findMany({
      where: {
        user: { status: "ACTIVE" },
        ...(q ? { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } : {}),
        ...(group ? { user: { status: "ACTIVE", groupMemberships: { some: { groupId: group, status: "ACTIVE" } } } } : {}),
      },
      include: { user: true },
      orderBy: { firstName: "asc" },
      take: 60,
    }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Member Directory</h1>
      <p className="mt-1 text-muted-foreground">Find and connect with your church family.</p>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="h-10 flex-1 min-w-40 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select name="group" defaultValue={group} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Filter
        </button>
      </form>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Link key={m.userId} href={`/directory/${m.userId}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/40">
            <Avatar>
              <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>{initials(m.firstName, m.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{m.firstName} {m.lastName}</p>
            </div>
          </Link>
        ))}
        {members.length === 0 && <p className="text-muted-foreground">No members match those filters.</p>}
      </div>
    </div>
  );
}
