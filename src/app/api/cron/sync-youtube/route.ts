import { NextResponse } from "next/server";
import { syncYouTubeSermons } from "@/lib/youtube";

// Vercel Cron hits this on the schedule in vercel.json and automatically
// sends `Authorization: Bearer $CRON_SECRET` when that env var is set —
// this is what makes new sermons "just show up" without an admin visiting
// the dashboard. See .env.example for setup.
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncYouTubeSermons();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Sync failed" }, { status: 500 });
  }
}
