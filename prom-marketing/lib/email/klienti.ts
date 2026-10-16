import "server-only";
import { loadAkademiaIds } from "@/lib/team/ivailo";
import type { createServiceClient } from "@/lib/supabase/service";
import { NO_AUTO_EMAIL_KEY, clientMap, normEmail, type ClientCard, type ClientWhy } from "./klienti-rules";

type Sb = ReturnType<typeof createServiceClient>;

const CHUNK = 100;

function chunks<T>(list: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
}

/**
 * Кои от тези картони са клиенти (виж klienti-rules.ts). Гледа и другите
 * картони със същия имейл. Хвърля при грешка от базата — тогава автоматиката
 * днес мълчи: по-добре пропуснато писмо, отколкото писмо до клиент.
 */
export async function loadClientMap(targets: ClientCard[], sb: Sb): Promise<Map<string, ClientWhy>> {
  if (targets.length === 0) return new Map();

  const emails = new Set<string>();
  for (const t of targets) {
    if (!t.email) continue;
    emails.add(t.email);
    emails.add(normEmail(t.email));
  }

  const twins: ClientCard[] = [];
  for (const part of chunks([...emails])) {
    const { data, error } = await sb.from("contacts").select("id, email, stage, followup_status").in("email", part);
    if (error) throw new Error(`klienti/twins: ${error.message}`);
    for (const c of (data ?? []) as ClientCard[]) twins.push(c);
  }

  const allIds = [...new Set([...targets.map((t) => t.id), ...twins.map((t) => t.id)])];
  const paid = new Set<string>();
  const flagged = new Set<string>();
  for (const part of chunks(allIds)) {
    const [payments, invoices, recurring, flags] = await Promise.all([
      sb.from("payments").select("contact_id").in("contact_id", part),
      sb.from("invoices").select("contact_id").in("contact_id", part),
      sb.from("recurring_services").select("contact_id").in("contact_id", part),
      sb.from("contact_activities").select("contact_id").in("contact_id", part).eq(`metadata->>${NO_AUTO_EMAIL_KEY}`, "true"),
    ]);
    for (const res of [payments, invoices, recurring]) {
      if (res.error) throw new Error(`klienti/paid: ${res.error.message}`);
      for (const r of (res.data ?? []) as Array<{ contact_id: string | null }>) if (r.contact_id) paid.add(r.contact_id);
    }
    if (flags.error) throw new Error(`klienti/flag: ${flags.error.message}`);
    for (const r of (flags.data ?? []) as Array<{ contact_id: string }>) flagged.add(r.contact_id);
  }

  const akademia = await loadAkademiaIds(allIds, sb);
  return clientMap(targets, twins, { akademia, paid, flagged });
}
