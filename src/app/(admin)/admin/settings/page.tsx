import { prisma } from "@/lib/prisma";
import { BrandingForm } from "@/components/admin/branding-form";

const DEFAULT_BRANDING = {
  churchName: "Living Word Community",
  tagline: "Grow in faith. Build community. Stay connected.",
  primaryColor: "#4a1220",
  accentColor: "#c39a4b",
  contactEmail: "hello@livingwordcommunity.church",
  registrationMode: "APPROVAL_REQUIRED",
};

export default async function AdminSettingsPage() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "branding" } });
  const branding = { ...DEFAULT_BRANDING, ...((setting?.value as object) ?? {}) };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Application Settings</h1>
        <p className="mt-1 text-muted-foreground">Church branding and registration policy.</p>
      </div>
      <BrandingForm initial={branding} />
      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Registration mode is currently <strong className="text-foreground">Approval required</strong> — every new
        account waits for a staff review before gaining access. Open and invitation-only modes are supported by the
        schema and can be wired up here in a future update.
      </div>
    </div>
  );
}
