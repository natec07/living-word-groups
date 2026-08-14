import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MessageCircle, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getVisibleSpaceAndGroupIds } from "@/server/data/feed";
import { formatEventWhen, formatRelative, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Search" };

const RESULTS_PER_SECTION = 8;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const session = await auth();
  const userId = session!.user.id;

  // Posts are the one result type that can leak private discussion, so they're
  // scoped to the spaces and groups this member actually belongs to — the same
  // visibility rule the feed uses. Groups/events/members are directory-level
  // information that any active member can already browse, except hidden
  // groups, which stay hidden here too.
  const { spaceIds, groupIds } = await getVisibleSpaceAndGroupIds(userId);

  const contains = { contains: query, mode: "insensitive" as const };

  const [groups, events, members, posts] = query
    ? await Promise.all([
        prisma.group.findMany({
          where: {
            privacy: { not: "HIDDEN" },
            OR: [{ name: contains }, { description: contains }],
          },
          orderBy: { name: "asc" },
          take: RESULTS_PER_SECTION,
        }),
        prisma.event.findMany({
          where: { OR: [{ title: contains }, { description: contains }, { location: contains }] },
          orderBy: { startAt: "asc" },
          take: RESULTS_PER_SECTION,
        }),
        prisma.profile.findMany({
          where: {
            user: { status: "ACTIVE" },
            OR: [{ firstName: contains }, { lastName: contains }],
          },
          orderBy: { firstName: "asc" },
          take: RESULTS_PER_SECTION,
        }),
        prisma.post.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            OR: [{ title: contains }, { body: contains }],
            AND: [{ OR: [{ spaceId: { in: spaceIds } }, { groupId: { in: groupIds } }] }],
          },
          include: { author: { include: { profile: true } } },
          orderBy: { publishedAt: "desc" },
          take: RESULTS_PER_SECTION,
        }),
      ])
    : [[], [], [], []];

  const totalResults = groups.length + events.length + members.length + posts.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Search</h1>

      <form className="mt-6 flex gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search groups, events, members, and posts…"
          className="h-11 flex-1 rounded-lg border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" className="rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Search
        </button>
      </form>

      {!query && (
        <p className="mt-10 text-center text-muted-foreground">
          Search for a group, an event, someone in the church family, or a past discussion.
        </p>
      )}

      {query && totalResults === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          No results for &ldquo;{query}&rdquo;. Try a different word.
        </p>
      )}

      {groups.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Users className="h-4 w-4" /> Groups
          </h2>
          <div className="mt-2 divide-y divide-border/70 border-t border-border/70">
            {groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.slug}`} className="block py-3 hover:text-primary">
                <p className="font-medium">{g.name}</p>
                {g.description && <p className="mt-0.5 text-sm text-muted-foreground">{g.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> Events
          </h2>
          <div className="mt-2 divide-y divide-border/70 border-t border-border/70">
            {events.map((e) => (
              <Link key={e.id} href={`/events/${e.slug}`} className="block py-3 hover:text-primary">
                <p className="font-medium">{e.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatEventWhen(e.startAt)}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {members.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Members</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {members.map((m) => (
              <Link
                key={m.userId}
                href={`/directory/${m.userId}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/40"
              >
                <Avatar>
                  <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{initials(m.firstName, m.lastName)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{m.firstName} {m.lastName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MessageCircle className="h-4 w-4" /> Posts
          </h2>
          <div className="mt-2 divide-y divide-border/70 border-t border-border/70">
            {posts.map((p) => {
              const author = p.author.profile
                ? `${p.author.profile.firstName} ${p.author.profile.lastName}`
                : p.author.name ?? "Member";
              return (
                <Link key={p.id} href={`/community/posts/${p.id}`} className="block py-3 hover:text-primary">
                  {p.title && <p className="font-medium">{p.title}</p>}
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {author} · {formatRelative(p.publishedAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
