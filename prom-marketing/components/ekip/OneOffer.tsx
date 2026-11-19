import { Check, ShieldCheck } from "lucide-react";
import { MAIN_OFFER, PRICES_UPDATED } from "@/components/admin/skript/pricing-data";

/**
 * Едната оферта, която се казва от 19.11.2026 — „Пари с AI“ · 4 месеца · 3 900 €.
 * Стои най-отгоре в /ekip/ceni и /admin/skript → Цени; старата стълба е сгъната под нея.
 * Без състояние — само данни от pricing-data.ts.
 */
export function OneOffer() {
  const o = MAIN_OFFER;
  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] sm:p-6"
      style={{
        borderColor: `${o.tint}66`,
        backgroundImage: `radial-gradient(120% 80% at 100% 0%, ${o.tint}22 0%, transparent 60%)`,
      }}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${o.tint}, transparent)` }} />
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: o.tint }}>
        Една оферта · от {PRICES_UPDATED.split(" ")[0]}
      </p>
      <h2 className="mt-1 text-2xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-3xl">{o.name}</h2>
      <p className="mt-1 max-w-2xl text-[13.5px] text-[var(--color-text-secondary)]">{o.tagline}</p>

      <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
        <p className="font-mono text-[40px] font-black leading-none text-[var(--color-text-primary)]">{o.price}</p>
        <p className="pb-1 text-[11.5px] text-[var(--color-text-tertiary)]">{o.priceNote}</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {o.installments.map((v) => (
          <li key={v.term} className="rounded-xl bg-black/30 px-3 py-1.5 text-[11px] text-[var(--color-text-tertiary)]">
            {v.term}{" "}
            <span className="font-mono text-[14px] font-bold text-[var(--color-text-primary)]">{v.monthly}</span>/мес
            <span className="ml-1 opacity-80">· общо {v.total}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[12.5px] italic text-[var(--color-text-secondary)]">{o.who}</p>
      <p className="mt-1 text-[11.5px] text-amber-200/90">{o.notFor}</p>

      {/* механизмът — 4 стъпки */}
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {o.mechanism.map((m) => (
          <li key={m.step} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="font-mono text-[11px] font-bold" style={{ color: o.tint }}>
              {m.step}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-[var(--color-text-primary)]">{m.title}</p>
            <p className="mt-1 text-[12px] leading-snug text-[var(--color-text-secondary)]">{m.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ul className="space-y-1.5">
          {o.includes.map((x) => (
            <li key={x} className="flex gap-2 text-[12.5px] leading-snug text-[var(--color-text-secondary)]">
              <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: o.tint }} />
              {x}
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-3">
            <p className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="size-3.5" /> Гаранцията
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">{o.guarantee}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">Излиза с</p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--color-text-primary)]">{o.outcome}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[12px] italic leading-relaxed" style={{ color: o.tint }}>
        {o.pitch}
      </p>
      <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
        {o.rules.map((r) => (
          <li key={r} className="text-[11.5px] leading-snug text-[var(--color-text-tertiary)]">
            • {r}
          </li>
        ))}
      </ul>
    </section>
  );
}
