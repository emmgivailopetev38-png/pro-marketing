import Link from "next/link";
import { ZVANENE_HINT, type ZvaneneTab, type ZvaneneView } from "@/lib/team/zvanene-vidove";

/**
 * Подкатегориите на „Звънене“ — вторият ред под шапката. Всеки таб носи
 * числото си, а червеният бадж казва колко от тях горят днес. На телефон
 * лентата се плъзга хоризонтално, точно като менюто с модулите.
 */
export function ZvaneneTabs({ tabs, active }: { tabs: ZvaneneTab[]; active: ZvaneneView }) {
  return (
    <div className="space-y-2">
      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Изгледи на звъненето">
        {tabs.map((t) => {
          const on = t.view === active;
          return (
            <Link
              key={t.view}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold ${
                on
                  ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]"
                  : "border-white/10 text-[var(--color-text-secondary)]"
              }`}
            >
              {t.label}
              <span className={on ? "text-[var(--color-accent-cyan)]" : "text-[var(--color-text-tertiary)]"}>{t.count}</span>
              {t.urgent > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{t.urgent}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <p className="text-[11px] leading-snug text-[var(--color-text-tertiary)]">{ZVANENE_HINT[active]}</p>
    </div>
  );
}
