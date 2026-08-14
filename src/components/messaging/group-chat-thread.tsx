"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupChatComposer } from "@/components/messaging/group-chat-composer";
import { ImageLightbox } from "@/components/media/image-lightbox";
import { VoiceMessagePlayer } from "@/components/messaging/voice-message-player";
import { TranslateToggle } from "@/components/language/translate-toggle";
import { markConversationReadAction } from "@/server/actions/messaging";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  attachments: string[];
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
};

const POLL_INTERVAL_MS = 3000;

function chatInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function GroupChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef(initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString());

  useEffect(() => {
    markConversationReadAction(conversationId);
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastCreatedAtRef.current)}`
        );
        if (!res.ok || cancelled) return;
        const data: { messages: ChatMessage[] } = await res.json();
        if (!data.messages?.length) return;
        setMessages((prev) => [...prev, ...data.messages]);
        lastCreatedAtRef.current = data.messages[data.messages.length - 1].createdAt;
        markConversationReadAction(conversationId);
      } catch {
        // Transient network hiccup — the next poll tick retries.
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
              {!mine && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={m.senderAvatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-[10px]">{chatInitials(m.senderName)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                  mine ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
              >
                {!mine && <p className="mb-0.5 text-xs font-medium opacity-70">{m.senderName}</p>}
                {m.attachments.length > 0 && (
                  <div className={cn("mb-1.5 grid gap-1", m.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                    {m.attachments.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className={cn(
                          "relative overflow-hidden rounded-lg",
                          m.attachments.length === 1 ? "h-64 w-64 max-w-full" : "h-36 w-36"
                        )}
                        aria-label="View full-size image"
                      >
                        <Image src={url} alt="" fill sizes="256px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {m.audioUrl && (
                  <div className={cn(m.body && "mb-1.5")}>
                    <VoiceMessagePlayer url={m.audioUrl} durationSeconds={m.audioDurationSeconds} mine={mine} />
                  </div>
                )}
                {m.body && <TranslateToggle text={m.body} />}
                <p className="mt-1 text-[10px] opacity-70">{formatRelative(new Date(m.createdAt))}</p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-muted-foreground">No messages yet — say hello!</p>}
        <div ref={bottomRef} />
      </div>
      <GroupChatComposer conversationId={conversationId} />
      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
