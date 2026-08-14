import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppTopbar } from "@/components/layout/app-topbar";
import { PushRegistration } from "@/components/push/push-registration";
import { WebPushRegistration } from "@/components/push/web-push-registration";
import { PreferredLanguageProvider } from "@/components/language/preferred-language-context";

export function AppShell({
  children,
  canAccessAdmin,
  unreadNotifications,
  unreadMessages,
  preferredLanguage = "en",
  user,
}: {
  children: React.ReactNode;
  canAccessAdmin: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  preferredLanguage?: string;
  user: { name: string; email: string; image?: string | null; firstName?: string | null; lastName?: string | null };
}) {
  return (
    <PreferredLanguageProvider language={preferredLanguage}>
      <div className="flex min-h-screen">
        <PushRegistration />
        <WebPushRegistration />
        <AppSidebar canAccessAdmin={canAccessAdmin} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar
            unreadNotifications={unreadNotifications}
            unreadMessages={unreadMessages}
            canAccessAdmin={canAccessAdmin}
            user={user}
          />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>
        <BottomNav />
      </div>
    </PreferredLanguageProvider>
  );
}
