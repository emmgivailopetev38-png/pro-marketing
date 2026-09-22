import Link from "next/link";
import { loadKonversii } from "@/lib/crm/konversii-data";
import { KonversiiBoard } from "@/components/admin/KonversiiBoard";

export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90] as const;

/**
 * „Конверсии“ — колко лийда влизат, колко Димитър чува, колко срещи правим и
 * от тях колко човека затваряме. По източник, по седмица, по човек.
 */
export default async function KonversiiPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.d) as (typeof PERIODS)[number]) ? Number(sp.d) : 30;
  const data = await loadKonversii(days);

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Конверсии</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Лийд → докоснат → говорихме → среща → проведена → оферта → клиент. Всяка стъпка е следа в картона, не етап.
            Загубеният се брои до стъпката, до която е стигнал.
          </p>
          <div className="mt-4 flex gap-2">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin/konversii?d=${p}`}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: days === p ? "var(--color-accent-cyan)" : "var(--color-border-default)",
                  background: days === p ? "rgba(0,212,255,0.10)" : "transparent",
                  color: days === p ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
                }}
              >
                {p} дни
              </Link>
            ))}
          </div>
        </header>
        <KonversiiBoard d={data} />
      </div>
    </div>
  );
}
