import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { minStageFromActivities } from "./consistency-rules";
import type { PromiseRow } from "@/lib/contacts/dnevnik";
import {
  deltaPct,
  followupSnapshot,
  funnelOf,
  moodMix,
  normalizeActor,
  perDay,
  promiseStats,
  speedOf,
  volumeOf,
  wonDate,
  wonStats,
  workdaysBetween,
  TOUCH_TYPES,
  type ActivityLite,
  type Actor,
  type ContactLite,
  type FunnelStep,
  type PromiseStats,
  type SpeedStats,
  type Volume,
  type WonStats,
} from "./efektivnost";

/**
 * Числата за „Моята ефективност“ — събиране от базата на едно място.
 * Правилата са в efektivnost.ts (чисти, тествани); тук е само четенето.
 */

export interface PersonRow {
  name: string;
  kind: Actor["kind"];
  volume: Volume;
}

export interface EfektivnostData {
  days: number;
  from: string;
  to: string;
  workdays: number;
  /** моята работа за периода */
  mine: Volume;
  minePrev: Volume;
  deltas: { calls: number | null; meetings: number | null; sent: number | null; people: number | null };
  perDay: Array<{ day: string; n: number }>;
  speed: SpeedStats;
  promises: PromiseStats;
  followups: { dueToday: number; overdue: number; future: number };
  funnel: FunnelStep[];
  won: WonStats;
  moods: Array<{ mood: string; count: number }>;
  people: PersonRow[];
  /** лийдове за периода, които още никой не е докоснал */
  untouchedNames: string[];
}

export async function loadEfektivnost(days = 30, now: Date = new Date()): Promise<EfektivnostData> {
  const sb = createServiceClient();
  const from = new Date(now.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);

  const [{ data: teamRows }, { data: contactRows }, { data: actRows }, { data: promiseRows }] = await Promise.all([
    sb.from("team_members").select("full_name"),
    sb.from("contacts").select("id, full_name, stage, created_at, updated_at, deal_value_eur, mood, next_followup_at, last_heard_from_at"),
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at, created_by, metadata")
      .gte("occurred_at", prevFrom.toISOString())
      .lte("occurred_at", now.toISOString())
      .order("occurred_at", { ascending: true })
      .limit(20000),
    sb.from("contact_promises").select("*").eq("who", "us").limit(2000),
  ]);

  const teamNames = ((teamRows ?? []) as Array<{ full_name: string }>).map((t) => t.full_name);
  const contacts = (contactRows ?? []) as Array<ContactLite & { full_name: string | null }>;
  const acts = (actRows ?? []) as ActivityLite[];
  const promises = (promiseRows ?? []) as PromiseRow[];

  const inPeriod = (a: ActivityLite) => a.occurred_at >= from.toISOString();
  const byActor = (a: ActivityLite) => normalizeActor(a.created_by, teamNames);

  const mineAll = acts.filter((a) => byActor(a).kind === "owner");
  const mine = volumeOf(mineAll.filter(inPeriod));
  const minePrev = volumeOf(mineAll.filter((a) => !inPeriod(a)));

  // Първо ЧОВЕШКО докосване на всеки контакт — за скоростта на реакция.
  const firstTouch = new Map<string, string>();
  for (const a of acts) {
    if (!(TOUCH_TYPES as readonly string[]).includes(a.activity_type)) continue;
    if (byActor(a).kind === "auto") continue;
    if (!firstTouch.has(a.contact_id)) firstTouch.set(a.contact_id, a.occurred_at);
  }
  const newLeads = contacts.filter((c) => c.created_at >= from.toISOString() && c.created_at <= now.toISOString());
  const speed = speedOf(newLeads, firstTouch);
  const untouchedNames = newLeads
    .filter((c) => !firstTouch.has(c.id))
    .slice(0, 12)
    .map((c) => c.full_name?.trim() || "без име");

  // Фунията: докъде е стигнал всеки, включително загубените.
  const actsByContact = new Map<string, ActivityLite[]>();
  for (const a of acts) {
    const list = actsByContact.get(a.contact_id) ?? [];
    list.push(a);
    actsByContact.set(a.contact_id, list);
  }
  const funnel = funnelOf(
    contacts.map((c) => ({
      stage: c.stage,
      maxStage:
        c.stage === "lost"
          ? minStageFromActivities(
              (actsByContact.get(c.id) ?? []).map((a) => ({
                activity_type: a.activity_type,
                title: "",
                body: null,
                occurred_at: a.occurred_at,
              }))
            ) ?? "lead"
          : c.stage,
    }))
  );

  // Кой колко е работил — само хора, автоматиките се събират в един ред.
  const volumes = new Map<string, { kind: Actor["kind"]; acts: ActivityLite[] }>();
  for (const a of acts.filter(inPeriod)) {
    const actor = byActor(a);
    const key = actor.kind === "auto" ? "автоматики" : actor.name;
    const row = volumes.get(key) ?? { kind: actor.kind, acts: [] };
    row.acts.push(a);
    volumes.set(key, row);
  }
  const people: PersonRow[] = [...volumes.entries()]
    .map(([name, v]) => ({ name, kind: v.kind, volume: volumeOf(v.acts) }))
    .filter((p) => p.kind !== "auto" || p.volume.calls + p.volume.meetings > 0)
    .sort((a, b) => b.volume.calls + b.volume.meetings - (a.volume.calls + a.volume.meetings));

  return {
    days,
    from: from.toISOString(),
    to: now.toISOString(),
    workdays: workdaysBetween(from, now),
    mine,
    minePrev,
    deltas: {
      calls: deltaPct(mine.calls, minePrev.calls),
      meetings: deltaPct(mine.meetings, minePrev.meetings),
      sent: deltaPct(mine.sent, minePrev.sent),
      people: deltaPct(mine.people, minePrev.people),
    },
    funnel,
    perDay: perDay(mineAll.filter((a) => inPeriod(a) && (TOUCH_TYPES as readonly string[]).includes(a.activity_type)), from, now),
    speed,
    promises: promiseStats(promises, now),
    followups: followupSnapshot(contacts, now),
    won: wonStats(
      contacts
        .filter((c) => c.stage === "won")
        .map((c) => ({ ...c, won_at: wonDate(actsByContact.get(c.id) ?? []) }))
        // Без следа за датата картонът се дати по последна редакция — броят
        // такива излиза на страницата, за да се знае колко е приблизително.
        .filter((c) => (c.won_at ?? c.updated_at) >= from.toISOString())
    ),
    moods: moodMix(contacts.filter((c) => c.stage !== "won" && c.stage !== "lost")),
    people,
    untouchedNames,
  };
}
