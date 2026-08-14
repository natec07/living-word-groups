import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CreateEventForm } from "@/components/admin/create-event-form";
import { EventAdminActions } from "@/components/admin/event-admin-actions";
import { formatEventWhen } from "@/lib/format";

export default async function AdminEventsPage() {
  const [events, ministries] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startAt: "desc" },
      take: 40,
      include: { _count: { select: { rsvps: true } } },
    }),
    prisma.ministry.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
      </div>

      <CreateEventForm ministries={ministries} />

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{formatEventWhen(e.startAt)}</p>
                <div className="mt-1 flex gap-2">
                  <Badge variant="secondary">{e._count.rsvps} RSVPs</Badge>
                  {e.cancelledAt && <Badge variant="outline">Cancelled</Badge>}
                </div>
              </div>
              <EventAdminActions eventId={e.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
