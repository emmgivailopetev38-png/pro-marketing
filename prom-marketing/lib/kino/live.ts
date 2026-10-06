import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { parseLiveUrl, type LiveTarget } from "./live-url";
import { isDbConfigured, isMissingSchema, SCREENING } from "./server";

/**
 * Режисьорската кабина: „Влизам на живо“ (линк към Zoom / Google Meet /
 * YouTube Live), колко души са в залата сега и въпросите, докато пристигат.
 *
 * Превключвателят е в таблица kino_live (един ред на прожекция), всяко
 * натискане остава в kino_live_log — кой, кога, с какъв линк. По подразбиране
 * е ИЗКЛЮЧЕН. Без миграцията кабината казва „миграцията не е приложена“ и
 * залата просто не показва бутона.
 */

export interface LiveState {
  on: boolean;
  url: string | null;
  target: LiveTarget | null;
  since: string | null;
  by: string | null;
  /** таблицата е налице (миграцията е приложена) */
  ready: boolean;
}

const OFF: LiveState = { on: false, url: null, target: null, since: null, by: null, ready: false };

// Залата пита на ~25 s на човек — четенето се пази 5 s в паметта на инстанцията.
let cache: { at: number; state: LiveState } | null = null;

export async function getLiveState(maxAgeMs = 5_000): Promise<LiveState> {
  if (!isDbConfigured()) return OFF;
  if (cache && Date.now() - cache.at < maxAgeMs) return cache.state;
  const { data, error } = await createServiceClient()
    .from("kino_live")
    .select("is_on, url, updated_at, updated_by")
    .eq("screening_id", SCREENING)
    .maybeSingle();
  if (error) {
    if (!isMissingSchema(error)) console.error("[kino/live]", error.message);
    return OFF;
  }
  const row = data as { is_on: boolean; url: string | null; updated_at: string | null; updated_by: string | null } | null;
  const target = parseLiveUrl(row?.url);
  const state: LiveState = {
    on: Boolean(row?.is_on && target),
    url: row?.url ?? null,
    target,
    since: row?.updated_at ?? null,
    by: row?.updated_by ?? null,
    ready: true,
  };
  cache = { at: Date.now(), state };
  return state;
}

export async function setLiveState(on: boolean, url: string | null, actor: string): Promise<{ ok: boolean; error?: string }> {
  if (!isDbConfigured()) return { ok: false, error: "Няма база (локален преглед)." };
  const sb = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await sb
    .from("kino_live")
    .upsert({ screening_id: SCREENING, is_on: on, url, updated_at: now, updated_by: actor }, { onConflict: "screening_id" });
  if (error) {
    return { ok: false, error: isMissingSchema(error) ? "Миграцията не е приложена — кабината тръгва след нея." : error.message };
  }
  const { error: logErr } = await sb.from("kino_live_log").insert({ screening_id: SCREENING, is_on: on, url, actor });
  if (logErr) console.error("[kino/live] log", logErr.message);
  console.info(`[kino/live] ${on ? "ON" : "OFF"} · ${actor} · ${url ?? "—"}`);
  cache = null;
  return { ok: true };
}

export interface BoothData {
  ready: boolean;
  /** в залата сега (пулс в последните 45 s) */
  inHall: number;
  /** от тях гледат филма в момента */
  watching: number;
  live: { on: boolean; url: string | null; label: string | null; since: string | null; by: string | null };
  log: Array<{ on: boolean; url: string | null; actor: string | null; at: string }>;
  questions: Array<{ id: string; contactId: string; name: string; text: string; minute: number | null; at: string }>;
}

export async function loadBooth(): Promise<BoothData> {
  const empty: BoothData = { ready: false, inHall: 0, watching: 0, live: { on: false, url: null, label: null, since: null, by: null }, log: [], questions: [] };
  if (!isDbConfigured()) return empty;
  const sb = createServiceClient();
  const since = new Date(Date.now() - 45_000).toISOString();
  const [live, present, logRes, qRes] = await Promise.all([
    getLiveState(0),
    sb.from("kino_watch").select("contact_id, last_mode").eq("screening_id", SCREENING).gte("last_seen_at", since).limit(5000),
    sb.from("kino_live_log").select("is_on, url, actor, created_at").eq("screening_id", SCREENING).order("created_at", { ascending: false }).limit(8),
    sb
      .from("contact_activities")
      .select("id, contact_id, body, metadata, occurred_at")
      .eq("activity_type", "kino_question")
      .order("occurred_at", { ascending: false })
      .limit(60),
  ]);
  const rows = (present.data ?? []) as Array<{ contact_id: string; last_mode: string | null }>;
  const qs = ((qRes.data ?? []) as Array<{ id: string; contact_id: string; body: string | null; metadata: Record<string, unknown> | null; occurred_at: string }>)
    .filter((q) => (q.metadata ?? {}).screening === SCREENING)
    .slice(0, 30);
  const names = new Map<string, string>();
  if (qs.length) {
    const { data } = await sb.from("contacts").select("id, full_name, email").in("id", [...new Set(qs.map((q) => q.contact_id))]);
    for (const c of (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) names.set(c.id, c.full_name?.trim() || c.email || "Без име");
  }
  return {
    ready: live.ready && !present.error,
    inHall: rows.length,
    watching: rows.filter((r) => r.last_mode === "premiere").length,
    live: { on: live.on, url: live.url, label: live.target?.label ?? null, since: live.since, by: live.by },
    log: ((logRes.data ?? []) as Array<{ is_on: boolean; url: string | null; actor: string | null; created_at: string }>).map((l) => ({
      on: l.is_on,
      url: l.url,
      actor: l.actor,
      at: l.created_at,
    })),
    questions: qs.map((q) => {
      const pos = typeof q.metadata?.pos === "number" ? Number(q.metadata.pos) : null;
      return {
        id: q.id,
        contactId: q.contact_id,
        name: names.get(q.contact_id) ?? "—",
        text: (q.body ?? "").split("\n\n(")[0],
        minute: pos != null ? Math.floor(pos / 60) + 1 : null,
        at: q.occurred_at,
      };
    }),
  };
}
