"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationReadAction } from "@/server/actions/notifications";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationItem({
  id,
  title,
  body,
  deepLink,
  isRead,
  createdAt,
}: {
  id: string;
  title: string;
  body?: string | null;
  deepLink?: string | null;
  isRead: boolean;
  createdAt: Date;
}) {
  const [, startTransition] = useTransition();

  return (
    <Link
      href={deepLink || "#"}
      onClick={() => {
        if (!isRead) startTransition(() => markNotificationReadAction(id));
      }}
      className={cn("flex items-start gap-3 rounded-xl border p-4 transition-colors", isRead ? "border-border" : "border-primary/30 bg-primary/5")}
    >
      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
      <div className={cn(isRead && "pl-5")}>
        <p className="font-medium">{title}</p>
        {body && <p className="text-sm text-muted-foreground">{body}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{formatRelative(createdAt)}</p>
      </div>
    </Link>
  );
}
