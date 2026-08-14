import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/events/event-card";

export default async function EventsPage() {
  const session = await auth();
  const isMember = !!session?.user && session.user.status === "ACTIVE";

  const events = await prisma.event.findMany({
    where: {
      startAt: { gte: new Date() },
      cancelledAt: null,
      visibility: isMember ? { in: ["PUBLIC", "MEMBERS_ONLY"] } : "PUBLIC",
    },
    orderBy: { startAt: "asc" },
    include: {
      ministry: true,
      rsvps: isMember ? { where: { userId: session!.user.id } } : false,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">Events</h1>
      <p className="mt-1 text-muted-foreground">Everything happening at Living Word Community.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            slug={event.slug}
            title={event.title}
            startAt={event.startAt}
            location={event.location}
            ministryName={event.ministry?.name}
            rsvpStatus={isMember ? event.rsvps?.[0]?.status : undefined}
          />
        ))}
        {events.length === 0 && <p className="text-muted-foreground">No upcoming events right now — check back soon.</p>}
      </div>
    </div>
  );
}
