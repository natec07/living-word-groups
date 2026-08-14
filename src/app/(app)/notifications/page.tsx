import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationItem } from "@/components/notifications/notification-item";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <NotificationItem key={n.id} id={n.id} title={n.title} body={n.body} deepLink={n.deepLink} isRead={n.isRead} createdAt={n.createdAt} />
        ))}
        {notifications.length === 0 && <p className="text-muted-foreground">You&apos;re all caught up.</p>}
      </div>
    </div>
  );
}
