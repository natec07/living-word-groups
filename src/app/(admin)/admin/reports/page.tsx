import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ResolveReportButtons } from "@/components/admin/resolve-report-buttons";
import { formatRelative } from "@/lib/format";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: { in: ["OPEN", "REVIEWING"] } },
    include: { reporter: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-muted-foreground">Content and member reports awaiting review.</p>
      </div>

      <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.targetType}</Badge>
                  <Badge>{r.reason.replace(/_/g, " ")}</Badge>
                </div>
                {r.details && <p className="mt-2 text-sm">{r.details}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Reported by {r.reporter.profile ? `${r.reporter.profile.firstName} ${r.reporter.profile.lastName}` : r.reporter.name} ·{" "}
                  {formatRelative(r.createdAt)}
                </p>
              </div>
              <ResolveReportButtons reportId={r.id} />
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-muted-foreground">No open reports. Nice and quiet.</p>}
      </div>
    </div>
  );
}
