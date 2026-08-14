import "server-only";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/authz";

// Minor-safety rule: an adult who isn't a leader/staff/admin cannot start
// a direct conversation with a minor, and vice versa. Leaders/staff are
// allowed through so pastoral care and group communication still works;
// every such conversation is still fully auditable via the Message table.
export async function canMessage(senderId: string, recipientId: string) {
  if (senderId === recipientId) return false;

  const [sender, recipient] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: senderId } }),
    prisma.profile.findUnique({ where: { userId: recipientId } }),
  ]);
  if (!sender || !recipient) return false;
  if (!sender.isMinor && !recipient.isMinor) return true;

  const permissions = await getEffectivePermissions(sender.isMinor ? recipientId : senderId);
  const adultIsLeader =
    permissions.includes("content.moderate") || permissions.includes("groups.manage_all") || permissions.includes("prayer.manage_prayer_team");
  return adultIsLeader;
}

export async function getOrVerifyConversationAccess(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!membership;
}

// Admin safeguarding audit — every DM is readable by staff with audit.view
// so leader/member conversations stay accountable (this is what backs the
// "requiresChaperone" flag on Conversation and the minor-safety rule in
// canMessage above). Never expose these outside the gated admin audit page.
export async function getAuditConversations(params: { take?: number; skip?: number } = {}) {
  const { take = 50, skip = 0 } = params;
  return prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
    include: {
      members: { include: { user: { include: { profile: true } } } },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, attachments: true, audioUrl: true, createdAt: true, senderId: true },
      },
    },
  });
}

export async function getAuditConversationThread(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: { include: { user: { include: { profile: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { include: { profile: true } } } },
    },
  });
}

// Every group is backed by a single group-wide Conversation (1:1 via
// Conversation.groupId), created lazily on first access. ConversationMember
// rows for it are kept in sync with active GroupMember status by
// syncGroupConversationMember — never edited directly anywhere else.
export async function getOrCreateGroupConversation(groupId: string) {
  const existing = await prisma.conversation.findUnique({ where: { groupId } });
  if (existing) return existing;

  const activeMembers = await prisma.groupMember.findMany({
    where: { groupId, status: { in: ["ACTIVE", "MUTED"] } },
    select: { userId: true },
  });

  return prisma.conversation.create({
    data: {
      isGroup: true,
      groupId,
      members: { create: activeMembers.map((m) => ({ userId: m.userId })) },
    },
  });
}

export async function syncGroupConversationMember(groupId: string, userId: string, active: boolean) {
  const conversation = await getOrCreateGroupConversation(groupId);
  if (active) {
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
      update: {},
      create: { conversationId: conversation.id, userId },
    });
  } else {
    await prisma.conversationMember.deleteMany({ where: { conversationId: conversation.id, userId } });
  }
}

export async function getGroupChatMessages(groupId: string) {
  const conversation = await getOrCreateGroupConversation(groupId);
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { sender: { include: { profile: true } } },
  });
  return { conversationId: conversation.id, messages };
}

// Polling endpoint for near-real-time delivery — the app has no
// websocket/push infra, so clients re-fetch messages newer than the last
// one they have on a short interval instead.
export async function getMessagesSince(conversationId: string, afterCreatedAt: Date) {
  return prisma.message.findMany({
    where: { conversationId, deletedAt: null, createdAt: { gt: afterCreatedAt } },
    orderBy: { createdAt: "asc" },
    include: { sender: { include: { profile: true } } },
  });
}

export type InboxConversation = {
  id: string;
  otherName: string;
  otherAvatarUrl: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unread: boolean;
};

// The DM inbox only ever lists 1:1 conversations (isGroup: false) — group
// chats live under their own group's page, not mixed into this list, so a
// group conversation never gets misrendered here as if it were one person.
export async function getInboxConversations(userId: string): Promise<InboxConversation[]> {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId, conversation: { isGroup: false } },
    include: {
      conversation: {
        include: {
          members: { where: { userId: { not: userId } }, include: { user: { include: { profile: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  return memberships
    .map((m) => {
      const other = m.conversation.members[0]?.user;
      const profile = other?.profile;
      const lastMessage = m.conversation.messages[0];
      const lastMessagePreview = lastMessage
        ? lastMessage.body ||
          (lastMessage.audioUrl ? "🎤 Voice message" : (lastMessage.attachments as string[])?.length > 0 ? "📷 Photo" : null)
        : null;
      return {
        id: m.conversation.id,
        otherName: profile ? `${profile.firstName} ${profile.lastName}` : other?.name || "Member",
        otherAvatarUrl: profile?.avatarUrl ?? null,
        lastMessageBody: lastMessagePreview,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
        lastMessageSenderId: lastMessage?.senderId ?? null,
        unread: !!(lastMessage && (!m.lastReadAt || lastMessage.createdAt > m.lastReadAt) && lastMessage.senderId !== userId),
      };
    })
    .filter((c) => c.lastMessageAt)
    .sort((a, b) => new Date(b.lastMessageAt!).getTime() - new Date(a.lastMessageAt!).getTime());
}

/** Conversations with at least one message newer than the member's last read time. */
export async function getUnreadConversationCount(userId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (memberships.length === 0) return 0;

  const results = await Promise.all(
    memberships.map((m) =>
      prisma.message.count({
        where: {
          conversationId: m.conversationId,
          senderId: { not: userId },
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      })
    )
  );
  return results.filter((count) => count > 0).length;
}
