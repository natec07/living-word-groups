"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, formatRelative } from "@/lib/format";
import type { InboxConversation } from "@/server/data/messaging";

const POLL_INTERVAL_MS = 4000;

export function MessagesInbox({ initialConversations }: { initialConversations: InboxConversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/conversations/inbox");
        if (!res.ok || cancelled) return;
        const data: { conversations: InboxConversation[] } = await res.json();
        setConversations(data.conversations);
      } catch {
        // Transient network hiccup — the next poll tick retries.
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-6 space-y-2">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/messages/${c.id}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <Avatar>
            <AvatarImage src={c.otherAvatarUrl ?? undefined} alt="" />
            <AvatarFallback>{initials(c.otherName.split(" ")[0], c.otherName.split(" ")[1])}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className={c.unread ? "font-semibold" : "font-medium"}>{c.otherName}</p>
            {c.lastMessageBody && <p className="truncate text-sm text-muted-foreground">{c.lastMessageBody}</p>}
          </div>
          {c.lastMessageAt && (
            <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(new Date(c.lastMessageAt))}</span>
          )}
          {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </Link>
      ))}
      {conversations.length === 0 && <p className="text-muted-foreground">No conversations yet.</p>}
    </div>
  );
}
