import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { daysAgo } from "@/lib/dates";

export default async function AdminAnalyticsPage() {
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  // No video/watch metrics here: the Watch feature was removed from the app,
  // so those counters could only ever report stale pre-removal numbers.
  const [
    dailyActive,
    weeklyActive,
    postEngagement,
    groupParticipation,
    messagesSent,
    eventRsvps,
    memberGrowth,
    pendingApprovals,
  ] = await Promise.all([
    prisma.user.count({ where: { lastActiveAt: { gte: daysAgo(1) } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
    prisma.reaction.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.groupMember.count({ where: { status: "ACTIVE" } }),
    prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.eventRSVP.count({ where: { respondedAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { status: "PENDING_APPROVAL" } }),
  ]);

  const cards = [
    { label: "Daily active members", value: dailyActive },
    { label: "Weekly active members", value: weeklyActive },
    { label: "Reactions this week", value: postEngagement },
    { label: "Active group memberships", value: groupParticipation },
    { label: "Messages sent this week", value: messagesSent },
    { label: "Event RSVPs (30d)", value: eventRsvps },
    { label: "New members (30d)", value: memberGrowth },
    { label: "Pending approvals", value: pendingApprovals },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Aggregate engagement only — we intentionally don&apos;t track individual browsing behavior.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
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
