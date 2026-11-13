/**
 * POST /api/leads/obuchenie-az — формата на promarketing.pw/obuchenie-az
 * („AI обучение за екипа ти — платено от държавата“, 08.11.2026).
 *
 * Същият път като /api/leads/submit, но с белезите на кампанията:
 *   - нов картон: contacts.stage = "lead", source = "sait-obuchenie-az";
 *     вече познат човек — картонът остава, само се допълват празните полета;
 *   - активност `website_form` с metadata.form_id = "sait-obuchenie-az",
 *     campaign_name = „AI обучение АЗ 2026-11“, броя служители и UTM-ите.
 *     По form_id Ели (lib/voice/auto-call*.ts, /api/cron/voice-auto) взима
 *     профила „AI обучение АЗ“ от FORM_PROFILES и звъни до минути;
 *   - ротацията към екипа + писмото „нов човек за звънене“ + известие до
 *     собственика — както при всяка форма на сайта. Приветствено писмо
 *     към човека НЯМА (Ели звъни веднага; общото писмо е за друга услуга).
 * Защита: скрито поле (honeypot) + лек таван на заявките от един IP.
 */
import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { notifyTeamNewLead } from "@/lib/team/notify";
import { routeNewLead } from "@/lib/team/routing";
import { phoneVariants } from "@/lib/contacts/repository";
import { isCapiConfigured, sendCapiEvent } from "@/lib/meta/conversions-api";
import {
  OBUCHENIE_AZ_CAMPAIGN,
  OBUCHENIE_AZ_PAGE,
  OBUCHENIE_AZ_SOURCE,
  activityBody,
  answersSummary,
  cleanUtm,
  employeesLabel,
  normalizeBgPhone,
  type ObuchenieAzLead,
} from "@/lib/leads/obuchenie-az";

export const dynamic = "force-dynamic";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().max(200).optional(),
  company: z.string().trim().max(200).optional(),
  employees: z.enum(["sam", "s2_5", "s6_15", "s16"]).optional(),
  consent: z.literal(true),
  utm: z.record(z.string(), z.unknown()).optional(),
  event_id: z.string().trim().max(80).optional(),
  /** honeypot — истински човек не го вижда и не го попълва */
  website: z.string().max(500).optional(),
});

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* Лек таван в паметта на инстанцията: до 5 заявки за 10 минути от един IP. */
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
function limited(ip: string, now = Date.now()): boolean {
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Попълни име, телефон и съгласието." }, { status: 400 });
  }
  const d = parsed.data;
  // Ботът попълва скритото поле — връщаме „ок“, без да пишем нищо.
  if (d.website && d.website.trim()) return NextResponse.json({ ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Твърде много заявки. Опитай пак след няколко минути или звънни на 0876 447 159." }, { status: 429 });
  }

  const phone = normalizeBgPhone(d.phone);
  if (!phone) return NextResponse.json({ error: "Телефонът не изглежда верен — напиши го като 0888 123 456." }, { status: 400 });
  const emailRaw = (d.email ?? "").toLowerCase();
  const lead: ObuchenieAzLead = {
    full_name: d.full_name,
    phone,
    email: EMAIL_RE.test(emailRaw) ? emailRaw : null,
    company: d.company || null,
    employees: d.employees ?? null,
    utm: cleanUtm(d.utm),
  };

  const supabase = createServiceClient();

  // Същият човек: по имейл, после по всички формати на телефона.
  let existing: { id: string; full_name: string | null; phone: string | null; email: string | null; company: string | null } | null = null;
  if (lead.email) {
    const { data } = await supabase.from("contacts").select("id, full_name, phone, email, company").eq("email", lead.email).maybeSingle();
    existing = data;
  }
  if (!existing) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, phone, email, company")
      .in("phone", phoneVariants(phone))
      .order("created_at", { ascending: true })
      .limit(1);
    existing = data?.[0] ?? null;
  }

  const summary = answersSummary(lead);
  let contactId: string;
  if (existing) {
    contactId = existing.id;
    const patch: Record<string, string> = {};
    if (!existing.full_name || existing.full_name === "Уебсайт лийд") patch.full_name = lead.full_name;
    if (!existing.phone) patch.phone = phone;
    if (!existing.email && lead.email) patch.email = lead.email;
    if (!existing.company && lead.company) patch.company = lead.company;
    if (Object.keys(patch).length) await supabase.from("contacts").update(patch).eq("id", contactId);

    // Двойно натиснат бутон: една и съща заявка до 10 минути не се записва втори път.
    const { data: recent } = await supabase
      .from("contact_activities")
      .select("id")
      .eq("contact_id", contactId)
      .eq("activity_type", "website_form")
      .eq("metadata->>form_id", OBUCHENIE_AZ_SOURCE)
      .gte("occurred_at", new Date(Date.now() - WINDOW_MS).toISOString())
      .limit(1);
    if (recent?.length) return NextResponse.json({ ok: true });
  } else {
    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        full_name: lead.full_name,
        email: lead.email,
        phone,
        company: lead.company,
        stage: "lead",
        source: OBUCHENIE_AZ_SOURCE,
        notes: `${OBUCHENIE_AZ_CAMPAIGN}${summary ? ` · ${summary}` : ""}`,
      })
      .select("id")
      .single();
    if (error || !created) {
      console.error("[leads/obuchenie-az] contact insert", error?.message);
      return NextResponse.json({ error: "Не успяхме да запишем заявката. Звънни ни на 0876 447 159." }, { status: 500 });
    }
    contactId = created.id;
    // 13.11.2026 (Ивайло): евро лийдовете пак са на клоузъра — той ги чува и им
    // продава директна програма, без да чакат европрограмата. До 13.11 тук стоеше
    // следата „🚫 махнат от звъненето на екипа“ (11.11.2026); вече не се слага.
    // Бележката на картона казва на клоузъра посоката на разговора.
    await supabase
      .from("contact_activities")
      .insert({
        contact_id: contactId,
        activity_type: "note",
        title: "💡 За Георги: продай директно, без европрограмата",
        body:
          "Попълнил е формата за безплатното AI обучение по програмата на Агенцията по заетостта. По проекта не работим, но интересът му е реален. " +
          "Посоката: няма нужда да чакате европрограмата (бавна, много документи, несигурна) — правим програмата за вашия екип директно и започвате още този месец. " +
          "Предложи му директна програма (обучение на екипа / внедряване на AI) и запиши среща.",
        created_by: "website",
        metadata: { kind: "za_georgi", source: OBUCHENIE_AZ_SOURCE, auto: true },
      })
      .then(() => null, () => null);
  }

  const { error: actErr } = await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "website_form",
    title: "🎓 AI обучение АЗ · заявка от сайта",
    body: activityBody(lead),
    created_by: "website",
    metadata: {
      form_id: OBUCHENIE_AZ_SOURCE,
      kanal: OBUCHENIE_AZ_SOURCE,
      campaign_name: OBUCHENIE_AZ_CAMPAIGN,
      page: OBUCHENIE_AZ_PAGE,
      employees: lead.employees,
      employees_label: employeesLabel(lead.employees),
      answers_summary: summary || null,
      utm: lead.utm,
      full_name: lead.full_name,
      email: lead.email,
      phone,
      company_activity: lead.company,
      consent: true,
      event_id: d.event_id ?? null,
    },
  });
  if (actErr) console.error("[leads/obuchenie-az] activity insert", actErr.message);

  const origin = new URL(request.url).origin;
  const userAgent = request.headers.get("user-agent");
  const fbp = cookie(request, "_fbp");
  const fbc = cookie(request, "_fbc");

  // Всичко странично — след отговора, за да не чака човекът.
  after(async () => {
    const adminTo =
      (process.env.ALLOWED_ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)[0] || process.env.EMAIL_REPLY_TO?.trim() || "";
    const rows: Array<[string, string]> = [
      ["Име", escapeHtml(lead.full_name)],
      ["Телефон", `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>`],
      ["Имейл", lead.email ? escapeHtml(lead.email) : "—"],
      ["Фирма", lead.company ? escapeHtml(lead.company) : "—"],
      ["Служители на трудов договор", escapeHtml(employeesLabel(lead.employees) ?? "—")],
      ["Кампания", escapeHtml(OBUCHENIE_AZ_CAMPAIGN)],
      ["UTM", escapeHtml(Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(" · ") || "—")],
    ];
    if (adminTo) {
      const r = await sendEmail({
        to: adminTo,
        subject: `🎓 AI обучение АЗ · нов лийд · ${lead.full_name}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>Нова заявка от promarketing.pw/obuchenie-az</strong> — Ели звъни до минути в работно време.</p>
<table style="border-collapse:collapse;">${rows
          .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">${k}:</td><td>${v}</td></tr>`)
          .join("")}</table>
<p style="margin-top:18px;">📊 <a href="https://promarketing.pw/admin/clients/${contactId}">Виж в CRM-а</a></p>
</div>`,
        text: `Нова заявка от promarketing.pw/obuchenie-az\n\n${rows.map(([k, v]) => `${k}: ${v.replace(/<[^>]+>/g, "")}`).join("\n")}\n\nCRM: https://promarketing.pw/admin/clients/${contactId}`,
      });
      if (r.error) console.error("[leads/obuchenie-az] admin notification failed:", r.error);
    }

    await routeNewLead(contactId, { split: false }).catch(() => null);
    await notifyTeamNewLead({
      contactId,
      fullName: lead.full_name,
      email: lead.email,
      phone,
      sourceLabel: "Сайта · AI обучение АЗ",
      campaignName: OBUCHENIE_AZ_CAMPAIGN,
      offerLabel: "🎓 AI обучение АЗ",
      extra: [
        { label: "Фирма", value: lead.company },
        { label: "Служители на трудов договор", value: employeesLabel(lead.employees) },
      ],
    }).catch(() => {});

    // Лийдът и към Meta (Conversions API) — същото event_id като пиксела в браузъра.
    if (isCapiConfigured()) {
      const r = await sendCapiEvent({
        event_name: "Lead",
        event_id: d.event_id,
        event_source_url: `${origin}${OBUCHENIE_AZ_PAGE}`,
        action_source: "website",
        user_data: {
          email: lead.email,
          phone,
          firstName: lead.full_name.split(/\s+/)[0] ?? null,
          lastName: lead.full_name.split(/\s+/).slice(1).join(" ") || null,
          country: "bg",
          external_id: contactId,
          client_ip: ip === "unknown" ? null : ip,
          client_user_agent: userAgent,
          fbp,
          fbc,
        },
        custom_data: { content_name: "obuchenie_az", content_category: "ai_training_az" },
      });
      if (!r.ok) console.error("[leads/obuchenie-az] capi", r.error);
    }
  });

  return NextResponse.json({ ok: true });
}
