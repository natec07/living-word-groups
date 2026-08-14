import { NextResponse } from "next/server";
import { exportMembersCsvAction } from "@/server/actions/admin-users";

export async function GET() {
  const { filename, csv } = await exportMembersCsvAction();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
