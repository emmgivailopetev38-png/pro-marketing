import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { renderDailyLeadsEmail } from "@/lib/email/daily-leads-email";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(user.email.toLowerCase())) return null;
  return user;
}

export async function POST() {
  const user = await requireAdmin();
  if (!user || !user.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, html, text } = renderDailyLeadsEmail({
    leads: [
      {
        meta_lead_id: "test-1",
        form_id: "demo-form",
        form_name: "Demo Lead Form",
        campaign_id: null,
        campaign_name: "Demo Campaign",
        ad_id: null,
        ad_name: null,
        full_name: "Иван Тестов",
        email: "test@example.com",
        phone: "+359888000000",
        field_data: {},
        source: "google_sheets:demo",
        created_time: new Date().toISOString(),
      },
    ],
    totalLast24h: 1,
    totalLast7d: 1,
    syncErrors: [],
  });

  const result = await sendEmail({
    to: user.email,
    subject: `[TEST] ${subject}`,
    html,
    text,
  });
  return NextResponse.json({ ok: !result.error, ...result });
}
