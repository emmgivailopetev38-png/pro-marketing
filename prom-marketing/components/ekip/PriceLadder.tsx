import { ArrowRight, Check } from "lucide-react";
import { LADDER_FLOW, LEVELS, PRICES_UPDATED, TBI_NOTE } from "@/components/admin/skript/pricing-data";

/**
 * Стълбата: трите нива на обучението като стъпала (I → II → III), вноските на
 * TBI за 6 / 12 / 24 месеца и лентата „как се движи клиентът“. Една и съща при
 * Джордж (/ekip/ceni) и при Ивайло (/admin/skript → Цени). Без състояние — само
 * данни от pricing-data.ts.
 */
export function PriceLadder() {
  const heights = ["md:min-h-[520px]", "md:min-h-[570px]", "md:min-h-[620px]"];
  return (
    <section className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
          Стълбата · {PRICES_UPDATED.split(" ")[0]}
        </p>
        <h2 className="mt-1 text-2xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-3xl">
          Три нива. Една среща — една оферта.
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-[var(--color-text-secondary)]">
          Всяка среща води към Ниво I. Пита „как да печеля“ — Ниво II. Иска най-бързото и най-личното — Ниво III. Цените са с
          ДДС и се казват точно така.
        </p>
      </div>

      {/* стъпалата */}
      <ol className="relative grid gap-4 md:grid-cols-3 md:items-end">
        <span
          aria-hidden
          className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-400/40 via-amber-300/40 to-violet-400/40 md:hidden"
        />
        {LEVELS.map((l, i) => (
          <li
            key={l.id}
            className={`relative flex flex-col overflow-hidden rounded-3xl border bg-white/[0.03] p-5 pl-12 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] md:pl-5 ${heights[i]}`}
            style={{
              borderColor: `${l.tint}55`,
              backgroundImage: `radial-gradient(120% 80% at 100% 0%, ${l.tint}22 0%, transparent 60%)`,
            }}
          >
            {/* лентата отгоре */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(90deg, ${l.tint}, transparent)` }}
            />
            {/* номерът — точка на мобилно, воден знак на десктоп */}
            <span
              className="absolute left-2.5 top-5 flex size-7 items-center justify-center rounded-full border font-mono text-[11px] font-bold md:hidden"
              style={{ borderColor: l.tint, color: l.tint, background: "var(--color-bg-void)" }}
            >
              {l.numeral}
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-6 hidden select-none font-mono text-[120px] font-black leading-none md:block"
              style={{ color: l.tint, opacity: 0.1 }}
            >
              {l.numeral}
            </span>

            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: l.tint }}
              >
                Ниво {l.numeral}
              </span>
              {l.badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-black"
                  style={{ background: l.tint }}
                >
                  {l.badge}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-lg font-bold leading-snug text-[var(--color-text-primary)]">{l.name}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">{l.tagline}</p>

            <p className="mt-4 font-mono text-[34px] font-black leading-none text-[var(--color-text-primary)]">
              {l.price}
            </p>

            {/* вноските на TBI */}
            <div className="mt-3 rounded-2xl border p-2.5" style={{ borderColor: `${l.tint}44`, background: `${l.tint}0d` }}>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                На вноски · TBI
              </p>
              <ul className="mt-1.5 space-y-1">
                {l.installments.map((v) => (
                  <li
                    key={v.term}
                    className="grid grid-cols-[40px_1fr_auto] items-center gap-1.5 rounded-xl bg-black/30 px-2 py-1.5"
                  >
                    <span className="text-[10.5px] text-[var(--color-text-tertiary)]">{v.term}</span>
                    <span className="whitespace-nowrap font-mono text-[15px] font-bold leading-none text-[var(--color-text-primary)]">
                      {v.monthly}
                      <span className="ml-1 font-sans text-[10px] font-normal text-[var(--color-text-tertiary)]">/мес</span>
                    </span>
                    <span className="whitespace-nowrap text-right text-[9px] leading-tight text-[var(--color-text-tertiary)]">
                      общо {v.total}
                      <br />
                      <span className="opacity-80">23,79 %: {v.alt}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-[12px] italic text-[var(--color-text-secondary)]">{l.who}</p>

            <ul className="mt-3 flex-1 space-y-1.5">
              {l.includes.map((x) => (
                <li key={x} className="flex gap-2 text-[12.5px] leading-snug text-[var(--color-text-secondary)]">
                  <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: l.tint }} />
                  {x}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">Излиза с</p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--color-text-primary)]">{l.outcome}</p>
            </div>
            <p className="mt-3 text-[11.5px] italic leading-relaxed" style={{ color: l.tint }}>
              {l.pitch}
            </p>
          </li>
        ))}
      </ol>

      <p className="text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">{TBI_NOTE}</p>

      {/* как се движи клиентът */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          Как се движи клиентът
        </p>
        <ol className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
          {LADDER_FLOW.map((s, i) => (
            <li key={s.label} className="flex shrink-0 items-center gap-1.5">
              <div
                className="rounded-xl border px-3 py-2"
                style={{ borderColor: `${s.tint}66`, background: `${s.tint}12` }}
              >
                <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">{s.label}</p>
                <p className="font-mono text-[11px]" style={{ color: s.tint }}>
                  {s.sub}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">{s.note}</p>
              </div>
              {i < LADDER_FLOW.length - 1 && (
                <ArrowRight className="size-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
