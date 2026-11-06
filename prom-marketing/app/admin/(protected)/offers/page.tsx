import { createServiceClient } from "@/lib/supabase/service";
import type { OfferRow } from "@/lib/crm/types";
import { OffersManager } from "@/components/admin/OffersManager";
import type { ContactLite } from "@/lib/oferti/builder-types";
import { formatMoney } from "@/lib/crm/labels";
import { MODULES } from "@/lib/oferti/katalog";
import { getOffer, listTemplates } from "@/lib/oferti/repository";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function OffersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sb = createServiceClient();
  const [{ data: offersData }, { data: contactsData }, templates] = await Promise.all([
    sb.from("offers").select("*").order("created_at", { ascending: false }),
    sb.from("contacts").select("id, full_name, email, company").order("full_name", { ascending: true }),
    listTemplates(true).catch(() => []),
  ]);
  const offers = (offersData ?? []) as OfferRow[];
  const contacts = (contactsData ?? []) as ContactLite[];
  const editId = one(sp.edit);
  const initialOffer = editId ? await getOffer(editId) : null;
  const templateEdit = one(sp.template_edit);
  const initialTemplate = templateEdit ? (templates.find((t) => t.key === templateEdit) ?? null) : null;
  const builderMode: "offer" | "template" = templateEdit || one(sp.new_template) ? "template" : "offer";
  const openBuilder = Boolean(one(sp.new) || editId || one(sp.template) || templateEdit || one(sp.new_template));

  const open = offers.filter((o) => o.status === "sent" || o.status === "viewed");
  const openSum = open.reduce((s, o) => s + (Number(o.amount_gross) || 0), 0);
  const accepted = offers.filter((o) => o.status === "accepted");
  const acceptedSum = accepted.reduce((s, o) => s + (Number(o.amount_gross) || 0), 0);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Оферти</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {offers.length} общо · отворени {open.length} ({formatMoney(openSum)}) · приети {accepted.length} (
          {formatMoney(acceptedSum)})
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Офертата се сглобява от модулите (програмата, Команден център, Ели, маркетинг…), получава линк под promarketing.pw и PDF,
        и тръгва по имейл с прикачен PDF — отговорът стига до продавача и до Ивайло. Пътеката: Чернова → Изпратена → Видяна →{" "}
        <b className="text-emerald-300">Приета</b> (създава проект автоматично) / Отказана. Асистентите в Telegram правят същото
        през API-то.
      </p>

      <OffersManager
        rows={offers}
        contacts={contacts}
        templates={templates}
        modules={MODULES}
        initialOffer={initialOffer}
        initialTemplate={initialTemplate}
        presetTemplateKey={one(sp.template) ?? null}
        presetContactId={one(sp.contact) ?? null}
        openBuilder={openBuilder}
        builderMode={builderMode}
      />
    </div>
  );
}
