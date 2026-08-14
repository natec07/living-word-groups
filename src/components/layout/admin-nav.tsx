"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ sections }: { sections: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive(s.href)
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-glass-surface-border bg-glass-surface text-muted-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <nav className="hidden w-48 shrink-0 flex-col gap-1 md:flex">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(s.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
