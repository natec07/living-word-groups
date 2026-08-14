"use client";

import { Logo } from "@/components/logo";
import { NavLink } from "@/components/layout/nav-link";
import { SIDEBAR_NAV_ITEMS, ADMIN_NAV_ITEM } from "@/lib/nav";
import { Separator } from "@/components/ui/separator";

export function AppSidebar({ canAccessAdmin }: { canAccessAdmin: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
      <div className="px-2">
        <Logo href="/home" />
      </div>
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        {canAccessAdmin && (
          <>
            <Separator className="my-3" />
            <NavLink item={ADMIN_NAV_ITEM} />
          </>
        )}
      </nav>
    </aside>
  );
}
