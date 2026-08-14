"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MessagesIcon } from "@/components/layout/messages-icon";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      // Functional update returns the *same* boolean reference when
      // unchanged, so React bails out of re-rendering on every scroll
      // pixel — only the threshold crossing itself triggers a render.
      setScrolled((prev) => (window.scrollY > threshold) === prev ? prev : window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function AppTopbar({
  unreadNotifications,
  unreadMessages,
  canAccessAdmin,
  user,
}: {
  unreadNotifications: number;
  unreadMessages: number;
  canAccessAdmin?: boolean;
  user: { name: string; email: string; image?: string | null; firstName?: string | null; lastName?: string | null };
}) {
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 px-4 pt-safe transition-[background-color,border-color] duration-(--motion-base) ease-(--motion-spring) sm:px-6",
        "supports-backdrop-filter:[backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]",
        scrolled
          ? "border-b border-glass-surface-border bg-glass-surface-strong"
          : "border-b border-transparent bg-glass-surface/70"
      )}
    >
      <div className="md:hidden">
        <Logo href="/home" />
      </div>
      <form action="/search" className="hidden flex-1 max-w-md md:block">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            placeholder="Search the community…"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </form>
      <div className="ml-auto flex items-center gap-1">
        {/* The search field above is desktop-only, so without this icon there
            is no way to reach search on a phone — which is the primary way
            this app is used. */}
        <Link
          href="/search"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        >
          <Search className="h-5 w-5" />
        </Link>
        <MessagesIcon unreadCount={unreadMessages} />
        <NotificationBell unreadCount={unreadNotifications} />
        <UserMenu {...user} canAccessAdmin={canAccessAdmin} />
      </div>
    </header>
  );
}
