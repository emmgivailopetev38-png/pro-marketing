import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Admin read endpoint for the contacts dashboard.
 * Currently open during preview mode — re-add Bearer/INTERNAL_SEND_TOKEN
 * guard before going public.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "not_emailed";

  const supabase = createServiceClient();

  if (filter === "not_emailed") {
    // Find ids that DO have email_sent
    const { data: emailed } = await supabase
      .from("contact_activities")
      .select("contact_id")
      .eq("activity_type", "email_sent");
    const emailedIds = Array.from(new Set((emailed ?? []).map((r) => r.contact_id)));

    // Fetch all then filter in JS — keeps the type-level depth manageable
    // for the supabase-js builder when emailedIds is large.
    const { data: all, error } = await supabase
      .from("contacts")
      .select("id, full_name, email, phone, stage, source, source_ref, created_at")
      .not("email", "is", null)
      .neq("email", "")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const set = new Set(emailedIds);
    const filtered = (all ?? []).filter((c) => !set.has(c.id));
    return NextResponse.json({ filter, count: filtered.length, contacts: filtered });
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ filter, count: data?.length ?? 0, contacts: data ?? [] });
}
