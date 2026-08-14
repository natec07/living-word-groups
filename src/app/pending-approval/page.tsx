import { HourglassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { signOutAction } from "@/server/actions/session";

export default function PendingApprovalPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <HourglassIcon className="h-10 w-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold">Your account is awaiting approval</h1>
      <p className="mt-2 text-muted-foreground">
        Thanks for your patience — a member of our team is reviewing your request. You&apos;ll receive an
        email as soon as you&apos;re approved.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink variant="outline" href="/">
          Back to home
        </ButtonLink>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
