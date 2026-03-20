import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  let query = supabase
    .from("launch_templates")
    .select("*")
    .order("category, title");

  if (category) query = query.eq("category", category);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  return NextResponse.json({ templates: data ?? [] });
}

/** Auto-fill a template with founder profile data */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { template_slug } = await request.json();
  if (!template_slug) {
    return NextResponse.json({ error: "template_slug required" }, { status: 400 });
  }

  // Fetch template
  const { data: template } = await supabase
    .from("launch_templates")
    .select("*")
    .eq("slug", template_slug)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (!template.is_fillable || !template.fill_fields) {
    return NextResponse.json({ error: "Template is not fillable" }, { status: 400 });
  }

  // Fetch founder profile
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  // Resolve fill fields
  const fillFields = template.fill_fields as Record<string, string>;
  const filled: Record<string, string> = {};

  for (const [field, source] of Object.entries(fillFields)) {
    if (source === "NOW") {
      filled[field] = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (source.startsWith("founder_profiles.")) {
      const key = source.replace("founder_profiles.", "");
      filled[field] = String((profile as Record<string, unknown>)[key] ?? "");
    } else if (source.startsWith("users.")) {
      const key = source.replace("users.", "");
      if (key === "full_name") filled[field] = user.user_metadata?.full_name ?? user.email ?? "";
      else if (key === "email") filled[field] = user.email ?? "";
      else filled[field] = "";
    } else {
      // Static value
      filled[field] = source;
    }
  }

  // Increment download count
  await supabase
    .from("launch_templates")
    .update({ download_count: (template.download_count ?? 0) + 1 })
    .eq("id", template.id);

  return NextResponse.json({
    template: {
      title: template.title,
      slug: template.slug,
      file_type: template.file_type,
    },
    filled_data: filled,
  });
}
