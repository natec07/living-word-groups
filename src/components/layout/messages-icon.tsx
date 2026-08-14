import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function MessagesIcon({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/messages"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : "Messages"}
    >
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
