import { notFound } from "next/navigation";
import { CalendarDays, Download, MapPin, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RsvpButtons } from "@/components/events/rsvp-buttons";
import { ButtonLink } from "@/components/ui/button-link";
import { formatEventWhen } from "@/lib/format";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const isMember = !!session?.user && session.user.status === "ACTIVE";

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      ministry: true,
      leaders: { include: { user: { include: { profile: true } } } },
      registrationQuestions: { orderBy: { order: "asc" } },
      _count: { select: { rsvps: true } },
    },
  });
  if (!event) notFound();
  if (event.visibility !== "PUBLIC" && !isMember) notFound();

  const myRsvp = isMember
    ? await prisma.eventRSVP.findUnique({ where: { eventId_userId: { eventId: event.id, userId: session!.user.id } } })
    : null;

  const goingCount = await prisma.eventRSVP.count({ where: { eventId: event.id, status: "GOING" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">{event.title}</h1>
      <div className="mt-3 space-y-1.5 text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> {formatEventWhen(event.startAt)}
        </p>
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {event.location}
          </p>
        )}
        {event.capacity && (
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4" /> {goingCount} / {event.capacity} spots filled
          </p>
        )}
        {event.ministry && <p>Hosted by {event.ministry.name}</p>}
      </div>

      {event.description && <p className="mt-5 whitespace-pre-line text-foreground/90">{event.description}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isMember ? (
          <RsvpButtons eventId={event.id} initialStatus={myRsvp?.status} />
        ) : (
          <ButtonLink href="/sign-in">Sign in to RSVP</ButtonLink>
        )}
        <a
          href={`/events/${event.slug}/ics`}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Download className="h-4 w-4" /> Add to calendar
        </a>
      </div>

      {event.leaders.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium">Event leaders</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.leaders
              .map((l) => (l.user.profile ? `${l.user.profile.firstName} ${l.user.profile.lastName}` : l.user.name))
              .join(", ")}
          </p>
        </div>
      )}

      {event.onlineLink && isMember && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">Joining online?</p>
          <a href={event.onlineLink} className="text-sm text-primary hover:underline">
            {event.onlineLink}
          </a>
        </div>
      )}
    </div>
  );
}
