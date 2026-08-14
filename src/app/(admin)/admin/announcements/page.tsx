import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CreateAnnouncementForm } from "@/components/admin/create-announcement-form";
import { formatRelative } from "@/lib/format";

export default async function AdminAnnouncementsPage() {
  const [announcements, groups] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { author: true } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Announcements</h1>
      <CreateAnnouncementForm groups={groups} />

      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">{a.title}</p>
              <Badge variant={a.priority === "URGENT" ? "default" : "outline"}>{a.priority}</Badge>
              {a.pinned && <Badge variant="secondary">Pinned</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.targetType.replace(/_/g, " ")} · {formatRelative(a.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
