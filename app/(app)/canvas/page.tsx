import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CanvasPage } from "@/components/sections/canvas/CanvasPage";

export default async function Canvas() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <CanvasPage />;
}
