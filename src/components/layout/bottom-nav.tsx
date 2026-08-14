"use client";

import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav";
import { GlassSurface } from "@/components/glass/glass-surface";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  function renderItem(item: (typeof BOTTOM_NAV_ITEMS)[number]) {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <a
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
      >
        <span
          className={cn(
            "flex h-7 w-11 items-center justify-center rounded-full transition-[background-color] duration-(--motion-base) ease-(--motion-spring)",
            active && "bg-primary/12"
          )}
        >
          <Icon
            className={cn(
              "h-[22px] w-[22px] transition-colors duration-(--motion-fast)",
              active ? "text-primary" : "text-foreground/55"
            )}
            strokeWidth={active ? 2.4 : 2}
          />
        </span>
        <span className={cn("transition-colors duration-(--motion-fast)", active ? "text-primary" : "text-foreground/55")}>
          {item.label}
        </span>
      </a>
    );
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden"
      aria-label="Primary"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <GlassSurface strength="strong" className="flex w-full items-stretch rounded-full px-1">
          {BOTTOM_NAV_ITEMS.map(renderItem)}
        </GlassSurface>
      </div>
    </nav>
  );
}
