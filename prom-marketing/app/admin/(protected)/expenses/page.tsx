import { createServiceClient } from "@/lib/supabase/service";
import type { ExpenseRow } from "@/lib/crm/types";
import { ExpensesManager } from "@/components/admin/ExpensesManager";
import { formatMoney } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const initialView = params.view === "personal" ? "personal" : params.view === "business" ? "business" : "all";
  const sb = createServiceClient();
  const { data } = await sb.from("expenses").select("*").order("expense_date", { ascending: false });
  const rows = (data ?? []) as ExpenseRow[];
  const active = rows.filter((r) => r.status !== "cancelled");
  const businessTotal = active.filter((r) => !r.is_personal).reduce((s, r) => s + (Number(r.amount_gross) || 0), 0);
  const personalTotal = active.filter((r) => r.is_personal).reduce((s, r) => s + (Number(r.amount_gross) || 0), 0);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Разходи</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {rows.length} записа · бизнес {formatMoney(businessTotal)}
          {personalTotal > 0 ? <> · 💼 лични {formatMoney(personalTotal)}</> : null}
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Hermes добавя разходи от фактурите на доставчиците (счетоводител, хостинг, реклами, GPS хардуер). Ти можеш да добавиш ръчно с „+ Нов разход". Бизнес разходите влизат в печалбата на счетоводното табло; личните покупки се водят отделно.
      </p>

      <ExpensesManager rows={rows} initialView={initialView} />
    </div>
  );
}
