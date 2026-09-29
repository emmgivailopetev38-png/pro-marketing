import { listCommissions, loadRules, totals } from "@/lib/team/commissions";
import { listActiveMembers } from "@/lib/team/repository";
import { periodOf } from "@/lib/team/commissions-rules";
import { CommissionsManager } from "@/components/admin/CommissionsManager";

export const dynamic = "force-dynamic";

/** Комисионните на екипа — правила, начисления, „платено“. */
export default async function AdminKomisioniPage() {
  const [rows, rules, members] = await Promise.all([listCommissions(), loadRules(), listActiveMembers()]);
  const byMember = members.map((m) => ({ id: m.id, name: m.full_name, role: m.role, totals: totals(rows.filter((r) => r.member_id === m.id)) }));
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Комисионни</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Уговорката от 22.09.2026: 200 € на затворен проект, 150 € на уебсайт, 10 % от месечната такса при
            маркетинг/поддръжка. Продавачът (от 26.09.2026): 10 % от затворената сделка, веднъж — без месечна.
            Еднократните се начисляват при „Спечелен“; месечните — с бутона за месеца.
          </p>
        </header>
        <CommissionsManager rows={rows} rules={rules} members={byMember} currentPeriod={periodOf()} />
      </div>
    </div>
  );
}
