import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrVerifyConversationAccess, getMessagesSince } from "@/server/data/messaging";

// Polled by the group chat UI every few seconds for near-real-time
// delivery — there's no websocket/push infra in this app, so this is the
// mechanism new messages reach other members without a full page reload.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const hasAccess = await getOrVerifyConversationAccess(id, session.user.id);
  if (!hasAccess) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const afterParam = req.nextUrl.searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : new Date(0);
  const messages = await getMessagesSince(id, after);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      attachments: m.attachments as string[],
      audioUrl: m.audioUrl,
      audioDurationSeconds: m.audioDurationSeconds,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      senderName: m.sender.profile ? `${m.sender.profile.firstName} ${m.sender.profile.lastName}` : m.sender.name || "Member",
      senderAvatarUrl: m.sender.profile?.avatarUrl ?? null,
    })),
  });
}
