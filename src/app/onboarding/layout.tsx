import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.status === "PENDING_APPROVAL") redirect("/pending-approval");
  if (session.user.status === "SUSPENDED" || session.user.status === "DELETED") redirect("/account-suspended");
  if (session.user.onboarded) redirect("/home");

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="flex h-16 items-center border-b border-border/70 bg-background px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
