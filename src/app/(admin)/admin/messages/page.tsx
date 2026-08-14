import { redirect } from "next/navigation";
import Link from "next/link";
import { requireActiveUser, getEffectivePermissions } from "@/lib/authz";
import { getAuditConversations } from "@/server/data/messaging";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";

function memberName(member: { user: { name: string | null; profile: { firstName: string; lastName: string } | null } }) {
  return member.user.profile ? `${member.user.profile.firstName} ${member.user.profile.lastName}` : member.user.name || "Member";
}

export default async function AdminMessagesPage() {
  const user = await requireActiveUser();
  const permissions = await getEffectivePermissions(user.id);
  if (!permissions.includes("audit.view")) redirect("/admin");

  const conversations = await getAuditConversations({ take: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Message Audit</h1>
        <p className="mt-1 text-muted-foreground">
          Every direct and group conversation on the platform, for safeguarding oversight. Opening a conversation is itself logged.
        </p>
      </div>

      <div className="space-y-2">
        {conversations.map((c) => {
          const names = c.members.map(memberName);
          const lastMessage = c.messages[0];
          return (
            <Link
              key={c.id}
              href={`/admin/messages/${c.id}`}
              className="block rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{c.title || names.join(", ") || "Empty conversation"}</p>
                    {c.isGroup && <Badge variant="outline">Group</Badge>}
                    {c.requiresChaperone && <Badge>Chaperoned</Badge>}
                  </div>
                  {lastMessage && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {lastMessage.body ||
                        (lastMessage.audioUrl
                          ? "🎤 Voice message"
                          : (lastMessage.attachments as string[])?.length > 0
                            ? "📷 Photo"
                            : "")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{c._count.messages} messages</p>
                  {lastMessage && <p className="mt-0.5">{formatRelative(lastMessage.createdAt)}</p>}
                </div>
              </div>
            </Link>
          );
        })}
        {conversations.length === 0 && <p className="text-muted-foreground">No conversations yet.</p>}
      </div>
    </div>
  );
}
