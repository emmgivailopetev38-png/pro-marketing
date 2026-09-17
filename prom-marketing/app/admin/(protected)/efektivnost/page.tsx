import Link from "next/link";
import { loadEfektivnost } from "@/lib/crm/efektivnost-data";
import { EfektivnostBoard } from "@/components/admin/EfektivnostBoard";

export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90] as const;

/**
 * „Моята ефективност“ — върша ли си работата и къде тече.
 *
 * Таблото на /admin отговаря на „как върви бизнесът“. Тази страница отговаря на
 * друго: колко хора съм чул, колко бързо стигам до новия човек, държа ли на
 * думата си и какво излиза от всичко това. Броят се само човешки действия.
 */
export default async function EfektivnostPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.d) as (typeof PERIODS)[number]) ? Number(sp.d) : 30;
  const data = await loadEfektivnost(days);

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Моята ефективност</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Колко хора съм чул, колко бързо стигам до новия, държа ли на думата си и какво излиза от това. Броят се само
            човешки действия — поредиците и ботовете не са ничия заслуга.
          </p>
          <div className="mt-4 flex gap-2">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin/efektivnost?d=${p}`}
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

        <EfektivnostBoard data={data} />
      </div>
    </div>
  );
}
