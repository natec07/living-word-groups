import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignInForm } from "@/components/auth/sign-in-form";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Sign in to continue to Living Word Community.</p>
      <Card className="mt-8">
        <CardContent className="space-y-6 p-6">
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <MagicLinkForm ctaLabel="Send me a sign-in link instead" />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Request an account
        </Link>
      </p>
    </div>
  );
}
