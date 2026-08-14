import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireActiveUser, getEffectivePermissions, logAudit } from "@/lib/authz";
import { getAuditConversationThread } from "@/server/data/messaging";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";

function displayName(person: { name: string | null; profile: { firstName: string; lastName: string } | null }) {
  return person.profile ? `${person.profile.firstName} ${person.profile.lastName}` : person.name || "Member";
}

export default async function AdminMessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActiveUser();
  const permissions = await getEffectivePermissions(user.id);
  if (!permissions.includes("audit.view")) redirect("/admin");

  const conversation = await getAuditConversationThread(id);
  if (!conversation) notFound();

  // Viewing a private conversation is itself a sensitive action — every
  // open is logged with who looked and which conversation, same as
  // pastoral care notes.
  await logAudit({ actorId: user.id, action: "messages.audit_viewed", targetType: "Conversation", targetId: id });

  const names = conversation.members.map((m) => displayName(m.user));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Message Audit
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{conversation.title || names.join(", ") || "Conversation"}</h1>
          {conversation.isGroup && <Badge variant="outline">Group</Badge>}
          {conversation.requiresChaperone && <Badge>Chaperoned</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Between {names.join(", ")}</p>
      </div>

      <div className="space-y-3">
        {conversation.messages.map((m) => {
          const attachments = (m.attachments as string[]) ?? [];
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium">
                {displayName(m.sender)} <span className="font-normal text-muted-foreground">· {formatRelative(m.createdAt)}</span>
              </p>
              {m.deletedAt ? (
                <p className="mt-1 italic text-muted-foreground">Message deleted</p>
              ) : (
                <>
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element -- audit page renders arbitrary user-uploaded URLs, not worth next/image's optimizer here
                        <img key={url} src={url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  {m.audioUrl && (
                    <audio controls src={m.audioUrl} className="mt-2 h-10 w-full max-w-sm">
                      Your browser doesn&apos;t support inline audio playback.
                    </audio>
                  )}
                  {m.body && <p className="mt-1 whitespace-pre-line">{m.body}</p>}
                </>
              )}
            </div>
          );
        })}
        {conversation.messages.length === 0 && <p className="text-muted-foreground">No messages in this conversation yet.</p>}
      </div>
    </div>
  );
}
