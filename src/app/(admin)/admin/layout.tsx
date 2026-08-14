import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { AdminNav } from "@/components/layout/admin-nav";
import { getUnreadConversationCount } from "@/server/data/messaging";
import { getEffectivePermissions } from "@/lib/authz";

const BASE_ADMIN_SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/groups", label: "Groups & Spaces" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/roles", label: "Roles & Permissions" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const isAdminOrStaff = session.user.roles.some((r) => r === "ADMINISTRATOR" || r === "PASTOR_STAFF");
  if (!isAdminOrStaff) redirect("/home");

  const [profile, unreadNotifications, unreadMessages, permissions] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    getUnreadConversationCount(session.user.id),
    getEffectivePermissions(session.user.id),
  ]);

  // Message Audit reads every private conversation on the platform, so it
  // stays hidden from the nav (and the page itself redirects away) unless
  // the viewer holds audit.view — not every admin/staff role by default.
  const adminSections = permissions.includes("audit.view")
    ? [...BASE_ADMIN_SECTIONS, { href: "/admin/messages", label: "Message Audit" }]
    : BASE_ADMIN_SECTIONS;

  return (
    <AppShell
      canAccessAdmin
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
      preferredLanguage={profile?.preferredLanguage ?? "en"}
      user={{
        name: session.user.name ?? "Staff",
        email: session.user.email,
        image: profile?.avatarUrl ?? session.user.image,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:gap-8">
        <AdminNav sections={adminSections} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShell>
  );
}
