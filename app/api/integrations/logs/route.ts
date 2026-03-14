// =============================================================================
// GET  /api/integrations/logs          — list log files or read a specific date
// GET  /api/integrations/logs?date=YYYY-MM-DD — read a specific day's log
// GET  /api/integrations/logs?export=true      — export all logs as one markdown
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listLogFiles,
  readLogByDate,
  readTodayLog,
  exportAllLogs,
} from "@/lib/integrations/md-logger";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const doExport = searchParams.get("export") === "true";

  // Export all logs as a single markdown file
  if (doExport) {
    const content = await exportAllLogs();
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="1pos-integration-logs-${new Date().toISOString().split("T")[0]}.md"`,
      },
    });
  }

  // Read a specific date's log
  if (date) {
    const content = await readLogByDate(date);
    if (!content) {
      return NextResponse.json({ error: "No log for this date" }, { status: 404 });
    }
    return NextResponse.json({ date, content });
  }

  // List all log files + today's log
  const files = await listLogFiles();
  const todayContent = await readTodayLog();

  return NextResponse.json({ files, today: todayContent });
}
