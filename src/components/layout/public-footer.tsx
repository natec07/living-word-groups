import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_TAGLINE } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Living Word</p>
            <Link href="/about" className="block text-muted-foreground hover:text-foreground">
              About us
            </Link>
            <Link href="/events" className="block text-muted-foreground hover:text-foreground">
              Events
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Get connected</p>
            <Link href="/register" className="block text-muted-foreground hover:text-foreground">
              Request an account
            </Link>
            <Link href="/sign-in" className="block text-muted-foreground hover:text-foreground">
              Member sign in
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Visit us</p>
            <p className="text-muted-foreground">482 Cedar Grove Road, Rockland, NY</p>
            <p className="text-muted-foreground">Sundays · 10:00 AM &amp; 6:00 PM</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Living Word Community. All rights reserved.
      </div>
    </footer>
  );
}
