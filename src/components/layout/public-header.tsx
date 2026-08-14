import Link from "next/link";
import { Logo } from "@/components/logo";
import { GlassButton, PrimaryButton } from "@/components/glass/buttons";

const links = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
];

export function PublicHeader() {
  return (
    <header
      className={`sticky top-0 z-40 border-b border-glass-surface-border bg-glass-surface/70 pt-safe
        supports-backdrop-filter:[backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <GlassButton size="sm" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign in
          </GlassButton>
          <PrimaryButton size="sm" nativeButton={false} render={<Link href="/register" />}>
            <span className="hidden sm:inline">Request an account</span>
            <span className="sm:hidden">Join</span>
          </PrimaryButton>
        </div>
      </div>
    </header>
  );
}
