import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadConversationCount } from "@/server/data/messaging";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  if (session.user.status === "PENDING_APPROVAL") redirect("/pending-approval");
  if (session.user.status === "SUSPENDED" || session.user.status === "DELETED") redirect("/account-suspended");
  if (!session.user.onboarded) redirect("/onboarding");

  const [profile, unreadNotifications, unreadMessages] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    getUnreadConversationCount(session.user.id),
  ]);

  const canAccessAdmin = session.user.roles.some((r) => r === "ADMINISTRATOR" || r === "PASTOR_STAFF");

  return (
    <AppShell
      canAccessAdmin={canAccessAdmin}
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
      preferredLanguage={profile?.preferredLanguage ?? "en"}
      user={{
        name: session.user.name ?? "Member",
        email: session.user.email,
        image: profile?.avatarUrl ?? session.user.image,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
      }}
    >
      {children}
    </AppShell>
  );
}
