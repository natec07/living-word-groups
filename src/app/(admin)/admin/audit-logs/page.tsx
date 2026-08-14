import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { include: { profile: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">A record of sensitive administrative and pastoral-care actions.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="divide-y divide-border">
          {logs.map((log) => {
            const actorName = log.actor?.profile ? `${log.actor.profile.firstName} ${log.actor.profile.lastName}` : log.actor?.name || "System";
            return (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div>
                  <span className="font-medium">{actorName}</span>{" "}
                  <span className="text-muted-foreground">{log.action.replace(/_/g, " ").replace(/\./g, " → ")}</span>
                  {log.targetType && <span className="text-muted-foreground"> · {log.targetType}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{formatRelative(log.createdAt)}</span>
              </div>
            );
          })}
          {logs.length === 0 && <p className="p-4 text-muted-foreground">No audit events yet.</p>}
        </div>
      </div>
    </div>
  );
}
