import { NextResponse } from "next/server";
import { exportEventAttendeesAction } from "@/server/actions/events";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { filename, csv } = await exportEventAttendeesAction(id);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
