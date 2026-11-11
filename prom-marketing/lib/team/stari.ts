import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { ZV_ACTIVITY_TYPES, classify, type ZvAct, type ZvContact, type ZvRow } from "@/lib/zvanene/rules";
import { loadIvailoClaims } from "./ivailo";
import { loadLeadCards } from "./queue";
import { STARI_NA_EKRAN, teamStari, type StariContact, type StariPile } from "./stari-rules";
import type { QueueLead } from "./types";

/**
 * Базата за „🗂 Стари и топли“ в /ekip (правилата и защо — stari-rules.ts).
 * Чете се само когато човекът отвори изгледа: същите контакти и активности
 * като /admin/zvanene (около 500 картона и 5 000 реда), за да гледат Ивайло и
 * екипът едни и същи купчини.
 */

type Row = ZvContact & { email: string | null; source: string | null; owner_id: string | null };

export interface StariPileData {
  total: number;
  leads: QueueLead[];
}

export interface TeamStari {
  piles: Record<StariPile, StariPileData>;
  /** текст за екрана, ако нещо не се зареди — тогава купчините са празни */
  error: string | null;
}

const EMPTY: Record<StariPile, StariPileData> = {
  topli: { total: 0, leads: [] },
  pisano: { total: 0, leads: [] },
  stari: { total: 0, leads: [] },
};

/**
 * `inQueue` = картоните, които вече са в другите изгледи на същия човек.
 * При грешка в базата връща празно и текст: по-добре празен екран, отколкото
 * човек на Ивайло да излезе при екипа, защото знаците му не са се прочели.
 */
export async function loadTeamStari(now: Date, viewerId: string | null, inQueue: Set<string>): Promise<TeamStari> {
  try {
    const sb = createServiceClient();
    const [contacts, acts, members] = await Promise.all([
      allRows<Row>((from, to) =>
        sb
          .from("contacts")
          .select("id, full_name, company, phone, email, source, owner_id, stage, followup_status, next_followup_at, created_at")
          .not("stage", "in", "(won,lost)")
          .not("phone", "is", null)
          .or("followup_status.is.null,followup_status.neq.not_interested")
          .order("created_at", { ascending: false })
          .range(from, to)
      ),
      allRows<ZvAct>((from, to) =>
        sb
          .from("contact_activities")
          .select("contact_id, activity_type, title, body, occurred_at, created_by")
          .in("activity_type", ZV_ACTIVITY_TYPES)
          .order("occurred_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to)
      ),
      sb.from("team_members").select("id"),
    ]);
    const error = contacts.error ?? acts.error ?? members.error?.message ?? null;
    if (error) return { piles: EMPTY, error };

    const byContact = new Map<string, ZvAct[]>();
    for (const a of acts.rows) {
      const list = byContact.get(a.contact_id);
      if (list) list.push(a);
      else byContact.set(a.contact_id, [a]);
    }
    const byId = new Map(contacts.rows.map((c) => [c.id, c]));
    const rows: ZvRow[] = [];
    for (const c of contacts.rows) {
      if (inQueue.has(c.id)) continue;
      const r = classify(c, byContact.get(c.id) ?? [], now);
      if (r) rows.push(r);
    }
    rows.sort((a, b) => a.sort - b.sort);

    const claims = await loadIvailoClaims(
      rows.map((r) => {
        const c = byId.get(r.id) as Row;
        return { id: c.id, email: c.email, phone: c.phone, source: c.source, created_at: c.created_at };
      }),
      { now },
      sb
    );
    const piles = teamStari({
      rows,
      contacts: new Map<string, StariContact>(
        contacts.rows.map((c) => [c.id, { id: c.id, owner_id: c.owner_id, next_followup_at: c.next_followup_at }])
      ),
      inQueue,
      ivailos: new Set(claims.keys()),
      teamIds: new Set(((members.data ?? []) as Array<{ id: string }>).map((m) => String(m.id))),
      viewerId,
      now,
    });

    const onScreen: Record<StariPile, ZvRow[]> = {
      topli: piles.topli.slice(0, STARI_NA_EKRAN),
      pisano: piles.pisano.slice(0, STARI_NA_EKRAN),
      stari: piles.stari.slice(0, STARI_NA_EKRAN),
    };
    const cards = await loadLeadCards([...onScreen.topli, ...onScreen.pisano, ...onScreen.stari].map((r) => r.id));
    const cardById = new Map(cards.map((l) => [l.id, l]));
    // Поводът от купчината („🔥 оферта пратена · последно се чухме 12.10“) излиза на картата.
    const build = (list: ZvRow[]): QueueLead[] =>
      list.flatMap((r) => {
        const l = cardById.get(r.id);
        return l ? [{ ...l, given_reason: r.zashto, relead_at: null }] : [];
      });
    return {
      piles: {
        topli: { total: piles.topli.length, leads: build(onScreen.topli) },
        pisano: { total: piles.pisano.length, leads: build(onScreen.pisano) },
        stari: { total: piles.stari.length, leads: build(onScreen.stari) },
      },
      error: null,
    };
  } catch (e) {
    console.error("[ekip] стари и топли:", e instanceof Error ? e.message : e);
    return { piles: EMPTY, error: "Списъкът не се зареди. Опитай пак след минута." };
  }
}
