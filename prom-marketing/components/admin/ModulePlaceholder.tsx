// Shared shell for modules that exist as schema + UI scaffold but don't yet
// have a live integration. Command-center styled (glass header, KPI tiles).

import Link from "next/link";
import type { CSSProperties } from "react";

export interface PlaceholderFeature {
  title: string;
  description: string;
  icon?: string;
  ready?: boolean;
}

export interface PlaceholderProps {
  icon: string;
  title: string;
  description: string;
  status: { label: string; tone: "ready" | "pending" | "wip" };
  features: PlaceholderFeature[];
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  /** Optional live count widgets — shown as a stat strip. */
  stats?: Array<{ label: string; value: string | number; color?: string; hint?: string }>;
  children?: React.ReactNode;
}

export function ModulePlaceholder({
  icon,
  title,
  description,
  status,
  features,
  primaryAction,
  secondaryAction,
  stats,
  children,
}: PlaceholderProps) {
  const tone =
    status.tone === "ready" ? "#35c08c" : status.tone === "wip" ? "#e5c069" : "#94a3b8";

  return (
    <div className="space-y-6 p-5 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: tone, borderColor: tone, background: `${tone}1a` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone, boxShadow: `0 0 8px ${tone}` }} />
              {status.label}
            </span>
            <h1 className="cc-title mt-3 font-display text-3xl font-bold">
              <span className="mr-2">{icon}</span>
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {primaryAction && (
              <Link href={primaryAction.href} className="cc-btn cc-btn-primary">
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link href={secondaryAction.href} className="cc-btn">
                {secondaryAction.label}
              </Link>
            )}
          </div>
        </div>
      </header>

      {stats && stats.length > 0 && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="cc-kpi p-4" style={{ "--kpi": s.color ?? "#d9a74a" } as CSSProperties}>
              <p className="hud">{s.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold" style={{ color: s.color ?? "var(--color-text-primary)" }}>
                {s.value}
              </p>
              {s.hint && <p className="text-[11px] text-[var(--color-text-tertiary)]">{s.hint}</p>}
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="cc-panel flex gap-3 p-4">
            <span className="text-2xl">{f.icon ?? "•"}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{f.title}</h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                    f.ready
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {f.ready ? "готово" : "очаква"}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{f.description}</p>
            </div>
          </div>
        ))}
      </section>

      {children}
    </div>
  );
}
