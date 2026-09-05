import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import type { ContactStage, FollowupStatus } from "@/lib/contacts/types";
import { upsertOffer } from "./repository";
import {
  planContactFixes,
  planOfferFromActivities,
  type ActivityLike,
  type ContactLike,
  type Fix,
  type InvoiceLike,
  type OfferLike,
} from "./consistency-rules";

/**
 * Рутинното изравняване на CRM-а.
 *
 * Върви всяка сутрин в крона преди отчета и може да се пусне на ръка през
 * POST /api/crm/consistency. Правилата са в `consistency-rules.ts`; тук е
 * само четенето и писането. Всяка промяна оставя бележка в картона —
 * „🧹 Автоматично изравняване: …" — за да се вижда какво и защо е пипано.
 *
 * Дубликатите (един телефон, два картона) само се ДОКЛАДВАТ. Сливане на
 * картони маха история и е решение на Ивайло, не на крон.
 */

export interface ConsistencyResult {
  mode: "dry" | "live";
  checked: number;
  contacts_fixed: number;
  fixes: number;
  offers_created: number;
  duplicates: Array<{ phone: string; contacts: Array<{ id: string; name: string | null; email: string | null }> }>;
  details: Array<{ contact_id: string; name: string | null; changes: string[] }>;
  errors: string[];
}

const MAX_DETAILS = 80;

function describe(f: Fix): string {
  const show = (v: unknown) => (v === null || v === undefined || v === "" ? "празно" : String(v));
  return `${f.field}: ${show(f.from)} → ${show(f.to)} (${f.reason})`;
}

export async function runCrmConsistency(opts: { dry?: boolean } = {}): Promise<ConsistencyResult> {
  const sb = createServiceClient();
  const mode: "dry" | "live" = opts.dry ? "dry" : "live";
  const out: ConsistencyResult = {
    mode,
    checked: 0,
    contacts_fixed: 0,
    fixes: 0,
    offers_created: 0,
    duplicates: [],
    details: [],
    errors: [],
  };

  const { data: contactsRaw, error: cErr } = await sb
    .from("contacts")
    .select("id, full_name, email, phone, company, stage, followup_status, next_followup_at, last_heard_from_at, deal_value_eur")
    .order("created_at", { ascending: true })
    .limit(2000);
  if (cErr) {
    out.errors.push(`contacts: ${cErr.message}`);
    return out;
  }
  const contacts = (contactsRaw ?? []) as ContactLike[];
  if (contacts.length === 0) return out;

  const [{ data: actsRaw }, { data: offersRaw }, { data: invoicesRaw }] = await Promise.all([
    sb
      .from("contact_activities")
      .select("id, contact_id, activity_type, title, body, occurred_at, metadata")
      .order("occurred_at", { ascending: true })
      .limit(20000),
    sb.from("offers").select("contact_id, amount_gross, amount_net, created_at"),
    sb.from("invoices").select("contact_id, amount_gross, amount_net, status, invoice_type"),
  ]);

  const actsBy = new Map<string, ActivityLike[]>();
  for (const a of (actsRaw ?? []) as Array<ActivityLike & { contact_id: string }>) {
    const list = actsBy.get(a.contact_id) ?? [];
    list.push(a);
    actsBy.set(a.contact_id, list);
  }
  const offersBy = new Map<string, OfferLike[]>();
  for (const o of (offersRaw ?? []) as Array<OfferLike & { contact_id: string | null }>) {
    if (!o.contact_id) continue;
    const list = offersBy.get(o.contact_id) ?? [];
    list.push(o);
    offersBy.set(o.contact_id, list);
  }
  const invoicesBy = new Map<string, InvoiceLike[]>();
  for (const i of (invoicesRaw ?? []) as Array<InvoiceLike & { contact_id: string | null }>) {
    if (!i.contact_id) continue;
    const list = invoicesBy.get(i.contact_id) ?? [];
    list.push(i);
    invoicesBy.set(i.contact_id, list);
  }

  const now = new Date();
  for (const c of contacts) {
    out.checked++;
    const acts = actsBy.get(c.id) ?? [];
    const offers = offersBy.get(c.id) ?? [];
    const invoices = invoicesBy.get(c.id) ?? [];

    const fixes = planContactFixes(c, acts, offers, invoices, now);
    const offer = planOfferFromActivities(acts, offers.length);
    if (fixes.length === 0 && !offer) continue;

    const changes = fixes.map(describe);
    if (offer) changes.push(`оферта: „${offer.title}"${offer.amount ? ` · ${offer.amount} €` : ""} (от изпратения имейл)`);

    if (mode === "live") {
      try {
        if (fixes.length > 0) {
          const patch: Record<string, unknown> = {};
          for (const f of fixes) patch[f.field] = f.to;
          const { error } = await sb.from("contacts").update(patch).eq("id", c.id);
          if (error) throw new Error(error.message);
          await sb.from("contact_activities").insert({
            contact_id: c.id,
            activity_type: "note",
            title: `🧹 Автоматично изравняване: ${fixes.map((f) => f.field).join(", ")}`,
            body: changes.filter((x) => !x.startsWith("оферта:")).join("\n"),
            metadata: { consistency: true, fixes },
            created_by: "crm_consistency",
          });
        }
        if (offer) {
          const res = await upsertOffer({
            contact_id: c.id,
            title: offer.title,
            amount_gross: offer.amount ?? undefined,
            currency: "EUR",
            status: "sent",
            sent_at: offer.sent_at,
            source: "email",
            notes: "Записана автоматично от изпратения по имейл текст — сумата е прочетена от него, провери я.",
            dedupe_key: offer.dedupe_key,
          });
          if (res.error) throw new Error(`offer: ${res.error}`);
          if (res.created) out.offers_created++;
        }
      } catch (e) {
        out.errors.push(`${c.full_name ?? c.id}: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
    } else if (offer) {
      out.offers_created++;
    }

    out.contacts_fixed++;
    out.fixes += fixes.length;
    if (out.details.length < MAX_DETAILS) out.details.push({ contact_id: c.id, name: c.full_name, changes });
  }

  // Дубликати по телефон — само доклад.
  const byPhone = new Map<string, ContactLike[]>();
  for (const c of contacts) {
    if (!c.phone) continue;
    const key = phoneVariants(c.phone).find((v) => /^\d{9}$/.test(v)) ?? c.phone.replace(/\D/g, "");
    if (key.length < 7) continue;
    const list = byPhone.get(key) ?? [];
    list.push(c);
    byPhone.set(key, list);
  }
  for (const [phone, list] of byPhone) {
    if (list.length > 1) {
      out.duplicates.push({
        phone,
        contacts: list.map((c) => ({ id: c.id, name: c.full_name, email: c.email })),
      });
    }
  }

  return out;
}

/** Блокът за сутрешния имейл. */
export function consistencySummary(r: ConsistencyResult | { error: string }): { html: string; text: string } {
  if ("error" in r) {
    return {
      html: `<p style="margin:0;color:#b91c1c">🧹 Изравняването на CRM-а не мина: ${r.error}</p>`,
      text: `\n🧹 Изравняването на CRM-а не мина: ${r.error}\n`,
    };
  }
  const head =
    r.contacts_fixed === 0
      ? `🧹 CRM-ът е изравнен — ${r.checked} картона, нищо за поправяне.`
      : `🧹 Изравняване на CRM-а: ${r.fixes} корекции в ${r.contacts_fixed} картона${r.offers_created ? ` · ${r.offers_created} оферти записани` : ""}${r.mode === "dry" ? " (пробно, без запис)" : ""}.`;
  const dups = r.duplicates.length
    ? `⚠️ ${r.duplicates.length} телефона с по два картона: ${r.duplicates
        .slice(0, 6)
        .map((d) => d.contacts.map((c) => c.name ?? c.email ?? c.id.slice(0, 8)).join(" = "))
        .join("; ")}. Слей ги на ръка — автоматиката не трие история.`
    : "";
  const rows = r.details.slice(0, 20).map((d) => `${d.name ?? d.contact_id.slice(0, 8)}: ${d.changes.join("; ")}`);
  const errs = r.errors.length ? `Грешки: ${r.errors.slice(0, 5).join(" | ")}` : "";

  const html = `<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#0d1221;max-width:680px;background:#f5f7fa;border-radius:8px;padding:14px 18px;margin-top:12px">
    <p style="margin:0 0 4px"><strong>${head}</strong></p>
    ${dups ? `<p style="margin:0 0 4px;color:#b45309">${dups}</p>` : ""}
    ${rows.length ? `<ul style="margin:6px 0 0;padding-left:20px;color:#444">${rows.map((l) => `<li>${l.replace(/</g, "&lt;")}</li>`).join("")}</ul>` : ""}
    ${errs ? `<p style="margin:6px 0 0;color:#b91c1c">${errs}</p>` : ""}
  </div>`;
  const text = `\n${head}${dups ? `\n${dups}` : ""}${rows.length ? `\n${rows.map((l) => `  ${l}`).join("\n")}` : ""}${errs ? `\n${errs}` : ""}\n`;
  return { html, text };
}

export type { ContactStage, FollowupStatus };
