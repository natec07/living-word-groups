import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInboxConversations } from "@/server/data/messaging";

// Polled by the Messages tab so new conversations/replies show up while
// you're sitting on the inbox list, not just inside an open thread.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const conversations = await getInboxConversations(session.user.id);
  return NextResponse.json({ conversations });
}
