import "server-only";
import { allRows } from "@/lib/supabase/all-rows";
import { createServiceClient } from "@/lib/supabase/service";
import { listMembers } from "./repository";
import { loadNapredakAll } from "./napredak";
import { isSalesTeam } from "./manager-rules";
import { windowsFor } from "./napredak-rules";
import { orgOf, type TeamRole } from "./types";

/**
 * „🏆 Сделки и класация“ (24.11.2026, Ивайло: „всеки да си води отчет на
 * сделките и класация“). Сделката е на клоузъра, който я води (owner_id), и се
 * брои и на сетъра, който е уговорил човека (routed_to).
 */

export interface DealRow {
  id: string;
  name: string;
  value: number;
  at: string;
  stage: string;
  closer: string | null;
  setter: string | null;
}

export interface RankRow {
  id: string;
  name: string;
  role: TeamRole;
  org: string;
  /** затворени като клоузър: брой и стойност */
  won: number;
  wonValue: number;
  /** уговорени като сетър и после спечелени */
  setWon: number;
  offers: number;
  held: number;
  booked: number;
  calls: number;
  /** точки за класацията — оборотът решава, после сделките, срещите, обажданията */
  score: number;
}

export interface Klasacia {
  days: number;
  rank: RankRow[];
  /** спечелените в периода */
  deals: DealRow[];
  /** в процес: оферта или преговори */
  pipeline: DealRow[];
}

const DAY = 86_400_000;

export function scoreOf(r: Pick<RankRow, "wonValue" | "won" | "setWon" | "held" | "booked" | "calls">): number {
  // 1 € оборот = 1 т.; сделка 300 т.; уговорена сделка 150; проведена среща 40; записана 20; обаждане 1.
  return Math.round(r.wonValue + r.won * 300 + r.setWon * 150 + r.held * 40 + r.booked * 20 + r.calls);
}

export async function loadKlasacia(days: number, now: Date = new Date()): Promise<Klasacia> {
  const sb = createServiceClient();
  const from = days >= 365 ? new Date(now.getTime() - 365 * DAY) : windowsFor({ days, now }).cur.from;
  const [members, napredak, contacts, offers] = await Promise.all([
    listMembers(),
    loadNapredakAll(Math.min(days, 90), now),
    allRows<{ id: string; full_name: string | null; company: string | null; stage: string; deal_value_eur: number | null; updated_at: string; owner_id: string | null; routed_to: string | null }>(
      (a, b) =>
        sb
          .from("contacts")
          .select("id, full_name, company, stage, deal_value_eur, updated_at, owner_id, routed_to")
          .in("stage", ["won", "offer_sent", "negotiating"])
          .order("updated_at", { ascending: false })
          .order("id", { ascending: true })
          .range(a, b)
    ),
    allRows<{ contact_id: string | null; status: string | null; created_at: string }>((a, b) =>
      sb.from("offers").select("contact_id, status, created_at").gte("created_at", from.toISOString()).order("id", { ascending: true }).range(a, b)
    ),
  ]);

  const team = members.filter(isSalesTeam);
  const nameById = new Map(members.map((m) => [m.id, m.full_name]));
  const teamIds = new Set(team.map((m) => m.id));
  const fromIso = from.toISOString();
  const ownerByContact = new Map(contacts.rows.map((c) => [c.id, c.owner_id]));

  const toDeal = (c: (typeof contacts.rows)[number]): DealRow => ({
    id: c.id,
    name: (c.full_name ?? "").trim() || (c.company ?? "").trim() || "Без име",
    value: Number(c.deal_value_eur) || 0,
    at: c.updated_at,
    stage: c.stage,
    closer: c.owner_id ? nameById.get(c.owner_id) ?? null : null,
    setter: c.routed_to ? nameById.get(c.routed_to) ?? null : null,
  });
  const ofTeam = (c: { owner_id: string | null; routed_to: string | null }) => (c.owner_id && teamIds.has(c.owner_id)) || (c.routed_to && teamIds.has(c.routed_to));
  const wonIn = contacts.rows.filter((c) => c.stage === "won" && c.updated_at >= fromIso && ofTeam(c));
  const pipeline = contacts.rows.filter((c) => c.stage !== "won" && ofTeam(c));

  const offersBy = new Map<string, number>();
  for (const o of offers.rows) {
    const owner = o.contact_id ? ownerByContact.get(o.contact_id) : null;
    if (owner && o.status !== "draft") offersBy.set(owner, (offersBy.get(owner) ?? 0) + 1);
  }

  const rank: RankRow[] = team.map((m) => {
    const n = napredak.people.find((p) => p.person.memberId === m.id);
    const mine = wonIn.filter((c) => c.owner_id === m.id);
    const row = {
      id: m.id,
      name: m.full_name,
      role: m.role,
      org: orgOf(m),
      won: mine.length,
      wonValue: mine.reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0),
      setWon: wonIn.filter((c) => c.routed_to === m.id && c.owner_id !== m.id).length,
      offers: offersBy.get(m.id) ?? 0,
      held: n?.cur.closer.held ?? 0,
      booked: n?.cur.meetings.booked ?? 0,
      calls: n?.cur.volume.calls ?? 0,
      score: 0,
    };
    row.score = scoreOf(row);
    return row;
  });
  rank.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "bg"));

  return {
    days,
    rank,
    deals: wonIn.map(toDeal),
    pipeline: pipeline.map(toDeal).sort((a, b) => b.value - a.value),
  };
}
