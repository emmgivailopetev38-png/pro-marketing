import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

// --- Meta webhook subscription verification (GET) ---
// Meta calls this once when we set up the webhook to confirm we control the
// endpoint. We echo back the hub.challenge iff the verify_token matches.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// --- Verify Meta HMAC signature (POST body) ---
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;
  const expectedSig = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;
  const computed = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(expectedSig, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// --- Fetch full lead detail via Graph API ---
interface MetaLeadFieldData {
  name: string;
  values: string[];
}

interface MetaLeadDetail {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  field_data: MetaLeadFieldData[];
}

async function fetchLeadDetail(leadgenId: string, pageAccessToken: string): Promise<MetaLeadDetail | null> {
  const fields = [
    "id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name",
    "campaign_id", "campaign_name", "form_id", "field_data",
  ].join(",");
  const url = `https://graph.facebook.com/v22.0/${leadgenId}?fields=${fields}&access_token=${encodeURIComponent(pageAccessToken)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("[meta-leads] Graph API error", res.status, await res.text());
      return null;
    }
    return (await res.json()) as MetaLeadDetail;
  } catch (err) {
    console.error("[meta-leads] fetch failed", err);
    return null;
  }
}

function extractField(fieldData: MetaLeadFieldData[], names: string[]): string | null {
  for (const name of names) {
    const item = fieldData.find((f) => f.name.toLowerCase() === name.toLowerCase());
    if (item && item.values && item.values[0]) return item.values[0];
  }
  return null;
}

// --- Process one lead: dedup, insert/update contact, log activity, notify ---
async function processLead(leadgenId: string, formId: string | null) {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageAccessToken) {
    console.error("[meta-leads] META_PAGE_ACCESS_TOKEN missing");
    return { ok: false, error: "missing_token" };
  }

  const detail = await fetchLeadDetail(leadgenId, pageAccessToken);
  if (!detail) return { ok: false, error: "fetch_failed" };

  const email = extractField(detail.field_data, ["email", "email_address"]);
  const phone = extractField(detail.field_data, ["phone_number", "phone"]);
  const fullName = extractField(detail.field_data, ["full_name", "name"]);

  if (!email && !phone) {
    return { ok: false, error: "no_contact_info" };
  }

  const supabase = createServiceClient();
  const emailLower = email?.toLowerCase();

  // Dedup by email if present, else by phone
  let existing: { id: string; full_name: string | null; phone: string | null } | null = null;
  if (emailLower) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone")
      .eq("email", emailLower)
      .maybeSingle();
    existing = data;
  }
  if (!existing && phone) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone")
      .eq("phone", phone)
      .maybeSingle();
    existing = data;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: { full_name?: string; phone?: string } = {};
    if (!existing.full_name && fullName) patch.full_name = fullName;
    if (!existing.phone && phone) patch.phone = phone;
    if (Object.keys(patch).length > 0) {
      await supabase.from("contacts").update(patch).eq("id", contactId);
    }
  } else {
    const { data: created } = await supabase
      .from("contacts")
      .insert({
        full_name: fullName,
        email: emailLower || null,
        phone: phone || null,
        stage: "lead",
        source: "meta_lead",
        source_ref: leadgenId,
      })
      .select("id")
      .single();
    if (!created) return { ok: false, error: "insert_failed" };
    contactId = created.id;
  }

  // Mirror into meta_leads for the existing lead-center compatible flow
  await supabase
    .from("meta_leads")
    .upsert(
      {
        meta_lead_id: leadgenId,
        form_id: detail.form_id ?? formId ?? "unknown",
        form_name: null,
        campaign_id: detail.campaign_id ?? null,
        campaign_name: detail.campaign_name ?? null,
        ad_id: detail.ad_id ?? null,
        ad_name: detail.ad_name ?? null,
        full_name: fullName,
        email: emailLower || null,
        phone: phone || null,
        field_data: detail.field_data,
        source: "meta_webhook",
        raw_payload: detail as unknown as Record<string, unknown>,
        created_time: detail.created_time,
      },
      { onConflict: "meta_lead_id" }
    );

  // Activity timeline
  await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "meta_lead",
    title: `Meta lead · ${detail.campaign_name ?? detail.ad_name ?? "Lead Form"}`,
    body: detail.ad_name ? `Реклама: ${detail.ad_name}` : null,
    occurred_at: detail.created_time,
    metadata: {
      meta_lead_id: leadgenId,
      form_id: detail.form_id,
      ad_id: detail.ad_id,
      campaign_id: detail.campaign_id,
      source: "meta_webhook",
    },
    created_by: "meta_webhook",
  });

  // Notify admin (fire-and-forget)
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "ivailopetev38@gmail.com")
    .split(",").map((s) => s.trim()).filter(Boolean)[0];
  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `🔥 Нов Meta lead · ${fullName ?? email ?? phone}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>Получен в реално време от Meta:</strong></p>
<table style="border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#777;">Име:</td><td><strong>${fullName ?? "—"}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Имейл:</td><td>${email ? `<a href="mailto:${email}">${email}</a>` : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Телефон:</td><td>${phone ? `<a href="tel:${phone}">${phone}</a>` : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Кампания:</td><td>${detail.campaign_name ?? "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Реклама:</td><td>${detail.ad_name ?? "—"}</td></tr>
</table>
<p style="margin-top:18px;">📊 <a href="https://promarketing.pw/admin/clients/${contactId}">Виж в CRM-а</a></p>
</div>`,
      text: `Нов Meta lead:\nИме: ${fullName ?? "—"}\nИмейл: ${email ?? "—"}\nТелефон: ${phone ?? "—"}\nКампания: ${detail.campaign_name ?? "—"}\nРеклама: ${detail.ad_name ?? "—"}\n\nCRM: https://promarketing.pw/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  return { ok: true, contact_id: contactId, leadgen_id: leadgenId };
}

// --- POST handler ---
interface MetaWebhookEntry {
  id?: string;
  time?: number;
  changes?: Array<{
    field: string;
    value: {
      leadgen_id?: string;
      form_id?: string;
      page_id?: string;
      created_time?: number;
      ad_id?: string;
    };
  }>;
}

interface MetaWebhookBody {
  object?: string;
  entry?: MetaWebhookEntry[];
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    console.error("[meta-leads] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: MetaWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "page") {
    // Acknowledge but ignore — Meta sometimes sends test pings.
    return NextResponse.json({ ok: true, ignored: body.object });
  }

  const results: Array<{ ok: boolean; error?: string; contact_id?: string; leadgen_id?: string }> = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      const leadgenId = change.value?.leadgen_id;
      const formId = change.value?.form_id ?? null;
      if (!leadgenId) {
        results.push({ ok: false, error: "no_leadgen_id" });
        continue;
      }
      const result = await processLead(leadgenId, formId);
      results.push(result);
    }
  }

  // Always 200 to Meta — they retry on failures, and we don't want them to.
  return NextResponse.json({ ok: true, processed: results.length, results });
}
