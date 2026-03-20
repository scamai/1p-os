import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyTemplate } from "@/lib/templates/business-templates";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { templateId } = body;

  if (!templateId || typeof templateId !== "string") {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  try {
    const result = await applyTemplate(templateId, business.id, supabase);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[orchestration/template] error:', err);
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
  }
}
