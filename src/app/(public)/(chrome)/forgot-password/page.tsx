import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-muted-foreground">
        Enter your email and we&apos;ll send you a secure sign-in link. Once you&apos;re in, you can set a new
        password from Settings → Security.
      </p>
      <Card className="mt-8">
        <CardContent className="p-6">
          <MagicLinkForm ctaLabel="Send sign-in link" />
        </CardContent>
      </Card>
    </div>
  );
}
