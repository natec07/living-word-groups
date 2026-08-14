import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/authz";
import { getGroupChatMessages } from "@/server/data/messaging";
import { GroupChatThread, type ChatMessage } from "@/components/messaging/group-chat-thread";
import { GroupInfoSheet } from "@/components/groups/group-info-sheet";
import { PostComposer } from "@/components/posts/post-composer";
import { JoinGroupButton } from "@/components/groups/join-group-button";
import { PendingRequests } from "@/components/groups/pending-requests";
import { EventRailCard } from "@/components/events/event-rail-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { RAIL_CLASS } from "@/lib/utils";

export default async function GroupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      members: {
        where: { status: "ACTIVE" },
        include: { user: { include: { profile: true } } },
        orderBy: { role: "desc" },
        take: 24,
      },
      events: { where: { startAt: { gte: new Date() } }, orderBy: { startAt: "asc" }, take: 6 },
    },
  });
  if (!group) notFound();

  const [myMembership, permissions, pendingMembers] = await Promise.all([
    prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } }),
    getEffectivePermissions(userId),
    prisma.groupMember.findMany({
      where: { groupId: group.id, status: "PENDING" },
      include: { user: { include: { profile: true } }, answers: { include: { question: true } } },
    }),
  ]);

  const isLeader = myMembership?.status === "ACTIVE" && (myMembership.role === "LEADER" || myMembership.role === "CO_LEADER");
  const canAnnounce = isLeader || permissions.includes("content.moderate");
  const isActiveMember = myMembership?.status === "ACTIVE" || myMembership?.status === "MUTED";

  const leaders = group.members.filter((m) => m.role === "LEADER" || m.role === "CO_LEADER");
  const primaryLeader = leaders[0];
  const leaderName = primaryLeader
    ? primaryLeader.user.profile
      ? `${primaryLeader.user.profile.firstName} ${primaryLeader.user.profile.lastName}`
      : primaryLeader.user.name
    : null;

  const infoContent = (
    <>
      {group.description && (
        <div>
          <p className="mb-1 text-sm font-medium">About</p>
          <p className="whitespace-pre-line text-muted-foreground">{group.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {leaderName && (
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Led by {leaderName}
          </span>
        )}
        {group.meetingSchedule && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {group.meetingSchedule}
          </span>
        )}
        {group.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {group.location}
          </span>
        )}
      </div>

      {group.rules && (
        <div>
          <p className="mb-1 text-sm font-medium">Group guidelines</p>
          <p className="whitespace-pre-line text-muted-foreground">{group.rules}</p>
        </div>
      )}

      {canAnnounce && (
        <div>
          <p className="mb-2 text-sm font-medium">Post an announcement</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Announcements also show up on the Community tab for everyone in this group.
          </p>
          <PostComposer
            groupId={group.id}
            fixedType="ANNOUNCEMENT"
            placeholder={`Announce something to ${group.name}…`}
          />
        </div>
      )}

      {group.events.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Upcoming events</p>
          <div className={RAIL_CLASS}>
            {group.events.slice(0, 4).map((event) => (
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
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Members ({group.memberCount})</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Avatar>
                <AvatarImage src={m.user.profile?.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{initials(m.user.profile?.firstName, m.user.profile?.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{m.user.profile ? `${m.user.profile.firstName} ${m.user.profile.lastName}` : m.user.name}</p>
                {(m.role === "LEADER" || m.role === "CO_LEADER") && (
                  <p className="text-xs text-muted-foreground">{m.role === "LEADER" ? "Leader" : "Co-Leader"}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLeader && (
        <div>
          <p className="mb-2 text-sm font-medium">Requests ({pendingMembers.length})</p>
          <PendingRequests
            groupId={group.id}
            members={pendingMembers.map((m) => ({
              userId: m.userId,
              name: m.user.profile ? `${m.user.profile.firstName} ${m.user.profile.lastName}` : m.user.name || "Member",
              avatarUrl: m.user.profile?.avatarUrl,
              firstName: m.user.profile?.firstName,
              lastName: m.user.profile?.lastName,
              answers: m.answers.map((a) => ({ question: a.question.question, answer: a.answer })),
            }))}
          />
          {pendingMembers.length === 0 && <p className="text-muted-foreground">No pending requests.</p>}
        </div>
      )}

      <div>
        <JoinGroupButton
          groupId={group.id}
          privacy={group.privacy}
          membershipStatus={myMembership?.status === "REMOVED" ? null : (myMembership?.status ?? null)}
          questions={group.questions}
        />
      </div>
    </>
  );

  if (!isActiveMember) {
    return (
      <div className="pb-10">
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted sm:aspect-[4/1]">
          {group.coverImage ? (
            <Image src={group.coverImage} alt="" fill loading="eager" sizes="100vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Users className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        </div>

        <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="mt-1 font-medium text-foreground">
                {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
              </p>
            </div>
            <JoinGroupButton
              groupId={group.id}
              privacy={group.privacy}
              membershipStatus={myMembership?.status === "REMOVED" ? null : (myMembership?.status ?? null)}
              questions={group.questions}
            />
          </div>
          {infoContent}
        </div>
      </div>
    );
  }

  const { conversationId, messages } = await getGroupChatMessages(group.id);
  const chatMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    body: m.body,
    attachments: (m.attachments as string[]) ?? [],
    audioUrl: m.audioUrl,
    audioDurationSeconds: m.audioDurationSeconds,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    senderName: m.sender.profile ? `${m.sender.profile.firstName} ${m.sender.profile.lastName}` : m.sender.name || "Member",
    senderAvatarUrl: m.sender.profile?.avatarUrl ?? null,
  }));
  const media = chatMessages.filter((m) => m.attachments.length > 0);

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-2xl flex-col px-4 sm:px-6 md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 border-b border-border py-4">
        <Avatar>
          <AvatarFallback>
            <Users className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{group.name}</p>
          <p className="text-xs text-muted-foreground">
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <GroupInfoSheet groupName={group.name}>
          {media.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Shared photos</p>
              <div className="grid grid-cols-3 gap-1">
                {media.slice(0, 24).map((m) =>
                  m.attachments.map((url) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                      <Image src={url} alt="" fill sizes="33vw" className="object-cover" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {infoContent}
        </GroupInfoSheet>
      </div>

      <GroupChatThread conversationId={conversationId} currentUserId={userId} initialMessages={chatMessages} />
    </div>
  );
}
