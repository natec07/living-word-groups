import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { InstallSettingsCard } from "@/components/install/install-settings-card";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const prefs = await prisma.notificationPreference.findMany({ where: { userId } });
  const prefMap = Object.fromEntries(prefs.map((p) => [p.category, p.frequency]));

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account, notifications, and appearance.</p>
      </div>

      <InstallSettingsCard />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Appearance</h2>
        <Card><CardContent className="p-5"><ThemeToggle /></CardContent></Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Notifications</h2>
        <NotificationPreferencesForm preferences={prefMap} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Security</h2>
        <Card><CardContent className="space-y-5 p-5">
          <ChangeEmailForm currentEmail={session!.user.email} />
          <Separator />
          <ChangePasswordForm />
        </CardContent></Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-destructive">Danger zone</h2>
        <Card className="border-destructive/30"><CardContent className="p-5">
          <p className="mb-3 text-sm text-muted-foreground">
            Requesting deletion notifies our team to review and remove your account and personal data.
          </p>
          <DeleteAccountButton />
        </CardContent></Card>
      </section>
    </div>
  );
}
