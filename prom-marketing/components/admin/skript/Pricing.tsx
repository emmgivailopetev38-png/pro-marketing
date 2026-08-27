"use client";

import { useState } from "react";
import { Check, Clock, Quote, AlertTriangle } from "lucide-react";
import { SERVICES, BUNDLES, TARGET_MIX, PRICE_RULES } from "./pricing-data";

export function Pricing() {
  const [active, setActive] = useState(SERVICES[0].id);
  const svc = SERVICES.find((s) => s.id === active)!;

  return (
    <div className="space-y-8">
      {/* ---- целта ---- */}
      <div className="cc-panel overflow-hidden">
        <div className="border-b border-white/8 bg-[rgba(6,182,212,0.07)] px-5 py-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
            Къде се стремиш
          </p>
          <h3 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            {TARGET_MIX.goal}
          </h3>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-[13.5px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                    Какво
                  </th>
                  <th className="py-2 text-right font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                    Носи
                  </th>
                  <th className="py-2 text-right font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                    Взема ми
                  </th>
                </tr>
              </thead>
              <tbody>
                {TARGET_MIX.rows.map((r) => (
                  <tr key={r.what} className="border-b border-white/6">
                    <td className="py-2.5 text-[var(--color-text-primary)]">{r.what}</td>
                    <td className="py-2.5 text-right font-mono text-[var(--color-accent-cyan)]">
                      {r.income}
                    </td>
                    <td className="py-2.5 text-right text-[var(--color-text-tertiary)]">{r.time}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 font-bold text-[var(--color-text-primary)]">Общо</td>
                  <td
                    className="py-3 text-right font-mono text-base font-bold text-emerald-300"
                    colSpan={2}
                  >
                    {TARGET_MIX.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            {TARGET_MIX.note}
          </p>
        </div>
      </div>

      {/* ---- услугите ---- */}
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className="rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition"
                style={{
                  borderColor: on ? s.tint : "rgba(120,160,220,0.25)",
                  background: on ? `${s.tint}22` : "transparent",
                  color: on ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        <p className="mb-4 max-w-3xl text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {svc.intro}
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {svc.tiers.map((t) => (
            <div
              key={t.name}
              className="cc-panel flex flex-col p-5"
              style={t.highlight ? { borderColor: `${svc.tint}88` } : undefined}
            >
              {t.highlight && (
                <span
                  className="mb-2 self-start rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em]"
                  style={{ background: `${svc.tint}26`, color: svc.tint }}
                >
                  ТОВА СЕ ИЗБИРА НАЙ-ЧЕСТО
                </span>
              )}
              <h4 className="text-[15px] font-bold text-[var(--color-text-primary)]">{t.name}</h4>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-bold" style={{ color: svc.tint }}>
                  {t.price}
                </span>
                {t.unit && (
                  <span className="text-[13px] text-[var(--color-text-tertiary)]">{t.unit}</span>
                )}
              </p>
              {t.setup && (
                <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">+ {t.setup}</p>
              )}

              <ul className="mt-4 flex-1 space-y-1.5">
                {t.includes.map((i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-[var(--color-text-secondary)]">
                    <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: svc.tint }} />
                    {i}
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex items-center gap-1.5 border-t border-white/8 pt-3 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                <Clock className="size-3" /> {t.myTime}
              </p>
              <p className="mt-2 flex gap-2 text-[12.5px] italic leading-relaxed text-[#a5f3fc]">
                <Quote className="mt-0.5 size-3 shrink-0" />
                {t.pitch}
              </p>
            </div>
          ))}
        </div>

        {svc.rule && (
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-400/30 bg-amber-500/[0.07] p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <p className="text-[13.5px] leading-relaxed text-[#fde68a]">{svc.rule}</p>
          </div>
        )}
      </div>

      {/* ---- пакетите ---- */}
      <div>
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-violet)]">
          Пакетите
        </p>
        <h3 className="mb-1 text-xl font-bold text-[var(--color-text-primary)]">
          Най-силният ход: не продавай услуга, продавай ниво
        </h3>
        <p className="mb-4 max-w-3xl text-[13.5px] text-[var(--color-text-secondary)]">
          Отделната услуга се сравнява с цена. Пакетът се сравнява с това къде иска да бъде
          бизнесът му. Давай трите заедно — средният се избира.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {BUNDLES.map((b) => (
            <div
              key={b.id}
              className="cc-panel flex flex-col p-5"
              style={b.highlight ? { borderColor: `${b.tint}88` } : undefined}
            >
              <p
                className="font-mono text-[11px] font-bold tracking-[0.18em]"
                style={{ color: b.tint }}
              >
                {b.name}
              </p>
              <p className="mt-2 font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                {b.price}
              </p>
              <p className="text-[13px] text-[var(--color-text-tertiary)]">после {b.monthly}</p>
              <p className="mt-3 text-[13px] italic text-[var(--color-text-secondary)]">{b.who}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {b.includes.map((i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-[var(--color-text-secondary)]">
                    <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: b.tint }} />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ---- правилата ---- */}
      <div>
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
          Правилата за цената
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {PRICE_RULES.map((r) => (
            <div key={r.title} className="cc-panel p-4">
              <p className="mb-1.5 text-[14px] font-bold text-[var(--color-text-primary)]">
                {r.title}
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
