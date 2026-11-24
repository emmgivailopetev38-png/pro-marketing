import Link from "next/link";
import { DONE_FOR_YOU, OBUCHENIE, PRODAZHBA_PRAVILA, type KatalogItem } from "@/lib/team/oferti-katalog";

function Item({ it, tone }: { it: KatalogItem; tone: "violet" | "emerald" }) {
  const ring = tone === "violet" ? "border-violet-400/30 bg-violet-500/[0.06]" : "border-emerald-400/30 bg-emerald-500/[0.06]";
  return (
    <li className={`rounded-2xl border p-4 ${it.star ? ring : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold">
          {it.star ? "⭐ " : ""}
          {it.title}
        </p>
        <p className="text-right">
          <span className="text-lg font-bold tabular-nums">{it.price}</span>
          {it.vat && <span className="ml-1 text-[11px] text-[var(--color-text-tertiary)]">{it.vat}</span>}
        </p>
      </div>
      {it.after && <p className="text-right text-[11px] text-[var(--color-text-tertiary)]">{it.after}</p>}
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{it.forWho}</p>
      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-[var(--color-text-secondary)]">
        {it.what.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      {it.tbi && <p className="mt-2 text-[11px] text-sky-200">🏦 TBI: {it.tbi}</p>}
      {it.doc && (
        <Link href={it.doc.href} target="_blank" className="mt-2 inline-block rounded-lg border border-violet-400/50 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:border-violet-300">
          📄 {it.doc.label}
        </Link>
      )}
    </li>
  );
}

/** „💼 Оферти и цени“ — правилата отгоре, после двете графи: обучение и Done for You. */
export function OffersCatalog() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.05] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧭 Правилата на продажбата</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
          {PRODAZHBA_PRAVILA.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-violet-200">🎓 Обучение · правим го с теб</h2>
          <ul className="space-y-3">
            {OBUCHENIE.map((it) => (
              <Item key={it.id} it={it} tone="violet" />
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-emerald-200">🛠 Done for You · ние правим всичко</h2>
          <ul className="space-y-3">
            {DONE_FOR_YOU.map((it) => (
              <Item key={it.id} it={it} tone="emerald" />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
