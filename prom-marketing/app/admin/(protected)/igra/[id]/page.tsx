import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Детайл на играч/кандидат от „ЛОСТ": профил + мотивация + CV, петте
 * умения като ленти и всички завършени сесии с обратната връзка на
 * треньора и откритите лостове.
 */

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  cv_url: string | null;
  motivation: string | null;
  is_candidate: boolean | null;
  source: string | null;
  profession: string | null;
  created_at: string | null;
};

type ProgressRow = {
  user_id: string;
  total_xp: number | null;
  level_idx: number | null;
  missions_completed: number | null;
  boss_deals_won: number | null;
  sessions_count: number | null;
  best_score: number | null;
  avg_score: number | null;
  deals_closed: number | null;
  skill_avgs: Record<string, number> | null;
  last_played_at: string | null;
};

type SessionRow = {
  id: string;
  mission_id: string | null;
  scenario_id: string | null;
  score: number | null;
  xp_earned: number | null;
  outcome: string | null;
  turn_count: number | null;
  completed_at: string | null;
  duration_seconds: number | null;
};

type ScoreRow = {
  session_id: string;
  discovery: number | null;
  pain_depth: number | null;
  value: number | null;
  objection_handling: number | null;
  closing: number | null;
  total: number | null;
  coach_feedback: Array<{ kind?: string; text?: string }> | null;
};

type LeverRow = {
  session_id: string;
  lever_key: string | null;
  strength: number | null;
  is_power: boolean | null;
  summary: string | null;
};

const SKILLS: Array<{ key: string; label: string }> = [
  { key: "discovery", label: "Откриване" },
  { key: "painDepth", label: "Дълбочина на болката" },
  { key: "value", label: "Стойност" },
  { key: "objectionHandling", label: "Възражения" },
  { key: "closing", label: "Затваряне" },
];

const OUTCOME_META: Record<string, { label: string; color: string }> = {
  won: { label: "спечелена", color: "#22c55e" },
  lost: { label: "загубена", color: "#ef4444" },
  stalled: { label: "застой", color: "#facc15" },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
}

function SkillBar({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className="font-mono text-[var(--color-text-primary)]">{value == null ? "—" : pct}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-deep)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent-cyan)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function IgraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createServiceClient();

  const [{ data: prof }, { data: prog }, { data: sess }] = await Promise.all([
    sb
      .from("sg_profiles")
      .select("id, display_name, email, phone, cv_url, motivation, is_candidate, source, profession, created_at")
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("sg_user_progress")
      .select(
        "user_id, total_xp, level_idx, missions_completed, boss_deals_won, sessions_count, best_score, avg_score, deals_closed, skill_avgs, last_played_at"
      )
      .eq("user_id", id)
      .maybeSingle(),
    sb
      .from("sg_game_sessions")
      .select("id, mission_id, scenario_id, score, xp_earned, outcome, turn_count, completed_at, duration_seconds")
      .eq("user_id", id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(200),
  ]);

  if (!prof) notFound();
  const profile = prof as ProfileRow;
  const progress = (prog ?? null) as ProgressRow | null;
  const sessions = (sess ?? []) as SessionRow[];

  const sessionIds = sessions.map((s) => s.id);
  const missionIds = Array.from(new Set(sessions.map((s) => s.mission_id).filter(Boolean))) as string[];
  const scenarioIds = Array.from(new Set(sessions.map((s) => s.scenario_id).filter(Boolean))) as string[];

  const [{ data: sc }, { data: lev }, { data: mis }, { data: scen }] = await Promise.all([
    sessionIds.length
      ? sb
          .from("sg_scores")
          .select("session_id, discovery, pain_depth, value, objection_handling, closing, total, coach_feedback")
          .in("session_id", sessionIds)
      : Promise.resolve({ data: [] as ScoreRow[] }),
    sessionIds.length
      ? sb
          .from("sg_discovered_levers")
          .select("session_id, lever_key, strength, is_power, summary")
          .in("session_id", sessionIds)
      : Promise.resolve({ data: [] as LeverRow[] }),
    missionIds.length
      ? sb.from("sg_missions").select("id, title, kind").in("id", missionIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string | null; kind: string | null }> }),
    scenarioIds.length
      ? sb.from("sg_scenarios").select("id, title").in("id", scenarioIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string | null }> }),
  ]);

  const scoreBySession = new Map(((sc ?? []) as ScoreRow[]).map((r) => [r.session_id, r]));
  const leversBySession = new Map<string, LeverRow[]>();
  for (const l of (lev ?? []) as LeverRow[]) {
    const list = leversBySession.get(l.session_id) ?? [];
    list.push(l);
    leversBySession.set(l.session_id, list);
  }
  const missionById = new Map(
    ((mis ?? []) as Array<{ id: string; title: string | null; kind: string | null }>).map((m) => [m.id, m])
  );
  const scenarioById = new Map(((scen ?? []) as Array<{ id: string; title: string | null }>).map((s) => [s.id, s]));

  // CV-то живее в частния bucket „cv"; service ролята подписва линк за 1 час.
  let cvHref: string | null = null;
  if (profile.cv_url) {
    if (/^https?:\/\//.test(profile.cv_url)) {
      cvHref = profile.cv_url;
    } else {
      const { data: signed } = await sb.storage.from("cv").createSignedUrl(profile.cv_url, 60 * 60);
      cvHref = signed?.signedUrl ?? null;
    }
  }

  const skillAvgs = progress?.skill_avgs ?? null;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <Link href="/admin/igra" className="text-xs text-[var(--color-accent-cyan)] hover:underline">
          ← всички кандидати
        </Link>
      </div>

      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">
          {profile.is_candidate ? "Кандидат за търговец" : "Играч"}
        </p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">{profile.display_name || "Без име"}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {profile.email || "без имейл"} · {profile.phone || "без телефон"}
          {profile.profession ? ` · ${profile.profession}` : ""}
          {profile.source ? ` · от ${profile.source}` : ""}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          Регистрация: {formatDateTime(profile.created_at)} · последно игра:{" "}
          {formatDateTime(progress?.last_played_at ?? null)}
        </p>
        {cvHref && (
          <p className="mt-3">
            <a
              href={cvHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent-cyan)]/40 px-3 py-1.5 text-sm text-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/10"
            >
              📄 Свали CV (линкът важи 1 час)
            </a>
          </p>
        )}
      </header>

      {profile.motivation && (
        <section className="cc-panel p-5">
          <h2 className="mb-2 font-display text-base font-semibold">💬 Мотивация</h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{profile.motivation}</p>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="cc-panel p-5">
          <h2 className="mb-4 font-display text-base font-semibold">📊 Прогрес</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Мисии</p>
              <p className="font-display text-xl font-semibold">{progress?.missions_completed ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Най-добър</p>
              <p className="font-display text-xl font-semibold">{progress?.best_score ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Среден</p>
              <p className="font-display text-xl font-semibold">
                {progress?.avg_score != null ? Math.round(progress.avg_score) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">XP</p>
              <p className="font-display text-xl font-semibold">{progress?.total_xp ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Ниво</p>
              <p className="font-display text-xl font-semibold">{progress?.level_idx ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Сделки / бос</p>
              <p className="font-display text-xl font-semibold">
                {progress?.deals_closed ?? 0} / {progress?.boss_deals_won ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="cc-panel p-5">
          <h2 className="mb-4 font-display text-base font-semibold">🧭 Умения (средно)</h2>
          {skillAvgs ? (
            <div className="space-y-3">
              {SKILLS.map((s) => (
                <SkillBar key={s.key} label={s.label} value={skillAvgs[s.key] ?? null} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още няма изиграни сесии.</p>
          )}
        </div>
      </section>

      <section className="cc-panel p-5">
        <h2 className="mb-4 font-display text-base font-semibold">
          🎯 Завършени сесии{" "}
          <span className="text-sm font-normal text-[var(--color-text-tertiary)]">({sessions.length})</span>
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">Още няма завършени сесии.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const mission = s.mission_id ? missionById.get(s.mission_id) : undefined;
              const scenario = s.scenario_id ? scenarioById.get(s.scenario_id) : undefined;
              const score = scoreBySession.get(s.id);
              const levers = leversBySession.get(s.id) ?? [];
              const feedback = Array.isArray(score?.coach_feedback) ? score.coach_feedback : [];
              const outcome = s.outcome ? OUTCOME_META[s.outcome] ?? { label: s.outcome, color: "#94a3b8" } : null;
              return (
                <details
                  key={s.id}
                  className="group rounded-lg border border-[var(--color-border-default)] bg-black/20"
                >
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 font-medium">
                      {mission?.kind === "boss" ? "👑 " : ""}
                      {mission?.title || "Мисия"}
                      {scenario?.title ? (
                        <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">
                          {scenario.title}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{formatDateTime(s.completed_at)}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{formatDuration(s.duration_seconds)}</span>
                    <span className="font-display text-base font-semibold">{s.score ?? score?.total ?? "—"}/100</span>
                    {outcome && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ color: outcome.color, backgroundColor: `${outcome.color}1a` }}
                      >
                        {outcome.label}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-secondary)]">+{s.xp_earned ?? 0} XP</span>
                    <span className="text-xs text-[var(--color-text-tertiary)] transition-transform group-open:rotate-90">
                      ▸
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-[var(--color-border-default)]/60 px-4 py-3">
                    {score && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Откриване {score.discovery ?? "—"} · Болка {score.pain_depth ?? "—"} · Стойност{" "}
                        {score.value ?? "—"} · Възражения {score.objection_handling ?? "—"} · Затваряне{" "}
                        {score.closing ?? "—"}
                        {s.turn_count != null ? ` · ${s.turn_count} хода` : ""}
                      </p>
                    )}
                    {feedback.length > 0 && (
                      <div>
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                          Обратна връзка от треньора
                        </p>
                        <ul className="space-y-1.5">
                          {feedback.map((f, i) => (
                            <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                              {f.kind ? (
                                <span className="mr-2 rounded bg-[var(--color-bg-deep)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                                  {f.kind}
                                </span>
                              ) : null}
                              {f.text || ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {levers.length > 0 && (
                      <div>
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                          Открити лостове
                        </p>
                        <ul className="space-y-1.5">
                          {levers.map((l, i) => (
                            <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                              {l.is_power ? "🔥 " : ""}
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {l.lever_key || "лост"}
                              </span>{" "}
                              <span className="text-xs text-[var(--color-text-tertiary)]">
                                (сила {l.strength ?? "—"}/4)
                              </span>
                              {l.summary ? ` — ${l.summary}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.length === 0 && levers.length === 0 && !score && (
                      <p className="text-xs text-[var(--color-text-tertiary)]">Няма записани детайли за тази сесия.</p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
