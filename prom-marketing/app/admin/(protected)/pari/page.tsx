import { loadPari } from "@/lib/crm/pari-data";
import { PariDashboard } from "@/components/admin/PariDashboard";

export const dynamic = "force-dynamic";

/**
 * „Пари · равносметка“ — кредитите, вземанията, приходите, разходите и
 * тегленото в брой на едно място, по банката (не по фактурите), със сигнали
 * какво да се оптимизира.
 */
export default async function PariPage() {
  const data = await loadPari(6);
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Пари · равносметка</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Колко дължим и на кого, колко ни дължат, какво влиза и излиза по банката и колко се тегли в брой. Сигналите отдолу
            казват къде изтичат пари. Личните кредити са тук, а ежедневните лични разходи — в „Лични финанси“.
          </p>
        </header>
        <PariDashboard data={data} />
      </div>
    </div>
  );
}
