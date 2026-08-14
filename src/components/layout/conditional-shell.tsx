import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { getUnreadConversationCount } from "@/server/data/messaging";

// Some routes (e.g. Events) are visible to both guests and signed-in
// members at the same URL. This picks the right chrome: the marketing
// header/footer for guests, or the full app shell for active members.
export async function ConditionalShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isMember = session?.user && session.user.status === "ACTIVE" && session.user.onboarded;

  if (!isMember) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    );
  }

  const userId = session.user.id;
  const [profile, unreadNotifications, unreadMessages] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    getUnreadConversationCount(userId),
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
