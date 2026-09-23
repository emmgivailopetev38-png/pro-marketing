import { loadFinance } from "@/lib/crm/personal-finance-data";
import { PersonalFinanceManager } from "@/components/admin/PersonalFinanceManager";

export const dynamic = "force-dynamic";

/**
 * „Лични финанси“ — парите на физическото лице до парите на фирмата, месец
 * по месец. Фирмените разходи са в „Разходи“ (с отметка „лична покупка“ за
 * личното през фирмата); тук е всичко извън фирмата.
 */
export default async function LichniFinansiPage() {
  const data = await loadFinance(6);
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Лични финанси</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Приходите и разходите ти като човек — отделно от фирмата. Фирмата е в „Разходи“, „Фактури“ и „Плащания“; тук
            стои сравнението месец по месец. Всичко се следи, нищо не се смесва.
          </p>
        </header>
        <PersonalFinanceManager data={data} />
      </div>
    </div>
  );
}
