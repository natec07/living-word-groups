"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { canMessage, getOrVerifyConversationAccess } from "@/server/data/messaging";
import { notifyUser } from "@/lib/notify";

export async function startConversationAction(recipientId: string, firstMessage: string) {
  const user = await requireActiveUser();
  const allowed = await canMessage(user.id, recipientId);
  if (!allowed) {
    throw new Error("Direct messaging isn't available between these accounts. A leader can help facilitate.");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [{ members: { some: { userId: user.id } } }, { members: { some: { userId: recipientId } } }],
    },
  });

  const conversation =
    existing ??
    (await prisma.conversation.create({
      data: { isGroup: false, members: { create: [{ userId: user.id }, { userId: recipientId }] } },
    }));

  if (firstMessage.trim()) {
    await prisma.message.create({ data: { conversationId: conversation.id, senderId: user.id, body: firstMessage } });
    await notifyUser({
      userId: recipientId,
      category: "NEW_MESSAGE",
      title: `New message from ${user.name ?? "a member"}`,
      body: firstMessage,
      deepLink: `/messages/${conversation.id}`,
    });
  }

  redirect(`/messages/${conversation.id}`);
}

export async function sendMessageAction(
  conversationId: string,
  body: string,
  attachmentUrls: string[] = [],
  voice?: { url: string; durationSeconds: number }
) {
  const user = await requireActiveUser();
  const hasAccess = await getOrVerifyConversationAccess(conversationId, user.id);
  if (!hasAccess) throw new Error("FORBIDDEN");
  if (!body.trim() && attachmentUrls.length === 0 && !voice) throw new Error("A message needs text, an image, or a voice note.");

  await prisma.message.create({
    data: {
      conversationId,
      senderId: user.id,
      body,
      attachments: attachmentUrls,
      audioUrl: voice?.url,
      audioDurationSeconds: voice?.durationSeconds,
    },
  });
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { lastReadAt: new Date() },
  });

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { group: true } });
  const preview = body.trim() || (voice ? "🎤 Voice message" : attachmentUrls.length > 0 ? "📷 Photo" : undefined);
  const senderName = user.name ?? "A member";
  const title = conversation?.isGroup
    ? `${senderName} in ${conversation.group?.name ?? conversation.title ?? "your group"}`
    : `New message from ${senderName}`;
  const deepLink = conversation?.isGroup && conversation.group ? `/groups/${conversation.group.slug}` : `/messages/${conversationId}`;

  const otherMembers = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: user.id } },
  });
  for (const m of otherMembers) {
    await notifyUser({ userId: m.userId, category: "NEW_MESSAGE", title, body: preview, deepLink });
  }

  revalidatePath(`/messages/${conversationId}`);
}

export async function markConversationReadAction(conversationId: string) {
  const user = await requireActiveUser();
  await prisma.conversationMember.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
}
