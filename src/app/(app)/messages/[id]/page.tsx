import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrVerifyConversationAccess } from "@/server/data/messaging";
import { markConversationReadAction } from "@/server/actions/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DmThread } from "@/components/messaging/dm-thread";
import type { ChatMessage } from "@/components/messaging/group-chat-thread";
import { initials } from "@/lib/format";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const hasAccess = await getOrVerifyConversationAccess(id, userId);
  if (!hasAccess) notFound();

  const [conversation, messages] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id },
      include: { members: { where: { userId: { not: userId } }, include: { user: { include: { profile: true } } } } },
    }),
    prisma.message.findMany({
      where: { conversationId: id, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { sender: { include: { profile: true } } },
    }),
  ]);
  if (!conversation) notFound();

  await markConversationReadAction(id);

  const other = conversation.members[0]?.user;
  const otherProfile = other?.profile;
  const otherName = otherProfile ? `${otherProfile.firstName} ${otherProfile.lastName}` : other?.name || "Member";

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

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-2xl flex-col px-4 sm:px-6 md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 border-b border-border py-4">
        <Avatar>
          <AvatarImage src={otherProfile?.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{initials(otherProfile?.firstName, otherProfile?.lastName)}</AvatarFallback>
        </Avatar>
        <p className="font-medium">{otherName}</p>
      </div>

      <DmThread conversationId={id} currentUserId={userId} initialMessages={chatMessages} />
    </div>
  );
}
