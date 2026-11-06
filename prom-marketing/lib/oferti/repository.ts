/**
 * Офертите от модули — базата. Създаване/промяна от каталога, шаблоните
 * (примерните оферти), четене по код и изпращане с PDF.
 */
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAutomationEvent, updateContact } from "@/lib/crm/repository";
import { sendEmail } from "@/lib/email/resend";
import {
  DEFAULT_TEMPLATES,
  defaultStepsFor,
  type GreetingForm,
  type OfferContent,
  type OfferItem,
  type OfferTemplate,
  type SellerKey,
  type VatMode,
} from "./katalog";
import { buildItems, offerTitle, summaryLines, totals, validUntilIso, type ItemInput } from "./smetki";
import { newToken } from "./token";
import { offerUrl, shortSummary, viewModel, type OfferContactLite, type OfferFull, type OfferView } from "./view";
import { offerEmail } from "./email";
import { renderOfferPdf } from "./pdf";

type Sb = ReturnType<typeof createServiceClient>;
type Row = Record<string, unknown>;

const CONTACT_COLS = "id, full_name, email, phone, company, stage";

function rowToOffer(r: Row, contact: OfferContactLite | null): OfferFull {
  const content = (r.content as Partial<OfferContent> | null) ?? {};
  return {
    id: String(r.id),
    number: (r.number as number | null) ?? null,
    token: (r.token as string | null) ?? null,
    contact_id: (r.contact_id as string | null) ?? null,
    title: String(r.title ?? ""),
    description: (r.description as string | null) ?? null,
    status: String(r.status ?? "draft"),
    amount_net: r.amount_net === null || r.amount_net === undefined ? null : Number(r.amount_net),
    amount_gross: r.amount_gross === null || r.amount_gross === undefined ? null : Number(r.amount_gross),
    vat_amount: r.vat_amount === null || r.vat_amount === undefined ? null : Number(r.vat_amount),
    currency: String(r.currency ?? "EUR"),
    sent_at: (r.sent_at as string | null) ?? null,
    valid_until: (r.valid_until as string | null) ?? null,
    accepted_at: (r.accepted_at as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    source: String(r.source ?? "manual"),
    notes: (r.notes as string | null) ?? null,
    template_key: (r.template_key as string | null) ?? null,
    items: Array.isArray(r.items) ? (r.items as OfferItem[]) : [],
    content: {
      greeting: content.greeting ?? "ti",
      seller: content.seller ?? "ivailo",
      client_name: content.client_name,
      client_company: content.client_company,
      intro: content.intro,
      pain: content.pain,
      outcome: content.outcome,
      ps: content.ps,
      next_steps: content.next_steps ?? [],
      terms: content.terms ?? [],
    },
    discount: r.discount === null || r.discount === undefined ? null : Number(r.discount),
    discount_note: (r.discount_note as string | null) ?? null,
    vat_mode: ((r.vat_mode as VatMode | null) ?? "incl") as VatMode,
    owner_id: (r.owner_id as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at ?? r.created_at),
    contact,
  };
}

async function contactById(sb: Sb, id: string): Promise<OfferContactLite | null> {
  const { data } = await sb.from("contacts").select(CONTACT_COLS).eq("id", id).maybeSingle();
  return (data as OfferContactLite | null) ?? null;
}

async function withContact(sb: Sb, r: Row | null): Promise<OfferFull | null> {
  if (!r) return null;
  const cid = (r.contact_id as string | null) ?? null;
  const contact = cid ? await contactById(sb, cid) : null;
  return rowToOffer(r, contact);
}

export async function getOffer(id: string): Promise<OfferFull | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("offers").select("*").eq("id", id).maybeSingle();
  return withContact(sb, (data as Row | null) ?? null);
}

export async function getOfferByToken(token: string): Promise<OfferFull | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("offers").select("*").eq("token", token).maybeSingle();
  return withContact(sb, (data as Row | null) ?? null);
}

/** Офертите от модули (с код) — за списъците; `owner_id` стеснява до един продавач. */
export async function listModularOffers(opts: { owner_id?: string; contact_id?: string; limit?: number } = {}): Promise<OfferFull[]> {
  const sb = createServiceClient();
  let q = sb.from("offers").select("*").not("token", "is", null).order("created_at", { ascending: false }).limit(opts.limit ?? 100);
  if (opts.owner_id) q = q.eq("owner_id", opts.owner_id);
  if (opts.contact_id) q = q.eq("contact_id", opts.contact_id);
  const { data } = await q;
  const rows = (data ?? []) as Row[];
  const ids = Array.from(new Set(rows.map((r) => r.contact_id).filter((x): x is string => typeof x === "string")));
  const contacts = new Map<string, OfferContactLite>();
  if (ids.length > 0) {
    const { data: cs } = await sb.from("contacts").select(CONTACT_COLS).in("id", ids);
    for (const c of (cs ?? []) as OfferContactLite[]) contacts.set(c.id, c);
  }
  return rows.map((r) => rowToOffer(r, r.contact_id ? (contacts.get(String(r.contact_id)) ?? null) : null));
}

// ── шаблоните (примерните оферти) ───────────────────────────────────────────

function rowToTemplate(r: Row): OfferTemplate {
  return {
    key: String(r.key),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    items: Array.isArray(r.items) ? (r.items as OfferItem[]) : [],
    content: ((r.content as Partial<OfferContent> | null) ?? {}) as Partial<OfferContent>,
    vat_mode: ((r.vat_mode as VatMode | null) ?? "incl") as VatMode,
    sort_order: Number(r.sort_order ?? 0),
    active: r.active !== false,
  };
}

/** Първото четене засява стандартните шаблони от каталога; после живеят в базата. */
export async function listTemplates(includeInactive = false): Promise<OfferTemplate[]> {
  const sb = createServiceClient();
  const { data, error } = await sb.from("offer_templates").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    await sb.from("offer_templates").upsert(
      DEFAULT_TEMPLATES.map((t) => ({
        key: t.key,
        name: t.name,
        description: t.description,
        items: t.items,
        content: t.content,
        vat_mode: t.vat_mode,
        active: t.active,
        sort_order: t.sort_order,
        updated_by: "katalog",
      })),
      { onConflict: "key" }
    );
    const again = await sb.from("offer_templates").select("*").order("sort_order", { ascending: true });
    rows = (again.data ?? []) as Row[];
  }
  return rows.map(rowToTemplate).filter((t) => includeInactive || t.active);
}

export async function getTemplate(key: string): Promise<OfferTemplate | null> {
  const all = await listTemplates(true);
  return all.find((t) => t.key === key) ?? null;
}

export interface TemplateInput {
  key: string;
  name?: string;
  description?: string;
  items?: ItemInput[];
  content?: Partial<OfferContent>;
  vat_mode?: VatMode;
  active?: boolean;
  sort_order?: number;
}

/** Нов или променен шаблон. Редовете минават през каталога (цените се проверяват). */
export async function saveTemplate(input: TemplateInput, actor: string): Promise<{ template: OfferTemplate | null; error: string | null }> {
  const key = input.key.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (!key) return { template: null, error: "шаблонът иска key (латиница)" };
  const sb = createServiceClient();
  const existing = await getTemplate(key);
  let items: OfferItem[] | undefined;
  if (input.items) {
    // в шаблон модул без цена е позволен (цената идва при офертата), затова грешките за цена не спират
    const built = buildItems(input.items);
    const fatal = built.errors.filter((e) => !/няма цена/.test(e));
    if (fatal.length > 0) return { template: null, error: fatal.join("; ") };
    const keys = new Set(built.items.map((i) => i.key));
    const missing = input.items.filter((i) => !keys.has(i.key));
    items = [...built.items, ...buildItems(missing.map((m) => ({ ...m, price: 0 }))).items.map((i) => ({ ...i, price: null }))];
  }
  const row = {
    key,
    name: (input.name ?? existing?.name ?? key).trim(),
    description: (input.description ?? existing?.description ?? "").trim(),
    items: items ?? existing?.items ?? [],
    content: { ...(existing?.content ?? {}), ...(input.content ?? {}) },
    vat_mode: input.vat_mode ?? existing?.vat_mode ?? "incl",
    active: input.active ?? existing?.active ?? true,
    sort_order: input.sort_order ?? existing?.sort_order ?? 99,
    updated_by: actor,
  };
  const { data, error } = await sb.from("offer_templates").upsert(row, { onConflict: "key" }).select("*").single();
  if (error || !data) return { template: null, error: error?.message ?? "записът не мина" };
  return { template: rowToTemplate(data as Row), error: null };
}

/** Връща стандартния вариант от каталога. */
export async function resetTemplate(key: string, actor: string): Promise<{ error: string | null }> {
  const t = DEFAULT_TEMPLATES.find((x) => x.key === key);
  if (!t) return { error: "този шаблон няма стандартен вариант в каталога" };
  const sb = createServiceClient();
  const { error } = await sb
    .from("offer_templates")
    .upsert({ key: t.key, name: t.name, description: t.description, items: t.items, content: t.content, vat_mode: t.vat_mode, active: true, sort_order: t.sort_order, updated_by: actor }, { onConflict: "key" });
  return { error: error?.message ?? null };
}

// ── създаване / промяна на оферта ───────────────────────────────────────────

export interface BuildInput {
  id?: string;
  contact_id?: string;
  client_email?: string;
  client_name?: string;
  client_company?: string;
  template_key?: string;
  /** редове с поправки; празно + шаблон = редовете на шаблона */
  items?: ItemInput[];
  greeting?: GreetingForm;
  seller?: SellerKey;
  intro?: string;
  pain?: string;
  outcome?: string;
  next_steps?: string[];
  terms?: string[];
  ps?: string;
  discount?: number | null;
  discount_note?: string;
  valid_days?: number;
  valid_until?: string;
  vat_mode?: VatMode;
  notes?: string;
}

export interface BuildActor {
  created_by: string;
  owner_id?: string | null;
  /** продавачът по подразбиране, ако офертата не казва */
  seller?: SellerKey;
}

export interface BuildResult {
  offer: OfferFull | null;
  view: OfferView | null;
  created: boolean;
  error: string | null;
  errors: string[];
}

async function logActivity(sb: Sb, contactId: string, type: string, title: string, body: string, createdBy: string, metadata?: Record<string, unknown>) {
  await sb.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: type,
    title,
    body,
    occurred_at: new Date().toISOString(),
    metadata: metadata ?? null,
    created_by: createdBy,
  });
}

export async function buildOffer(input: BuildInput, actor: BuildActor): Promise<BuildResult> {
  const sb = createServiceClient();
  const fail = (error: string, errors: string[] = []): BuildResult => ({ offer: null, view: null, created: false, error, errors });

  // 1. съществуваща оферта (промяна) или нова
  let existing: OfferFull | null = null;
  if (input.id) {
    existing = await getOffer(input.id);
    if (!existing) return fail("няма такава оферта");
    if (existing.status === "accepted") return fail("офертата е приета — не се променя, направи нова");
  }

  // 2. човекът
  let contact: OfferContactLite | null = existing?.contact ?? null;
  if (input.contact_id) {
    contact = await contactById(sb, input.contact_id);
    if (!contact) return fail("няма контакт с този id");
  } else if (!contact && input.client_email) {
    const { data } = await sb.from("contacts").select(CONTACT_COLS).ilike("email", input.client_email.trim()).limit(1).maybeSingle();
    contact = (data as OfferContactLite | null) ?? null;
  }
  const clientName = (input.client_name ?? existing?.content.client_name ?? contact?.full_name ?? "").trim();
  const clientCompany = (input.client_company ?? existing?.content.client_company ?? contact?.company ?? "").trim();
  if (!contact && !clientName && !clientCompany) return fail("дай contact_id (от търсенето в CRM-а) или client_name");

  // 3. шаблонът и редовете
  const template = input.template_key ? await getTemplate(input.template_key) : null;
  if (input.template_key && !template) return fail(`няма шаблон „${input.template_key}“`);
  let itemInputs: ItemInput[];
  if (input.items && input.items.length > 0) {
    if (template) {
      // поправките за човека върху редовете на шаблона: същият key → сливане, нов key → добавя се
      const byKey = new Map(template.items.map((t) => [t.key, t]));
      itemInputs = input.items.map((i) => {
        const base = byKey.get(i.key);
        return base ? { ...templateItemInput(base), ...stripUndefined(i) } : i;
      });
    } else {
      itemInputs = input.items;
    }
  } else if (template) {
    itemInputs = template.items.map(templateItemInput);
  } else if (existing) {
    itemInputs = existing.items.map(templateItemInput);
  } else {
    return fail("офертата иска модули (items) или шаблон (template_key)");
  }
  const built = buildItems(itemInputs);
  if (built.errors.length > 0) return fail(built.errors.join("; "), built.errors);
  const items = built.items;

  // 4. текстовете
  const defaults = defaultStepsFor(items);
  const tc = template?.content ?? {};
  const ec = existing?.content;
  const seller: SellerKey = input.seller ?? ec?.seller ?? tc.seller ?? actor.seller ?? "ivailo";
  const content: OfferContent = {
    greeting: input.greeting ?? ec?.greeting ?? tc.greeting ?? "ti",
    seller,
    client_name: clientName || undefined,
    client_company: clientCompany || undefined,
    intro: pick(input.intro, ec?.intro, tc.intro),
    pain: pick(input.pain, ec?.pain, tc.pain),
    outcome: pick(input.outcome, ec?.outcome, tc.outcome),
    ps: pick(input.ps, ec?.ps, tc.ps),
    next_steps: input.next_steps ?? ec?.next_steps?.length ? (input.next_steps ?? ec!.next_steps) : (tc.next_steps ?? defaults.next_steps),
    terms: input.terms ?? ec?.terms?.length ? (input.terms ?? ec!.terms) : (tc.terms ?? defaults.terms),
  };
  const vat_mode: VatMode = input.vat_mode ?? existing?.vat_mode ?? template?.vat_mode ?? "incl";
  const discount = input.discount === undefined ? (existing?.discount ?? null) : input.discount;
  const discount_note = input.discount_note ?? existing?.discount_note ?? null;
  const valid_until = input.valid_until ?? (input.valid_days || !existing ? validUntilIso(input.valid_days ?? 14) : existing.valid_until);

  // 5. сумите, заглавието, кодът
  const t = totals(items, discount, vat_mode);
  const title = offerTitle(items);
  const token = existing?.token ?? newToken();
  const url = offerUrl(token);
  const row = {
    contact_id: contact?.id ?? null,
    title,
    description: summaryLines(items).join("\n"),
    amount_net: t.net,
    amount_gross: t.gross,
    vat_amount: t.vat,
    currency: "EUR",
    valid_until,
    url,
    source: "moduli",
    notes: input.notes ?? existing?.notes ?? null,
    token,
    template_key: template?.key ?? existing?.template_key ?? null,
    items,
    content,
    discount: discount && discount > 0 ? discount : null,
    discount_note: discount && discount > 0 ? discount_note : null,
    vat_mode,
    owner_id: existing?.owner_id ?? actor.owner_id ?? null,
    created_by: existing?.created_by ?? actor.created_by,
  };

  let id: string;
  if (existing) {
    const { error } = await sb.from("offers").update(row).eq("id", existing.id);
    if (error) return fail(error.message);
    id = existing.id;
  } else {
    const { data, error } = await sb.from("offers").insert({ ...row, status: "draft" }).select("id").single();
    if (error || !data) return fail(error?.message ?? "записът не мина");
    id = String(data.id);
  }
  const offer = await getOffer(id);
  if (!offer) return fail("офертата не се прочете след записа");
  const view = viewModel(offer);

  if (contact) {
    await logActivity(
      sb,
      contact.id,
      existing ? "note" : "offer_created",
      `${existing ? "✏️ Променена оферта" : "📄 Оферта"} № ${view.number}: ${title}`,
      `${shortSummary(view)}\n${url}`,
      actor.created_by,
      { offer_id: id, token }
    ).catch(() => {});
  }
  await recordAutomationEvent({
    event_type: existing ? "offer_updated" : "offer_created",
    related_contact_id: contact?.id ?? null,
    summary: `Оферта № ${view.number} „${title}“ · ${t.gross} EUR · ${actor.created_by}`,
    idempotency_key: `offer-moduli:${id}:${offer.updated_at}`,
  }).catch(() => {});
  return { offer, view, created: !existing, error: null, errors: [] };
}

function pick(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  return undefined;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)) as Partial<T>;
}

function templateItemInput(i: OfferItem): ItemInput {
  return {
    key: i.key,
    title: i.title,
    subtitle: i.subtitle,
    bullets: i.bullets,
    outcome: i.outcome,
    not_included: i.not_included,
    price: i.price,
    unit: i.unit,
    setup_price: i.setup_price,
    setup_label: i.setup_label,
    qty: i.qty,
    note: i.note,
  };
}

// ── изпращане ────────────────────────────────────────────────────────────────

export interface SendInput {
  id: string;
  to?: string;
  subject?: string;
  text?: string;
  approved?: boolean;
}

export interface SendResult {
  ok: boolean;
  preview?: { to: string; subject: string; text: string; replyTo: string[]; url: string; pdf_url: string };
  sent?: { to: string; resend_id: string | null; replyTo: string[]; url: string; pdf_url: string };
  error?: string;
}

const EARLY_STAGES = new Set(["lead", "contacted", "discovery", "presentation_sent"]);

export async function sendOffer(input: SendInput, actor: string): Promise<SendResult> {
  const offer = await getOffer(input.id);
  if (!offer) return { ok: false, error: "няма такава оферта" };
  if (!offer.token) return { ok: false, error: "офертата не е от модули — няма PDF" };
  const to = (input.to ?? offer.contact?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, error: "няма имейл за човека — дай to" };
  const v = viewModel(offer);
  const mail = offerEmail(v, { subject: input.subject, text: input.text });
  if (!input.approved) {
    return { ok: true, preview: { to, subject: mail.subject, text: mail.text, replyTo: mail.replyTo, url: v.url, pdf_url: v.pdfUrl } };
  }
  let pdf: Buffer;
  try {
    pdf = await renderOfferPdf(v);
  } catch (e) {
    return { ok: false, error: `PDF-ът не се направи: ${e instanceof Error ? e.message : String(e)}` };
  }
  const r = await sendEmail({
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    replyTo: mail.replyTo,
    attachments: [{ filename: v.pdfFilename, content: pdf.toString("base64"), contentType: "application/pdf" }],
  });
  if (r.error) return { ok: false, error: r.error };

  const sb = createServiceClient();
  const nextStatus = offer.status === "draft" || offer.status === "sent" || offer.status === "expired" ? "sent" : offer.status;
  await sb.from("offers").update({ status: nextStatus, sent_at: new Date().toISOString() }).eq("id", offer.id);
  if (offer.contact) {
    await logActivity(
      sb,
      offer.contact.id,
      "email_sent",
      `📧 Оферта № ${v.number} изпратена до ${to}`,
      `Тема: ${mail.subject}\n\n${mail.text}`,
      actor,
      { offer_id: offer.id, resend_id: r.id, reply_to: mail.replyTo }
    ).catch(() => {});
    await updateContact({
      id: offer.contact.id,
      followup_status: "sent_offer",
      ...(offer.contact.stage && EARLY_STAGES.has(offer.contact.stage) ? { stage: "offer_sent" } : {}),
    }).catch(() => {});
  }
  await recordAutomationEvent({
    event_type: "offer_sent",
    related_contact_id: offer.contact?.id ?? null,
    summary: `Оферта № ${v.number} до ${to} · ${actor}`,
    idempotency_key: `offer-sent:${offer.id}:${r.id ?? Date.now()}`,
  }).catch(() => {});
  return { ok: true, sent: { to, resend_id: r.id, replyTo: mail.replyTo, url: v.url, pdf_url: v.pdfUrl } };
}
