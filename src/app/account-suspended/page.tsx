import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { signOutAction } from "@/server/actions/session";

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold">This account is no longer active</h1>
      <p className="mt-2 text-muted-foreground">
        Please contact the church office if you believe this is a mistake.
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
