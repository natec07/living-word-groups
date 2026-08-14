import { MailCheck } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <MailCheck className="h-10 w-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
      <p className="mt-2 text-muted-foreground">
        We&apos;ve sent you a secure sign-in link. It expires shortly, so use it soon.
      </p>
    </div>
  );
}
