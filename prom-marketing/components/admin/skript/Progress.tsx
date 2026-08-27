"use client";

import { useMemo } from "react";
import { TrendingUp, Trophy, Coins, Gauge, Target } from "lucide-react";
import type { CallReview } from "@/app/admin/(protected)/skript/actions";
import { SKILLS, OBJECTIONS, OUTCOMES, STAGES } from "./data";

function fmt(n: number, digits = 0) {
  return n.toLocaleString("bg-BG", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub?: string;
  tint: string;
}) {
  return (
    <div className="cc-panel p-4">
      <p className="mb-2 flex items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
        <Icon className="size-3.5" style={{ color: tint }} />
        {label}
      </p>
      <p className="font-mono text-2xl font-bold" style={{ color: tint }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11.5px] text-[var(--color-text-tertiary)]">{sub}</p>}
    </div>
  );
}

/** Проста линия на средната оценка по разговори, най-старият вляво. */
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 640;
  const h = 120;
  const pad = 10;
  const max = 10;
  const step = (w - pad * 2) / (points.length - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${pad + i * step},${y(p)}`).join(" ");
  const area = `${d} L${pad + (points.length - 1) * step},${h - pad} L${pad},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full">
      <defs>
        <linearGradient id="sp-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[2, 4, 6, 8, 10].map((g) => (
        <g key={g}>
          <line x1={pad} y1={y(g)} x2={w - pad} y2={y(g)} stroke="#ffffff" strokeOpacity="0.06" />
          <text x={2} y={y(g) + 3} fontSize="8" fill="#4a5070" fontFamily="ui-monospace, monospace">
            {g}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#sp-fill)" />
      <path d={d} fill="none" stroke="#06b6d4" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={pad + i * step} cy={y(p)} r="3" fill="#06b6d4" />
      ))}
    </svg>
  );
}

export function Progress({ reviews }: { reviews: CallReview[] }) {
  const stats = useMemo(() => {
    const total = reviews.length;
    const won = reviews.filter((r) => r.outcome === "spechelena");
    const revenue = won.reduce((a, r) => a + (r.deal_value ?? 0), 0);
    const scored = reviews.filter((r) => r.avg_score != null);
    const avg = scored.length
      ? scored.reduce((a, r) => a + (r.avg_score ?? 0), 0) / scored.length
      : 0;

    // средно по умение
    const perSkill = SKILLS.map((s) => {
      const vals = reviews.map((r) => r.scores?.[s.id] ?? 0).filter((n) => n > 0);
      return {
        ...s,
        avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
        count: vals.length,
      };
    });

    // честота на възраженията
    const objCount = OBJECTIONS.map((o) => ({
      ...o,
      count: reviews.filter((r) => (r.objections ?? []).includes(o.id)).length,
    }))
      .filter((o) => o.count > 0)
      .sort((a, b) => b.count - a.count);

    // докъде стигат разговорите
    const stageCount = STAGES.map((s) => ({
      num: s.num,
      title: s.title,
      count: reviews.filter((r) => r.reached_stage === s.num).length,
    }));

    return {
      total,
      wonCount: won.length,
      winRate: total ? (won.length / total) * 100 : 0,
      revenue,
      perCall: total ? revenue / total : 0,
      avg,
      perSkill,
      objCount,
      stageCount,
      trend: [...reviews]
        .filter((r) => r.avg_score != null)
        .reverse()
        .map((r) => r.avg_score as number),
    };
  }, [reviews]);

  if (reviews.length === 0) {
    return (
      <div className="cc-panel p-8 text-center">
        <Target className="mx-auto mb-3 size-8 text-[var(--color-text-tertiary)]" />
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Още няма записан разговор.
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
          Запиши първия в „След срещата“ — оттам нататък тук се вижда дали ставаш по-добър.
        </p>
      </div>
    );
  }

  const weakest = stats.perSkill
    .filter((s) => s.avg != null)
    .sort((a, b) => (a.avg as number) - (b.avg as number))
    .slice(0, 5);
  const strongest = stats.perSkill
    .filter((s) => s.avg != null)
    .sort((a, b) => (b.avg as number) - (a.avg as number))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <Kpi icon={Gauge} label="Проведени" value={String(stats.total)} tint="#94a3b8" />
        <Kpi
          icon={Trophy}
          label="Успеваемост"
          value={`${fmt(stats.winRate, 0)}%`}
          sub={`${stats.wonCount} спечелени · топ е 20–30%`}
          tint={stats.winRate >= 20 ? "#22c55e" : "#f59e0b"}
        />
        <Kpi icon={Coins} label="Оборот" value={`${fmt(stats.revenue)} €`} tint="#a855f7" />
        <Kpi
          icon={Coins}
          label="На разговор"
          value={`${fmt(stats.perCall)} €`}
          sub="включително изгубените"
          tint="#22d3ee"
        />
        <Kpi
          icon={TrendingUp}
          label="Средна оценка"
          value={stats.avg ? stats.avg.toFixed(1) : "—"}
          tint="#06b6d4"
        />
      </div>

      {stats.trend.length >= 2 && (
        <div className="cc-panel p-5">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
            Как върви оценката · от стария към новия разговор
          </p>
          <Spark points={stats.trend} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="cc-panel p-5">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
            Върху това работиш
          </p>
          <div className="space-y-2.5">
            {weakest.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[13.5px] text-[var(--color-text-primary)]">{s.label}</span>
                  <span className="font-mono text-[12.5px] text-[var(--color-text-secondary)]">
                    {(s.avg as number).toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((s.avg as number) / 10) * 100}%`,
                      background:
                        (s.avg as number) <= 4
                          ? "#e11d48"
                          : (s.avg as number) <= 7
                            ? "#f59e0b"
                            : "#22d3ee",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {strongest.length > 0 && (
            <p className="mt-4 text-[12.5px] text-[var(--color-text-tertiary)]">
              Най-силен си в: {strongest.map((s) => s.label).join(" · ")}
            </p>
          )}
        </div>

        <div className="cc-panel p-5">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
            Кои възражения ти идват най-често
          </p>
          {stats.objCount.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-tertiary)]">
              Още не си отбелязал възражение.
            </p>
          ) : (
            <div className="space-y-2.5">
              {stats.objCount.map((o) => (
                <div key={o.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] text-[var(--color-text-primary)]">
                      „{o.label}“
                    </span>
                    <span className="font-mono text-[12.5px] text-[var(--color-text-secondary)]">
                      {o.count}×
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(o.count / stats.total) * 100}%`,
                        background: o.tint,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[12px] text-[var(--color-text-tertiary)]">
                Едно и също възражение три пъти = дупка в скрипта, не възражение.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="cc-panel p-5">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-violet)]">
          Докъде стигат разговорите ти
        </p>
        <div className="flex flex-wrap gap-2">
          {stats.stageCount.map((s) => (
            <div
              key={s.num}
              className="rounded-lg border px-3 py-2"
              style={{
                borderColor: s.count > 0 ? "rgba(168,85,247,0.5)" : "rgba(120,160,220,0.18)",
                background: s.count > 0 ? "rgba(168,85,247,0.10)" : "transparent",
              }}
            >
              <p className="font-mono text-[11px] font-bold text-[var(--color-accent-violet)]">
                {s.num}
              </p>
              <p className="text-[12px] text-[var(--color-text-secondary)]">{s.title}</p>
              <p className="font-mono text-[15px] font-bold text-[var(--color-text-primary)]">
                {s.count}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-[var(--color-text-tertiary)]">
          Ако разговорите ти масово спират преди 04, проблемът не е в цената — не си върнал
          отговорността.
        </p>
      </div>

      <div className="cc-panel overflow-hidden">
        <p className="border-b border-white/8 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          Последните разговори
        </p>
        <div className="divide-y divide-white/6">
          {reviews.slice(0, 12).map((r) => {
            const oc = OUTCOMES.find((o) => o.id === r.outcome);
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="font-mono text-[12px] text-[var(--color-text-tertiary)]">
                  {r.call_date}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--color-text-primary)]">
                  {r.client_name ?? "без име"}
                  {r.lesson && (
                    <span className="text-[var(--color-text-tertiary)]"> · {r.lesson}</span>
                  )}
                </span>
                {r.avg_score != null && (
                  <span className="font-mono text-[12.5px] text-[var(--color-accent-cyan)]">
                    {r.avg_score.toFixed(1)}
                  </span>
                )}
                {oc && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: `${oc.tint}22`, color: oc.tint }}
                  >
                    {oc.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
