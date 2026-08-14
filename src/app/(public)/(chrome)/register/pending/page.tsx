import { HourglassIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

export default function RegisterPendingPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <HourglassIcon className="h-10 w-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold">Thanks for requesting an account</h1>
      <p className="mt-2 text-muted-foreground">
        Our team reviews every new account request. We&apos;ll email you as soon as you&apos;re approved —
        it&apos;s usually quick!
      </p>
      <ButtonLink className="mt-6" variant="outline" href="/">
        Back to home
      </ButtonLink>
    </div>
  );
}
