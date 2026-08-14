import Link from "next/link";
import { Megaphone, Search, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFeedPosts, type FeedSort } from "@/server/data/feed";
import { getLeaderGroupAndSpaceIds, getEffectivePermissions } from "@/lib/authz";
import { PostCard } from "@/components/posts/post-card";
import { TranslateToggle } from "@/components/language/translate-toggle";
import { FeedSortTabs } from "@/components/posts/feed-sort-tabs";
import { EventRailCard } from "@/components/events/event-rail-card";
import { GroupRailCard } from "@/components/groups/group-rail-card";
import { Card, CardContent } from "@/components/ui/card";
import { scriptureOfTheDay } from "@/lib/scripture";
import { formatEventWhen } from "@/lib/format";
import { RAIL_CLASS } from "@/lib/utils";

const QUICK_ACTIONS = [
  { href: "/groups", label: "Find a group", icon: Search },
  { href: "/events", label: "View upcoming events", icon: Users },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = (["recommended", "newest", "active"].includes(sortParam ?? "") ? sortParam : "recommended") as FeedSort;

  const session = await auth();
  const userId = session!.user.id;

  const [profile, permissions, leaderIds, posts, bookmarks, announcement, nextEvent, upcomingEvents, myGroupIds] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      getEffectivePermissions(userId),
      getLeaderGroupAndSpaceIds(userId),
      getFeedPosts({ userId, sort }),
      prisma.bookmark.findMany({ where: { userId, type: "POST" }, select: { postId: true } }),
      prisma.announcement.findFirst({
        where: { targetType: "EVERYONE", publishAt: { lte: new Date() }, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        orderBy: [{ priority: "desc" }, { publishAt: "desc" }],
      }),
      prisma.event.findFirst({ where: { startAt: { gte: new Date() } }, orderBy: { startAt: "asc" } }),
      prisma.event.findMany({
        where: { startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 5,
      }),
      prisma.groupMember.findMany({ where: { userId, status: "ACTIVE" }, select: { groupId: true } }),
    ]);

  const bookmarkedIds = new Set(bookmarks.map((b) => b.postId));
  const scripture = scriptureOfTheDay();

  const interestNames = profile?.ministryInterests ?? [];
  const recommendedGroups = interestNames.length
    ? await prisma.group.findMany({
        where: {
          id: { notIn: myGroupIds.map((g) => g.groupId) },
          privacy: { not: "HIDDEN" },
          OR: interestNames.map((name) => ({ name: { contains: name.split(" ")[0], mode: "insensitive" as const } })),
        },
        take: 6,
      })
    : await prisma.group.findMany({
        where: { id: { notIn: myGroupIds.map((g) => g.groupId) }, privacy: "OPEN" },
        take: 6,
        orderBy: { memberCount: "desc" },
      });

  const canModerateGlobally = permissions.includes("content.moderate");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <section>
        <h1 className="text-3xl font-semibold">
          Welcome back{profile?.firstName ? `, ${profile.firstName}` : ""}.
        </h1>
        <p className="mt-1 text-muted-foreground">Let&apos;s continue growing together.</p>

        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-primary">Today&apos;s Scripture</p>
            <p className="mt-1 italic text-foreground">&ldquo;{scripture.text}&rdquo;</p>
            <p className="mt-1 text-sm text-muted-foreground">{scripture.ref}</p>
          </CardContent>
        </Card>

        {announcement && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{announcement.title}</p>
              <TranslateToggle text={announcement.body} className="text-sm text-muted-foreground" />
            </div>
          </div>
        )}

        {nextEvent && (
          <p className="mt-3 text-sm text-muted-foreground">
            Next up: <span className="font-medium text-foreground">{nextEvent.title}</span> ·{" "}
            {formatEventWhen(nextEvent.startAt)}
          </p>
        )}
      </section>

      <section>
        <div className={RAIL_CLASS}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-transform duration-150 hover:border-primary/40 active:scale-[0.97]"
            >
              <action.icon className="h-4 w-4 text-primary" />
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Your feed</h2>
          <FeedSortTabs current={sort} basePath="/home" />
        </div>
        <div className="divide-y divide-border/70 border-t border-border/70">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isBookmarked={bookmarkedIds.has(post.id)}
              canModerate={
                canModerateGlobally ||
                post.authorId === userId ||
                (post.groupId ? leaderIds.groupIds.has(post.groupId) : false) ||
                (post.spaceId ? leaderIds.spaceIds.has(post.spaceId) : false)
              }
            />
          ))}
          {posts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Your feed is quiet right now — join a group or space to see posts here.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {upcomingEvents.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">
              See all
            </Link>
          </div>
          <div className={RAIL_CLASS}>
            {upcomingEvents.map((event) => (
              <EventRailCard
                key={event.id}
                slug={event.slug}
                title={event.title}
                startAt={event.startAt}
                location={event.location}
                coverImage={event.coverImage}
              />
            ))}
          </div>
        </section>
      )}

      {recommendedGroups.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recommended groups</h2>
            <Link href="/groups" className="text-sm text-muted-foreground hover:text-foreground">
              Browse all
            </Link>
          </div>
          <div className={RAIL_CLASS}>
            {recommendedGroups.map((group) => (
              <GroupRailCard
                key={group.id}
                slug={group.slug}
                name={group.name}
                coverImage={group.coverImage}
                memberCount={group.memberCount}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
