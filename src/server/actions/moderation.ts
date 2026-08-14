"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, requirePermission, logAudit } from "@/lib/authz";
import { reportSchema, type ReportInput } from "@/lib/validations/moderation";

export async function reportContentAction(input: ReportInput) {
  const user = await requireActiveUser();
  const parsed = reportSchema.parse(input);

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      reason: parsed.reason,
      details: parsed.details,
    },
  });
}

export async function resolveReportAction(reportId: string, action: "RESOLVED" | "DISMISSED", notes?: string) {
  const user = await requirePermission("reports.manage");
  const report = await prisma.report.update({
    where: { id: reportId },
    data: { status: action, resolvedAt: new Date() },
  });

  await prisma.moderationAction.create({
    data: {
      reportId,
      moderatorId: user.id,
      targetType: report.targetType,
      targetId: report.targetId,
      action: action === "RESOLVED" ? "RESTORE" : "NOTE",
      notes,
    },
  });

  await logAudit({ actorId: user.id, action: `report.${action.toLowerCase()}`, targetType: "Report", targetId: reportId });
  revalidatePath("/admin/reports");
}
