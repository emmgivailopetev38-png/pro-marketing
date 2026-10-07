import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { sendMagnetToExisting, sendSequenceStep } from "@/lib/email/lead-sequence";
import { firstStepForForm } from "@/lib/email/lead-steps";
import { getPageAccessToken } from "@/lib/meta/page-token";
import { sendCapiEvent, isCapiConfigured } from "@/lib/meta/conversions-api";
import { escapeHtml } from "@/lib/email/escape";
import { notifyTeamNewLead } from "@/lib/team/notify";
import { routeNewLead } from "@/lib/team/routing";
import { giveReLeadToTeam } from "@/lib/team/relead";
import { phoneVariants } from "@/lib/contacts/repository";
import { fetchFormName } from "@/lib/meta/form-name";
import { attributionBody, leadAttribution } from "@/lib/leads/meta-lead-rules";
import { offerLabel, openerFor } from "@/lib/leads/lead-offers";

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
  // Конфигурираният токен е СИСТЕМЕН; Graph иска page токен за лийдовете.
  const tok = await getPageAccessToken();
  const pageAccessToken = tok.ok ? tok.token : null;
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

  // Dedup by email if present, else by phone. Телефонът във всичките му записи
  // (+359…, 0…, 359…) — картон от формата на сайта е с „0…“, а Meta праща „+359…“.
  // Два стари дубликата не бива да правят трети: взима се най-старият.
  type Existing = { id: string; full_name: string | null; phone: string | null; email: string | null };
  let existing: Existing | null = null;
  if (emailLower) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone, email")
      .in("email", [...new Set([emailLower, email as string])])
      .order("created_at", { ascending: true })
      .limit(1);
    existing = ((data ?? []) as Existing[])[0] ?? null;
  }
  if (!existing && phone) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone, email")
      .in("phone", phoneVariants(phone))
      .order("created_at", { ascending: true })
      .limit(1);
    existing = ((data ?? []) as Existing[])[0] ?? null;
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
    // Картон само с телефон (формата на сайта) получава и имейла — по него тръгват писмата.
    // Отделно: имейлът е уникален и при сблъсък не бива да спре името и телефона.
    if (!existing.email && emailLower) {
      await supabase.from("contacts").update({ email: emailLower }).eq("id", contactId);
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

  // Откъде е дошъл: кампания, ад сет, реклама, форма (с имената) и какво е поискал.
  const formName = await fetchFormName(detail.form_id ?? formId, pageAccessToken);
  const attr = leadAttribution(detail, { formId, formName });
  const offer = offerLabel(attr.offer);

  // Mirror into meta_leads for the existing lead-center compatible flow
  await supabase
    .from("meta_leads")
    .upsert(
      {
        meta_lead_id: leadgenId,
        form_id: detail.form_id ?? formId ?? "unknown",
        form_name: formName,
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
    body: attributionBody(attr) || null,
    occurred_at: detail.created_time,
    // id-тата И имената: по тях се смята цената на лийд/среща/клиент по кампания.
    metadata: { ...attr, source: "meta_webhook" },
    created_by: "meta_webhook",
  });

  // --- Връщаме лийда към Meta през Conversions API ---
  // Без това Meta вижда „някой е подал форма", но не знае КОЙ — event match
  // quality пада до нула и оптимизацията се влошава. lead_id свързва събитието
  // с точния лийд, реклама и кампания.
  if (isCapiConfigured()) {
    const [firstName, ...rest] = (fullName ?? "").trim().split(/\s+/);
    void sendCapiEvent({
      event_name: "Lead",
      event_id: `metalead_${leadgenId}`,
      action_source: "system_generated",
      event_time: detail.created_time
        ? Math.floor(new Date(detail.created_time).getTime() / 1000)
        : undefined,
      user_data: {
        email: emailLower || null,
        phone: phone || null,
        firstName: firstName || null,
        lastName: rest.join(" ") || null,
        country: "bg",
        external_id: contactId,
        lead_id: leadgenId,
      },
      custom_data: {
        lead_source: "meta_instant_form",
        ad_id: detail.ad_id ?? null,
        campaign_id: detail.campaign_id ?? null,
      },
    });
  }

  // --- Първата стъпка от продажбената поредица (идемпотентна; само нови) ---
  // Старият пасивен welcome („получихме запитването, ще се чуем") не продаваше
  // нищо. Сега тръгва стъпка 1: лично написано, с една конкретна следваща
  // стъпка. Изключва се с META_AUTO_WELCOME=false.
  const autoWelcomeEnabled = process.env.META_AUTO_WELCOME !== "false";
  if (!existing && emailLower && autoWelcomeEnabled) {
    await sendSequenceStep({
      supabase,
      contactId,
      to: emailLower,
      fullName,
      // Формата на лийд магнита („AI наръчник“) получава писмо с наръчника; останалите — демотата.
      step: firstStepForForm(detail.form_id ?? formId),
    }).catch(() => {});
  } else if (existing && emailLower && autoWelcomeEnabled) {
    // Картонът го има от преди, но материалът е поискан СЕГА — получава го веднага
    // (веднъж на материал). Форма, която не е лийд магнит, не праща нищо — както досега.
    await sendMagnetToExisting({ supabase, contactId, to: emailLower, fullName, formId: detail.form_id ?? formId }).catch(() => {});
  }

  // Notify admin (fire-and-forget)
  const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "emmgivailopetev38@gmail.com")
    .split(",").map((s) => s.trim()).filter(Boolean)[0];
  if (adminTo) {
    sendEmail({
      to: adminTo,
      subject: `🔥 Нов Meta lead · ${fullName ?? email ?? phone}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>Получен в реално време от Meta:</strong></p>
<table style="border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#777;">Име:</td><td><strong>${escapeHtml(fullName) || "—"}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Имейл:</td><td>${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Телефон:</td><td>${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : "—"}</td></tr>
${offer ? `<tr><td style="padding:4px 12px 4px 0;color:#777;">Поиска:</td><td><strong>${escapeHtml(offer)}</strong>${existing ? " · картонът го има от преди" : ""}</td></tr>` : ""}
<tr><td style="padding:4px 12px 4px 0;color:#777;">Кампания:</td><td>${escapeHtml(detail.campaign_name) || "—"}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#777;">Реклама:</td><td>${escapeHtml(detail.ad_name) || "—"}</td></tr>
</table>
<p style="margin-top:18px;">📊 <a href="https://promarketing.pw/admin/clients/${contactId}">Виж в CRM-а</a></p>
</div>`,
      text: `Нов Meta lead:\nИме: ${fullName ?? "—"}\nИмейл: ${email ?? "—"}\nТелефон: ${phone ?? "—"}${offer ? `\nПоиска: ${offer}` : ""}\nКампания: ${detail.campaign_name ?? "—"}\nРеклама: ${detail.ad_name ?? "—"}\n\nCRM: https://promarketing.pw/admin/clients/${contactId}`,
    }).catch(() => {});
  }

  // Човекът, който звъни на лийдовете, получава същия лийд — с отговорите
  // от формата и линк към опашката за звънене (/ekip), не към /admin.
  // Awaited: fire-and-forget се губи, щом функцията върне (виж leads/submit).
  // Първо ротацията (Димитър, Елена, Димитър…) — писмото отива само при него.
  const setter = await routeNewLead(contactId).catch(() => null);
  // Пак е оставил данни (картонът го има от преди)? Връща се в „🆕 Нови“ на екипа —
  // освен ако е клиент, при продавач или човек на Ивайло (виж relead-rules.ts).
  const relead = existing
    ? await giveReLeadToTeam({
        contactId,
        leadAt: detail.created_time ?? null,
        metaLeadId: leadgenId,
        offer: attr.offer,
        offerLabel: offer,
        adName: detail.ad_name ?? null,
      }).catch(() => null)
    : null;
  const opener = openerFor(attr.offer, setter?.full_name ?? null);
  await notifyTeamNewLead({
    contactId,
    fullName: fullName ?? null,
    email: emailLower || null,
    phone: phone || null,
    sourceLabel: offer ? `${offer} · Meta реклама` : "Meta реклама",
    adName: detail.ad_name ?? null,
    campaignName: detail.campaign_name ?? null,
    fieldData: detail.field_data,
    offerLabel: offer,
    extra: [
      { label: "Започни така", value: opener ? `„${opener}“` : null },
      { label: "Картонът", value: relead?.given ? "🔁 Има го от преди — пак остави данни. Стои най-горе в „🆕 Нови“." : null },
    ],
  }).catch(() => {});

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
