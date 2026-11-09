"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { upsertOffer, setOfferStatus } from "@/lib/crm/repository";
import { OFFER_STATUSES, type OfferStatus } from "@/lib/crm/types";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function revalidateDelivery() {
  revalidatePath("/admin/offers");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

/** Ръчно добавяне на оферта от UI. */
export async function createOfferAction(formData: FormData) {
  await requireAdmin();
  const title = str(formData.get("title"));
  if (!title) throw new Error("Заглавието е задължително");
  const res = await upsertOffer({
    title,
    client_email: str(formData.get("client_email")),
    description: str(formData.get("description")),
    amount_net: num(formData.get("amount_net")),
    amount_gross: num(formData.get("amount_gross")),
    vat_amount: num(formData.get("vat_amount")),
    currency: str(formData.get("currency")) ?? "EUR",
    valid_until: str(formData.get("valid_until")),
    url: str(formData.get("url")),
    notes: str(formData.get("notes")),
    source: "manual",
  });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

/** Смяна на статус — „Приета" автоматично създава проект. */
export async function setOfferStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("offer_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !OFFER_STATUSES.includes(status as OfferStatus)) throw new Error("Invalid input");
  const res = await setOfferStatus({ id, status: status as OfferStatus });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

// ── оферти от модули (06.11.2026): билдър, изпращане с PDF, шаблони ──────────
import { buildSchema, templateSchema } from "@/lib/oferti/schema";
import { buildOffer, resetTemplate, saveTemplate, sendOffer } from "@/lib/oferti/repository";
import { SELLERS } from "@/lib/oferti/katalog";
import { shortSummary } from "@/lib/oferti/view";
import type { BuilderState } from "@/lib/oferti/builder-types";

function payloadOf(formData: FormData): unknown {
  try {
    return JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return null;
  }
}

function issues(e: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
  return e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

/** Нова оферта от модули или промяна на съществуваща (payload = JSON от билдъра). */
export async function buildOfferAction(_prev: BuilderState, formData: FormData): Promise<BuilderState> {
  const actor = await requireAdmin();
  const parsed = buildSchema.safeParse(payloadOf(formData));
  if (!parsed.success) return { ok: false, error: `Невалидни данни — ${issues(parsed.error)}` };
  const seller = parsed.data.seller ?? "ivailo";
  const r = await buildOffer(parsed.data, { created_by: actor, owner_id: SELLERS[seller].team_member_id, seller });
  if (r.error || !r.offer || !r.view) return { ok: false, error: r.error ?? "записът не мина" };
  revalidateDelivery();
  return { ok: true, id: r.offer.id, url: r.view.url, pdf_url: r.view.pdfUrl, number: r.view.number, title: r.offer.title, summary: shortSummary(r.view) };
}

/** Имейлът с прикачения PDF — Ивайло натиска бутона сам, затова тръгва веднага. */
export async function sendOfferAction(_prev: BuilderState, formData: FormData): Promise<BuilderState> {
  const actor = await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return { ok: false, error: "липсва офертата" };
  const r = await sendOffer({ id, to: str(formData.get("to")), cc: str(formData.get("cc")), text: str(formData.get("text")), subject: str(formData.get("subject")), approved: true }, actor);
  if (!r.ok || !r.sent) return { ok: false, error: r.error ?? "не тръгна" };
  revalidateDelivery();
  return { ok: true, id, sent: { to: r.sent.to }, url: r.sent.url, pdf_url: r.sent.pdf_url };
}

/** Нов/променен шаблон (примерна оферта). */
export async function saveTemplateAction(_prev: BuilderState, formData: FormData): Promise<BuilderState> {
  const actor = await requireAdmin();
  const parsed = templateSchema.safeParse(payloadOf(formData));
  if (!parsed.success) return { ok: false, error: `Невалидни данни — ${issues(parsed.error)}` };
  const r = await saveTemplate(parsed.data, actor);
  if (r.error || !r.template) return { ok: false, error: r.error ?? "записът не мина" };
  revalidateDelivery();
  return { ok: true, template_key: r.template.key, title: r.template.name };
}

/** Връща шаблона към стандартния от каталога. */
export async function resetTemplateAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const key = str(formData.get("key"));
  if (!key) throw new Error("липсва key");
  const r = await resetTemplate(key, actor);
  if (r.error) throw new Error(r.error);
  revalidateDelivery();
}
