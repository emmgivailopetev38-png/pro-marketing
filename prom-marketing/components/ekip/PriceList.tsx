import { PRICES_UPDATED, PRICE_RULES, SERVICES } from "@/components/admin/skript/pricing-data";
import { PriceLadder } from "@/components/ekip/PriceLadder";

/** Ценоразписът за продавачите — само за четене; сменя се в pricing-data.ts от Ивайло. */
export function PriceList() {
  return (
    <div className="space-y-8">
      <PriceLadder />

      <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-100">
        Цените са с ДДС и се казват на глас точно така, както са тук. Не се дава отстъпка без размяна — „искам курса, не
        срещи“ значи Ниво 0 за 2 000 €, „не сега“ значи Petev.ai 199 €/мес, „ще си помисля“ значи депозит 200 €, възстановим.
        Ако нещо липсва, питаш Ивайло в съобщенията, не измисляш. Сверени: {PRICES_UPDATED}.
      </p>

      {SERVICES.map((s) => (
        <section
          key={s.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          style={{ borderColor: `${s.tint}44` }}
        >
          <h2 className="text-base font-semibold" style={{ color: s.tint }}>
            {s.name}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{s.intro}</p>
          {s.rule && <p className="mt-1 text-[11px] text-amber-200">{s.rule}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {s.tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-xl border p-3 ${t.highlight ? "border-[var(--color-accent-cyan)]/50 bg-[var(--color-accent-cyan)]/5" : "border-white/10"}`}
              >
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">{t.name}</p>
                <p className="text-lg font-bold">
                  {t.price}
                  {t.unit && <span className="text-xs font-normal text-[var(--color-text-tertiary)]">{t.unit}</span>}
                </p>
                {t.setup && <p className="text-[11px] text-[var(--color-text-secondary)]">+ {t.setup}</p>}
                <ul className="mt-2 space-y-0.5 text-xs text-[var(--color-text-secondary)]">
                  {t.includes.map((i) => (
                    <li key={i}>• {i}</li>
                  ))}
                </ul>
                {t.value && t.value.length > 0 && (
                  <div className="mt-2 rounded-lg border border-dashed border-white/15 p-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">Стойността в числа</p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {t.value.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-2 text-[11px] italic text-[var(--color-text-tertiary)]">{t.pitch}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold">Правилата за цената</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PRICE_RULES.map((r) => (
            <div key={r.title} className="rounded-xl border border-white/10 p-3">
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{r.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
