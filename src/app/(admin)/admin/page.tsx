import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

async function getCounts() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalMembers, activeMembers, newMembers, pendingApprovals, activeGroups, upcomingEvents, reportedContent, weeklyPosts] =
    await Promise.all([
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "ACTIVE", lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.group.count({ where: { archivedAt: null } }),
      prisma.event.count({ where: { startAt: { gte: new Date() }, cancelledAt: null } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

  return {
    totalMembers,
    activeMembers,
    newMembers,
    pendingApprovals,
    activeGroups,
    upcomingEvents,
    reportedContent,
    weeklyPosts,
  };
}

export default async function AdminOverviewPage() {
  const counts = await getCounts();

  const cards = [
    { label: "Total members", value: counts.totalMembers },
    { label: "Active this week", value: counts.activeMembers },
    { label: "New members (30d)", value: counts.newMembers },
    { label: "Pending approvals", value: counts.pendingApprovals, highlight: counts.pendingApprovals > 0 },
    { label: "Active groups", value: counts.activeGroups },
    { label: "Upcoming events", value: counts.upcomingEvents },
    { label: "Reported content", value: counts.reportedContent, highlight: counts.reportedContent > 0 },
    { label: "Posts this week", value: counts.weeklyPosts },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin Overview</h1>
        <p className="mt-1 text-muted-foreground">A snapshot of what&apos;s happening at Living Word Community.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className={c.highlight ? "border-gold/40 bg-gold/5" : undefined}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
