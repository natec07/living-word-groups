import Link from "next/link";
import { PrimaryButton, GlassButton } from "@/components/glass/buttons";
import { InstallPrompt } from "@/components/install/install-prompt";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Welcome to Groups</h1>
      <div className="flex flex-wrap justify-center gap-3">
        <PrimaryButton size="lg" nativeButton={false} render={<Link href="/register" />}>
          Request an account
        </PrimaryButton>
        <GlassButton size="lg" nativeButton={false} render={<Link href="/sign-in" />}>
          Log in
        </GlassButton>
      </div>
      <InstallPrompt />
    </div>
  );
}
