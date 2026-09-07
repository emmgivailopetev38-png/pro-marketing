import { NextResponse, after } from "next/server";
import { z } from "zod";
import { checkPublicVoiceAuth } from "@/lib/voice/public-auth";
import { identityForSessionKey, normalizeEmail, phoneKey } from "@/lib/voice/quota";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { upsertOffer } from "@/lib/crm/repository";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";
import { CHECKOUT_PRODUCTS, VOICE_PAY_PRODUCTS, isStripeReadyFor, type VoicePayProductId } from "@/lib/stripe/products";
import {
  PAY_LINK_DAYS,
  createPayToken,
  newPayLinkId,
  payLinkDedupeKey,
  payLinkUrl,
  speakEur,
} from "@/lib/stripe/pay-link";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/pay-link — гласовият агент „финализира споразумението".
 *
 * Човекът е казал „да, пращай линка". Оттук нататък ГЛАСЪТ НЕ РЕШАВА НИЩО:
 * продуктът е от къс списък, сумата е от ценоразписа, имейлът е този от
 * тефтера (ако разговорът е от сайта), а линкът се праща по имейл, не се
 * диктува. Агентът само казва изречението от `spoken`.
 *
 * Оградите, които държат и при убеден промпт:
 *   - продукт само от VOICE_PAY_PRODUCTS (сумата не идва от разговора);
 *   - един жив линк на човек за същия продукт — второ искане връща същия;
 *   - най-много N линка на денонощие през гласа изобщо;
 *   - без истински имейл линк няма — казва се на агента да го поиска;
 *   - без STRIPE_SECRET_KEY не се обещава линк: записва се оферта-чернова и
 *     Ивайло получава известие да го прати сам.
 *
 * Грешките връщат 200 с изречение. ElevenLabs превръща HTTP грешка в общо
 * „инструментът се провали" и агентът започва да импровизира.
 */

const schema = z.object({
  produkt: z.enum(VOICE_PAY_PRODUCTS),
  ime: z.string().trim().min(2).max(120),
  imeil: z.string().trim().max(160).optional(),
  telefon: z.string().trim().max(40).optional(),
  /** Какво реши човекът и защо — с неговите думи, за картона и за Ивайло. */
  tema: z.string().trim().max(600).optional(),
  deynost: z.string().trim().max(200).optional(),
  /** „ti" или „vie" — както агентът се е обръщал към човека; имейлът звучи по същия начин. */
  obrashtenie: z.enum(["ti", "vie"]).optional(),
  sesia: z.string().trim().max(80).optional(),
});

const NO_EMAIL = "bez-imeil@promarketing.pw";

function limit(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export async function POST(request: Request) {
  const auth = checkPublicVoiceAuth(request);
  if (!auth.ok) {
    console.error("[voice/public/pay-link] отказан достъп:", auth.reason);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Кажи ми името и кое споразумение финализираме, и го пращам." },
      { status: 200 }
    );
  }
  const d = parsed.data;
  const ti = d.obrashtenie === "ti";
  const product = CHECKOUT_PRODUCTS[d.produkt];

  let email = normalizeEmail(d.imeil === NO_EMAIL ? null : d.imeil);
  let telefon = d.telefon ?? null;

  // Самоличността идва от тефтера, не от разговора — както при zapishi_chas.
  const bound = await identityForSessionKey(d.sesia);
  if (bound?.email && bound.email !== email) {
    console.warn("[voice/public/pay-link] имейлът от разговора е подменен — взимам този от тефтера");
    email = bound.email;
  }
  if (bound?.phone && phoneKey(bound.phone) !== phoneKey(telefon)) {
    telefon = bound.phone;
  }

  if (!email) {
    return NextResponse.json(
      {
        ok: false,
        need: "email",
        spoken: ti
          ? "За да ти пратя линка, ми трябва имейл. Кажи ми го буква по буква и ще ти го повторя."
          : "За да ви пратя линка, ми трябва имейл. Кажете ми го буква по буква и ще ви го повторя.",
      },
      { status: 200 }
    );
  }

  const stripeReady = isStripeReadyFor(d.produkt);
  const sb = createServiceClient();
  const since24 = new Date(Date.now() - 24 * 3600_000).toISOString();

  /* Един жив линк на човек за същия продукт. Второто „пращай" връща същото
     изречение и НЕ праща втори имейл — човек, който пита пак, обикновено не
     го е видял, а не иска два. */
  try {
    const { data: recent } = await sb
      .from("offers")
      .select("id, url, status, created_at")
      .eq("source", "voice_agent")
      .eq("title", product.name)
      .gte("created_at", since24)
      .order("created_at", { ascending: false })
      .limit(20);
    const mine = (recent ?? []).find((o) => String(o.url ?? "").length > 0 && o.status !== "rejected");
    if (mine) {
      const { data: c } = await sb.from("offers").select("contact_id").eq("id", mine.id).maybeSingle();
      if (c?.contact_id) {
        const { data: ct } = await sb.from("contacts").select("email").eq("id", c.contact_id).maybeSingle();
        if (ct?.email && String(ct.email).toLowerCase() === email) {
          return NextResponse.json(
            {
              ok: true,
              already: true,
              spoken: ti
                ? "Линкът вече е на имейла ти от преди малко. Провери и папката с нежелана поща — и си ти, когато решиш."
                : "Линкът вече е на имейла ви от преди малко. Проверете и папката с нежелана поща — и сте вие, когато решите.",
            },
            { status: 200 }
          );
        }
      }
    }

    /* Общ таван на денонощие — стената, която не зависи от самоличност. */
    const { count } = await sb
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("source", "voice_agent")
      .gte("created_at", since24);
    if ((count ?? 0) >= limit("PUBLIC_VOICE_PAYLINKS_PER_DAY", 6)) {
      await notifyOwner({ kind: "cap", d, email, telefon, contactId: null, url: null });
      return NextResponse.json(
        {
          ok: false,
          blocked: "day_cap",
          spoken: ti
            ? "Записах, че искаш да започнем. Ивайло ще ти прати линка лично днес, заедно с първите въпроси за проекта."
            : "Записах, че искате да започнем. Ивайло ще ви прати линка лично днес, заедно с първите въпроси за проекта.",
        },
        { status: 200 }
      );
    }
  } catch (err) {
    // Пазачът не е причина да загубим сделка — продължаваме.
    console.error("[voice/public/pay-link] проверката падна, продължавам", err);
  }

  /* Картонът — лийдът става „preddogovor": човек, който е казал „да". */
  let contactId: string | null = null;
  try {
    const res = await upsertContactAndLog({
      full_name: d.ime,
      email,
      phone: telefon,
      company: d.deynost || null,
      source: bound ? "voice_web" : "voice_phone",
      source_ref: bound ? null : "telefon",
      initial_stage: "lead",
      activity: {
        type: "payment_link_sent",
        title: `💳 Гласовият агент финализира споразумение · ${product.name} · ${product.priceEur} €`,
        body: [d.tema ? `Решението му, с неговите думи: ${d.tema}` : null, stripeReady ? null : "⚠️ Stripe не е конфигуриран — линкът трябва да се прати ръчно."]
          .filter(Boolean)
          .join("\n"),
        created_by: "elevenlabs",
        metadata: { product: d.produkt, price_eur: product.priceEur, stripe_ready: stripeReady, obrashtenie: d.obrashtenie ?? "vie" },
      },
    });
    contactId = res.contact_id;
    if (res.error) console.error("[voice/public/pay-link] crm", res.error);
  } catch (err) {
    console.error("[voice/public/pay-link] crm хвърли", err);
  }

  const id = newPayLinkId();
  const token = createPayToken({ id, product: d.produkt, email, name: d.ime, contactId });
  const url = payLinkUrl(token);
  const validUntil = new Date(Date.now() + PAY_LINK_DAYS * 24 * 3600_000).toISOString().slice(0, 10);

  /* Офертата. Без Stripe е чернова с бележка; с Stripe е „sent" и носи линка,
     по който после webhook-ът я прави „accepted" (проект + чернова фактура). */
  try {
    const res = await upsertOffer({
      contact_id: contactId ?? undefined,
      client_email: email,
      client_name: d.ime,
      title: product.name,
      description: product.description,
      amount_gross: product.priceEur,
      currency: "EUR",
      status: stripeReady ? "sent" : "draft",
      sent_at: stripeReady ? new Date().toISOString() : undefined,
      valid_until: validUntil,
      url: stripeReady ? url : undefined,
      source: "voice_agent",
      notes: [
        `Финализирано от гласовия агент${d.deynost ? ` · ${d.deynost}` : ""}.`,
        d.tema ? `Думите му: ${d.tema}` : null,
        stripeReady ? null : "Stripe не е конфигуриран при изпращането — линкът да се прати ръчно.",
      ]
        .filter(Boolean)
        .join(" "),
      dedupe_key: payLinkDedupeKey(id),
    });
    if (res.error) console.error("[voice/public/pay-link] offer", res.error);
  } catch (err) {
    console.error("[voice/public/pay-link] offer хвърли", err);
  }

  if (!stripeReady) {
    after(async () => {
      await notifyOwner({ kind: "manual", d, email, telefon, contactId, url: null }).catch((e) =>
        console.error("[voice/public/pay-link] notify", e)
      );
    });
    return NextResponse.json(
      {
        ok: true,
        manual: true,
        spoken: ti
          ? `Записах, че финализираме ${speakProduct(d.produkt)}. Линкът за инвестицията ще дойде на имейла ти от Ивайло още днес, заедно с първите въпроси за проекта.`
          : `Записах, че финализираме ${speakProduct(d.produkt)}. Линкът за инвестицията ще дойде на имейла ви от Ивайло още днес, заедно с първите въпроси за проекта.`,
      },
      { status: 200 }
    );
  }

  /* Имейлът до човека — с истински линк, топло и без тежки думи. */
  const sent = await sendEmail({
    to: email,
    subject: `${product.name} — линкът за споразумението ни`,
    html: personEmailHtml({ name: d.ime, ti, product: product.name, description: product.description, priceEur: product.priceEur, url, validUntil }),
    text: personEmailText({ name: d.ime, ti, product: product.name, priceEur: product.priceEur, url, validUntil }),
  });
  if (sent.error) {
    console.error("[voice/public/pay-link] resend", sent.error);
    after(async () => {
      await notifyOwner({ kind: "email_failed", d, email, telefon, contactId, url }).catch(() => {});
    });
    return NextResponse.json(
      {
        ok: false,
        spoken: ti
          ? "Пощата ми се запъна за секунда. Ивайло ще ти прати линка лично до час — записах всичко."
          : "Пощата ми се запъна за секунда. Ивайло ще ви прати линка лично до час — записах всичко.",
      },
      { status: 200 }
    );
  }

  after(async () => {
    await notifyOwner({ kind: "sent", d, email, telefon, contactId, url }).catch((e) =>
      console.error("[voice/public/pay-link] notify", e)
    );
  });

  return NextResponse.json(
    {
      ok: true,
      spoken: ti
        ? `Готово, линкът е на имейла ти. ${speakEur(product.priceEur).replace(/^./, (c) => c.toUpperCase())} за ${speakProduct(d.produkt)}. Отвори го, когато ти е удобно — валиден е две седмици. В момента, в който споразумението е финализирано, Ивайло ти пише още същия ден с първите въпроси и започва работа.`
        : `Готово, линкът е на имейла ви. ${speakEur(product.priceEur).replace(/^./, (c) => c.toUpperCase())} за ${speakProduct(d.produkt)}. Отворете го, когато ви е удобно — валиден е две седмици. В момента, в който споразумението е финализирано, Ивайло ви пише още същия ден с първите въпроси и започва работа.`,
    },
    { status: 200 }
  );
}

function speakProduct(p: VoicePayProductId): string {
  switch (p) {
    case "glas-vnedryavane":
      return "внедряването на гласовия агент";
    case "glas-vnedryavane-70":
      return "първата вноска за гласовия агент";
    case "glas-kaparo-30":
      return "капарото за гласовия агент";
    case "avtomatizacia-proces":
      return "автоматизацията на първия процес";
    case "crm-vnedryavane":
      return "внедряването на CRM-а";
  }
}

function personEmailHtml(a: {
  name: string;
  ti: boolean;
  product: string;
  description: string;
  priceEur: number;
  url: string;
  validUntil: string;
}): string {
  const first = a.name.split(/\s+/)[0] ?? a.name;
  const you = a.ti
    ? {
        hi: `Здравей, ${first}`,
        intro: "Радвам се, че говорихме преди малко с Коста и че решението е „да“. Ето следващата стъпка — простата:",
        cta: "Финализирай споразумението",
        after: "В момента, в който споразумението е финализирано, ти пиша още същия ден с първите въпроси и започвам работа по твоя проект.",
        valid: `Линкът е валиден до ${a.validUntil}. Ако предпочиташ банков превод или имаш въпрос — отговори на този имейл, това е директно до мен.`,
        bye: "До скоро,",
      }
    : {
        hi: `Здравейте, ${first}`,
        intro: "Радвам се, че говорихте преди малко с Коста и че решението е „да“. Ето следващата стъпка — простата:",
        cta: "Финализирайте споразумението",
        after: "В момента, в който споразумението е финализирано, Ви пиша още същия ден с първите въпроси и започвам работа по Вашия проект.",
        valid: `Линкът е валиден до ${a.validUntil}. Ако предпочитате банков превод или имате въпрос — отговорете на този имейл, това е директно до мен.`,
        bye: "До скоро,",
      };
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:600px">
<p style="margin:0 0 14px">${escapeHtml(you.hi)},</p>
<p style="margin:0 0 14px">${escapeHtml(you.intro)}</p>
<div style="border:1px solid #d9e3de;border-radius:12px;padding:16px 18px;margin:0 0 18px">
<p style="margin:0 0 4px;font-weight:600">${escapeHtml(a.product)}</p>
<p style="margin:0 0 10px;color:#4b5852">${escapeHtml(a.description)}</p>
<p style="margin:0;font-size:22px;font-weight:700">${a.priceEur.toLocaleString("bg-BG")} €</p>
</div>
<p style="margin:0 0 22px"><a href="${a.url}" style="display:inline-block;background:#0b6b4a;color:#fff;font-weight:700;text-decoration:none;border-radius:999px;padding:13px 24px">${escapeHtml(you.cta)} →</a></p>
<p style="margin:0 0 14px">${escapeHtml(you.after)}</p>
<p style="margin:0 0 18px;color:#4b5852">${escapeHtml(you.valid)}</p>
<p style="margin:0">${escapeHtml(you.bye)}<br><strong>Ивайло Петев</strong><br>Про Маркетинг · <a href="https://promarketing.pw" style="color:#0b6b4a">promarketing.pw</a> · <a href="tel:+359877399963" style="color:#0b6b4a">+359 877 399 963</a></p>
</div>`;
}

function personEmailText(a: { name: string; ti: boolean; product: string; priceEur: number; url: string; validUntil: string }): string {
  const first = a.name.split(/\s+/)[0] ?? a.name;
  return a.ti
    ? `Здравей, ${first},\n\nРадвам се, че говорихме преди малко с Коста и че решението е „да“. Ето следващата стъпка — простата:\n\n${a.product} — ${a.priceEur} €\nФинализирай споразумението: ${a.url}\n\nВ момента, в който споразумението е финализирано, ти пиша още същия ден с първите въпроси и започвам работа.\nЛинкът е валиден до ${a.validUntil}. Ако предпочиташ банков превод или имаш въпрос — отговори на този имейл.\n\nДо скоро,\nИвайло Петев · Про Маркетинг · +359 877 399 963`
    : `Здравейте, ${first},\n\nРадвам се, че говорихте преди малко с Коста и че решението е „да“. Ето следващата стъпка — простата:\n\n${a.product} — ${a.priceEur} €\nФинализирайте споразумението: ${a.url}\n\nВ момента, в който споразумението е финализирано, Ви пиша още същия ден с първите въпроси и започвам работа.\nЛинкът е валиден до ${a.validUntil}. Ако предпочитате банков превод или имате въпрос — отговорете на този имейл.\n\nДо скоро,\nИвайло Петев · Про Маркетинг · +359 877 399 963`;
}

async function notifyOwner(a: {
  kind: "sent" | "manual" | "cap" | "email_failed";
  d: z.infer<typeof schema>;
  email: string;
  telefon: string | null;
  contactId: string | null;
  url: string | null;
}): Promise<void> {
  const to = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
  const product = CHECKOUT_PRODUCTS[a.d.produkt];
  const crm = a.contactId ? `https://promarketing.pw/admin/clients/${a.contactId}` : "https://promarketing.pw/admin";
  const head =
    a.kind === "sent"
      ? "💳 Гласовият агент прати линк за плащане"
      : a.kind === "manual"
        ? "⚠️ Човек каза ДА, но Stripe не е конфигуриран — прати линка ръчно"
        : a.kind === "cap"
          ? "⚠️ Човек каза ДА, но дневният таван за линкове е пълен — прати линка ръчно"
          : "⚠️ Човек каза ДА, но имейлът не тръгна — прати линка ръчно";
  const lines = [
    `<b>${esc(a.d.ime)}</b> · ${esc(product.name)} · ${product.priceEur} €`,
    `✉️ ${esc(a.email)}`,
    a.telefon ? `☎️ ${esc(a.telefon)}` : null,
    a.d.deynost ? `🏢 ${esc(a.d.deynost)}` : null,
    a.d.tema ? `💬 ${esc(a.d.tema)}` : null,
    a.url ? `🔗 ${esc(a.url)}` : null,
    `<a href="${crm}">Картонът</a>`,
  ].filter(Boolean);
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:620px">
<p style="margin:0 0 12px"><strong>${escapeHtml(head)}</strong></p>
<table style="border-collapse:collapse">
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Кой:</td><td><strong>${escapeHtml(a.d.ime)}</strong></td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Какво:</td><td>${escapeHtml(product.name)} · ${product.priceEur} €</td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Имейл:</td><td>${escapeHtml(a.email)}</td></tr>
${a.telefon ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Телефон:</td><td>${escapeHtml(a.telefon)}</td></tr>` : ""}
${a.d.deynost ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Дейност:</td><td>${escapeHtml(a.d.deynost)}</td></tr>` : ""}
${a.d.tema ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Думите му:</td><td>${escapeHtml(a.d.tema)}</td></tr>` : ""}
${a.url ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Линкът:</td><td><a href="${a.url}">${escapeHtml(a.url)}</a></td></tr>` : ""}
</table>
<p style="margin:18px 0 0">📊 <a href="${crm}" style="color:#0b6b4a">Виж в CRM-а →</a></p>
</div>`;
  await Promise.all([
    sendEmail({ to, subject: `${head} · ${a.d.ime} · ${product.priceEur} €`, html, text: `${head}\n${lines.map((l) => String(l).replace(/<[^>]+>/g, "")).join("\n")}` }),
    sendTelegram(`${head}\n${lines.join("\n")}`),
  ]);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
