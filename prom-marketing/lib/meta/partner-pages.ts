import "server-only";

/**
 * „Партньорски“ Facebook страници — лийдовете им НЕ са наши.
 *
 * Webhook-ът на приложението получава leadgen събития от всяка страница, която
 * е абонирана за него. Нашата страница (META_PAGE_ID) влиза в нашия CRM; страница
 * на клиент (напр. „Финансови решения с Ивайло“ на Ивайло Иванов / CCGroup) се
 * препраща ДИРЕКТНО в неговата система, без картон при нас.
 *
 * Картата е в env `META_PARTNER_FORWARD` (JSON):
 *   {
 *     "106532484251875": {
 *       "url": "https://ccgroup-crm.vercel.app/api/leads",
 *       "token_env": "CCGROUP_LEADS_TOKEN",
 *       "source": "Facebook реклама",
 *       "label": "CCGroup · Ивайло Иванов"
 *     }
 *   }
 * Самият Bearer токен стои в отделен env (името е в `token_env`) — картата не носи тайни.
 */

const GRAPH = "https://graph.facebook.com/v22.0";

export interface PartnerForward {
  /** id на Facebook страницата (ключът в картата) */
  page_id: string;
  /** къде се POST-ва лийдът */
  url: string;
  /** името на env променливата с Bearer токена за `url` */
  token_env: string;
  /** какво пише в `source` при партньора */
  source: string;
  /** име за логовете/отчетите */
  label: string;
}

export function parsePartnerForward(raw: string | undefined | null): Record<string, PartnerForward> {
  const text = (raw ?? "").trim();
  if (!text) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("[meta-partner] META_PARTNER_FORWARD не е валиден JSON");
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const out: Record<string, PartnerForward> = {};
  for (const [pageId, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    const tokenEnv = typeof o.token_env === "string" ? o.token_env.trim() : "";
    if (!/^\d{5,25}$/.test(pageId) || !/^https:\/\//.test(url) || !tokenEnv) continue;
    out[pageId] = {
      page_id: pageId,
      url,
      token_env: tokenEnv,
      source: typeof o.source === "string" && o.source.trim() ? o.source.trim() : "Facebook реклама",
      label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : pageId,
    };
  }
  return out;
}

/** Партньорът за тази страница — null, ако страницата не е в картата (т.е. е наша или непозната). */
export function partnerForPage(pageId: string | null | undefined): PartnerForward | null {
  const id = (pageId ?? "").trim();
  if (!id) return null;
  return parsePartnerForward(process.env.META_PARTNER_FORWARD)[id] ?? null;
}

// ── Page токен за произволна страница ───────────────────────────────────────
// Същата идея като lib/meta/page-token.ts, но по page id: системният токен
// (META_PAGE_ACCESS_TOKEN) дава page токена с GET /{page-id}?fields=access_token
// — стига страницата да е достъпна за системния потребител (споделена с
// бизнеса на ProMarketing). Без fallback към системния: за лийдове той не върши
// работа (#210), а грешката трябва да се види дословно.
const tokenCache = new Map<string, { token: string; at: number }>();
const TOKEN_TTL_MS = 10 * 60 * 1000;

export async function pageTokenFor(
  pageId: string
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const configured = process.env.META_PAGE_ACCESS_TOKEN;
  if (!configured) return { ok: false, error: "META_PAGE_ACCESS_TOKEN липсва" };
  const hit = tokenCache.get(pageId);
  if (hit && Date.now() - hit.at < TOKEN_TTL_MS) return { ok: true, token: hit.token };
  try {
    const res = await fetch(
      `${GRAPH}/${encodeURIComponent(pageId)}?fields=access_token&access_token=${encodeURIComponent(configured)}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    const body = (await res.json().catch(() => null)) as
      | { access_token?: unknown; error?: { message?: string; code?: number } }
      | null;
    if (res.ok && typeof body?.access_token === "string" && body.access_token) {
      tokenCache.set(pageId, { token: body.access_token, at: Date.now() });
      return { ok: true, token: body.access_token };
    }
    const msg = body?.error?.message ?? `Graph ${res.status} без access_token за страница ${pageId}`;
    return { ok: false, error: body?.error?.code ? `(#${body.error.code}) ${msg}` : msg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Преводът на лийда към тялото на партньорския /api/leads ─────────────────
export interface PartnerLeadField {
  name: string;
  values: string[];
}

export interface PartnerLeadDetail {
  id: string;
  created_time?: string | null;
  ad_name?: string | null;
  campaign_name?: string | null;
  form_id?: string | null;
  field_data: PartnerLeadField[];
}

export interface PartnerLeadBody {
  full_name: string;
  phone: string;
  email?: string;
  city?: string;
  property?: string;
  amount?: number;
  urgency?: string;
  case_type?: string;
  source: string;
  ad_name?: string;
  answers: Array<{ question: string; answer: string }>;
  received_at?: string;
}

/** „2026-10-07T12:17:39+0000“ → „07.10 15:17“ (софийско време). */
export function sofiaReceivedAt(createdTime: string | null | undefined): string | undefined {
  const raw = (createdTime ?? "").trim();
  if (!raw) return undefined;
  // Meta праща „+0000“; Date иска „+00:00“.
  const iso = raw.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Sofia",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}.${get("month")} ${get("hour")}:${get("minute")}`;
}

/** Въпросът както е написан („Какъв_е_видът_на_имота?“ → „Какъв е видът на имота?“). */
export function questionText(name: string): string {
  return name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * „50 000 – 100 000 €“ → 50000 · „над 100 000“ → 100000 · „35 хил.“ → 35000 ·
 * „50k“ → 50000 · „двайсет хиляди“ → undefined (няма число). Взима се ПЪРВОТО число.
 */
export function parseAmount(text: string | null | undefined): number | undefined {
  const t = (text ?? "").toLowerCase();
  // „Под 20 000 €“ / „до 20 000“ = по-малко от числото → няма точна сума; текстът остава в answers.
  if (/^\s*(под|до)(\s|$)/.test(t)) return undefined;
  const m = /(\d[\d\s.,]*)\s*(хил|k|к)?/.exec(t);
  if (!m) return undefined;
  const digits = m[1].replace(/[\s.]/g, "").replace(/,\d{1,2}$/, "").replace(/,/g, "");
  let n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  if (m[2] && n < 1000) n *= 1000;
  return n;
}

type Slot = "city" | "amount" | "urgency" | "property" | null;

/** По ключови думи във въпроса — редът е важен („Къде се намира имотът“ е град, не имот). */
export function slotForQuestion(question: string): Slot {
  const q = question.toLowerCase();
  if (/град|населено|намира|къде/.test(q)) return "city";
  if (/сума|сумата|колко\s+(пари|средства|евро|лева)/.test(q)) return "amount";
  if (/спешн|кога|срок|скоро/.test(q)) return "urgency";
  if (/имот|обезпеч/.test(q)) return "property";
  return null;
}

const STANDARD: Record<string, "email" | "phone" | "full_name" | "first_name" | "last_name" | "city"> = {
  email: "email",
  email_address: "email",
  phone_number: "phone",
  phone: "phone",
  full_name: "full_name",
  name: "full_name",
  first_name: "first_name",
  last_name: "last_name",
  city: "city",
};

function first(values: string[] | undefined): string {
  return (values ?? []).map((v) => (typeof v === "string" ? v.trim() : "")).find(Boolean) ?? "";
}

// ── Дефиницията на формата: ключове → текст ─────────────────────────────────
// Graph връща в field_data КЛЮЧОВЕТЕ на въпросите и на готовите отговори, не
// текста им: формата v4 на Иво (28.10.2026) дава „suma = o2“, „vid_imot = o6“.
// Без превод партньорът получава „o2“ вместо „20 000 – 50 000 €“ и нито имот,
// нито сума. GET /{form_id}?fields=questions дава label на всеки въпрос и
// value на всяка опция; кешира се по форма за час.
export interface FormQuestion {
  key: string;
  label: string;
  /** ключ на опцията → текстът ѝ (само при въпроси с готови отговори) */
  options: Record<string, string>;
}
/** по ключ на въпроса */
export type FormDefinition = Record<string, FormQuestion>;

const formCache = new Map<string, { form: FormDefinition; at: number }>();
const FORM_TTL_MS = 60 * 60 * 1000;

export function parseFormQuestions(raw: unknown): FormDefinition {
  const out: FormDefinition = {};
  const list = (raw as { questions?: unknown } | null)?.questions;
  if (!Array.isArray(list)) return out;
  for (const q of list) {
    if (!q || typeof q !== "object") continue;
    const o = q as { key?: unknown; label?: unknown; options?: unknown };
    const key = typeof o.key === "string" ? o.key.trim() : "";
    if (!key) continue;
    const options: Record<string, string> = {};
    if (Array.isArray(o.options)) {
      for (const opt of o.options) {
        const p = (opt ?? {}) as { key?: unknown; value?: unknown };
        if (typeof p.key === "string" && p.key && typeof p.value === "string" && p.value.trim()) {
          options[p.key] = p.value.trim();
        }
      }
    }
    out[key] = { key, label: typeof o.label === "string" ? o.label.trim() : "", options };
  }
  return out;
}

export async function fetchFormDefinition(
  formId: string | null | undefined,
  pageToken: string
): Promise<FormDefinition | null> {
  const id = (formId ?? "").trim();
  if (!/^\d{5,25}$/.test(id) || !pageToken) return null;
  const hit = formCache.get(id);
  if (hit && Date.now() - hit.at < FORM_TTL_MS) return hit.form;
  try {
    const res = await fetch(`${GRAPH}/${id}?fields=questions&access_token=${encodeURIComponent(pageToken)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !body) {
      console.error(`[meta-partner] формата ${id}: Graph ${res.status} без questions`);
      return null;
    }
    const form = parseFormQuestions(body);
    formCache.set(id, { form, at: Date.now() });
    return form;
  } catch (e) {
    console.error(`[meta-partner] формата ${id}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

/**
 * field_data с преведени ключове: името на въпроса → неговият label, отговорът →
 * текстът на опцията. Стандартните полета (full_name, email, phone_number) пазят
 * ключа си, за да ги познае STANDARD. Непознато (без дефиниция) остава както е.
 */
export function resolveFieldData(
  fieldData: PartnerLeadField[] | undefined,
  form: FormDefinition | null | undefined
): PartnerLeadField[] {
  const list = fieldData ?? [];
  if (!form) return list;
  return list.map((f) => {
    const key = (f?.name ?? "").trim();
    const q = form[key];
    if (!q) return f;
    const name = STANDARD[key.toLowerCase()] || !q.label ? key : q.label;
    const values = (f.values ?? []).map((v) => (typeof v === "string" && q.options[v]) || v);
    return { name, values };
  });
}

/**
 * Превежда field_data на Meta лийда към тялото на партньорския `POST /api/leads`:
 * стандартните полета → full_name / phone / email / city; въпросите за имот,
 * сума, спешност → property / amount / urgency (по ключови думи); ВСИЧКИ
 * въпроси (и преведените) остават и в `answers` с оригиналния текст, за да не
 * се губи нищо при грешен превод.
 */
export function partnerLeadBody(detail: PartnerLeadDetail, partner: PartnerForward): PartnerLeadBody {
  let fullName = "";
  let firstName = "";
  let lastName = "";
  let phone = "";
  let email = "";
  let city = "";
  let property = "";
  let amount: number | undefined;
  let urgency = "";
  const answers: Array<{ question: string; answer: string }> = [];

  for (const f of detail.field_data ?? []) {
    const name = (f?.name ?? "").trim();
    if (!name) continue;
    const value = first(f.values);
    const std = STANDARD[name.toLowerCase()];
    if (std) {
      if (std === "email") email = email || value;
      else if (std === "phone") phone = phone || value;
      else if (std === "full_name") fullName = fullName || value;
      else if (std === "first_name") firstName = value;
      else if (std === "last_name") lastName = value;
      else if (std === "city") city = city || value;
      continue;
    }
    const question = questionText(name);
    if (value) answers.push({ question, answer: value });
    const slot = slotForQuestion(question);
    if (slot === "city" && !city) city = value;
    else if (slot === "property" && !property) property = value;
    else if (slot === "urgency" && !urgency) urgency = value;
    else if (slot === "amount" && amount === undefined) amount = parseAmount(value);
  }
  if (!fullName) fullName = [firstName, lastName].filter(Boolean).join(" ");

  const body: PartnerLeadBody = {
    full_name: fullName,
    phone,
    source: partner.source,
    answers,
  };
  if (email) body.email = email;
  if (city) body.city = city;
  if (property) body.property = property;
  if (amount !== undefined) body.amount = amount;
  if (urgency) body.urgency = urgency;
  const adName = (detail.ad_name ?? detail.campaign_name ?? "").trim();
  if (adName) body.ad_name = adName;
  const receivedAt = sofiaReceivedAt(detail.created_time);
  if (receivedAt) body.received_at = receivedAt;
  return body;
}

export interface ForwardResult {
  ok: boolean;
  status: number | null;
  /** партньорът вече има този телефон — не е грешка */
  duplicate?: boolean;
  contact_id?: string | null;
  deal_id?: string | null;
  qualified?: boolean | null;
  error?: string;
  body: PartnerLeadBody;
}

/**
 * POST към партньорската система с Bearer от `process.env[partner.token_env]`.
 * С `pageToken` първо превежда ключовете на формата към текст (виж resolveFieldData).
 */
export async function forwardLead(
  partner: PartnerForward,
  detail: PartnerLeadDetail,
  opts: { pageToken?: string } = {}
): Promise<ForwardResult> {
  const form = opts.pageToken ? await fetchFormDefinition(detail.form_id, opts.pageToken) : null;
  const resolved = form ? { ...detail, field_data: resolveFieldData(detail.field_data, form) } : detail;
  const body = partnerLeadBody(resolved, partner);
  const token = process.env[partner.token_env];
  const tag = `[meta-partner] ${partner.label} · лийд ${detail.id}`;
  if (!token) {
    console.error(`${tag}: env ${partner.token_env} липсва`);
    return { ok: false, status: null, error: `env ${partner.token_env} липсва`, body };
  }
  if (!body.full_name || !body.phone) {
    console.error(`${tag}: без име или телефон — партньорът ги иска`);
    return { ok: false, status: null, error: "missing_name_or_phone", body };
  }
  try {
    const res = await fetch(partner.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      json = { raw: text.slice(0, 300) };
    }
    const ok = res.ok && json.ok !== false;
    const result: ForwardResult = {
      ok,
      status: res.status,
      duplicate: json.duplicate === true,
      contact_id: typeof json.contact_id === "string" ? json.contact_id : null,
      deal_id: typeof json.deal_id === "string" ? json.deal_id : null,
      qualified: typeof json.qualified === "boolean" ? json.qualified : null,
      body,
    };
    if (!ok) result.error = typeof json.error === "string" ? json.error : `HTTP ${res.status}`;
    console.log(
      `${tag}: ${ok ? "препратен" : "НЕ мина"} → ${partner.url} (${res.status})` +
        (result.duplicate ? " · дубликат" : "") +
        (result.contact_id ? ` · contact ${result.contact_id}` : "") +
        (result.error ? ` · ${result.error}` : "")
    );
    return result;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`${tag}: грешка при POST → ${partner.url}: ${error}`);
    return { ok: false, status: null, error, body };
  }
}
