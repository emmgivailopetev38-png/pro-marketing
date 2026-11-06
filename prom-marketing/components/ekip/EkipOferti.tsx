"use client";
import { useState } from "react";
import { OfferBuilder } from "@/components/admin/oferti/OfferBuilder";
import type { OfferModule, OfferTemplate, SellerKey } from "@/lib/oferti/katalog";
import { fmtEur } from "@/lib/oferti/smetki";
import type { ContactLite } from "@/lib/oferti/builder-types";
import { OFFER_STATUS_COLOR, OFFER_STATUS_LABEL, formatDate } from "@/lib/crm/labels";
import { ekipBuildOfferAction, ekipSendOfferAction } from "@/app/ekip/oferti/actions";

export interface EkipOfferLite {
  id: string;
  number: number | null;
  token: string | null;
  title: string;
  status: string;
  url: string | null;
  valid_until: string | null;
  sent_at: string | null;
  created_at: string;
  amount_gross: number | null;
  contact: { full_name: string | null; company: string | null; email: string | null } | null;
}

export function EkipOferti({
  offers,
  templates,
  modules,
  contacts,
  seller,
  isOwner,
}: {
  offers: EkipOfferLite[];
  templates: OfferTemplate[];
  modules: OfferModule[];
  contacts: ContactLite[];
  seller: SellerKey;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);
  const [builderKey, setBuilderKey] = useState(0);
  const start = (templateKey: string | null) => {
    setPreset(templateKey);
    setBuilderKey((k) => k + 1);
    setOpen(true);
  };
  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-100">
        Един човек — един пакет. Избираш примерната оферта, която му пасва, поправяш точките по разговора и натискаш „Създай“.
        Получаваш линк и PDF — проверяваш ги и чак тогава „Изпрати“. Отстъпка и цена за модул без цена (маркетинг, по мярка) —
        само след „да“ от Ивайло в съобщенията.
      </p>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Примерни оферти</p>
          <button type="button" onClick={() => start(null)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            + Сглоби сам
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.key} className="rounded-xl border border-white/10 p-3">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{t.description}</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                {t.items.map((i) => `${i.title} · ${i.price === null ? "цена от Ивайло" : `${fmtEur(i.price)} ${i.unit}`}`).join(" + ")}
              </p>
              <div className="mt-2 flex gap-2 text-xs">
                <button type="button" onClick={() => start(t.key)} className="rounded-md bg-[var(--color-accent-cyan)]/20 px-3 py-1.5 font-semibold text-[var(--color-accent-cyan)]">
                  Използвай
                </button>
                <a href={`/ekip/oferti/primer/${t.key}/pdf`} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-3 py-1.5">
                  Примерен PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {open && (
        <OfferBuilder
          key={builderKey}
          mode="offer"
          contacts={contacts}
          templates={templates}
          modules={modules}
          presetTemplateKey={preset}
          sellerLocked={isOwner ? null : seller}
          canDiscount={isOwner}
          canVat={isOwner}
          build={ekipBuildOfferAction}
          send={ekipSendOfferAction}
          onClose={() => setOpen(false)}
        />
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Моите оферти · {offers.length}</p>
        <div className="mt-2 divide-y divide-white/5">
          {offers.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-mono text-xs text-[var(--color-text-tertiary)]">№ {o.number ?? "—"}</span> {o.title}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {o.contact?.full_name ?? o.contact?.company ?? "—"}
                  {o.contact?.company && o.contact.full_name ? ` · ${o.contact.company}` : ""} · {formatDate(o.created_at)}
                  {o.sent_at ? ` · изпратена ${formatDate(o.sent_at)}` : ""} · валидна до {formatDate(o.valid_until)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-md px-2 py-0.5" style={{ background: `${OFFER_STATUS_COLOR[o.status] ?? "#888"}22`, color: OFFER_STATUS_COLOR[o.status] ?? "#ccc" }}>
                  {OFFER_STATUS_LABEL[o.status] ?? o.status}
                </span>
                {o.token && (
                  <>
                    <a href={`/oferta/${o.token}`} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)]">
                      линк
                    </a>
                    <a href={`/oferta/${o.token}/pdf`} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)]">
                      PDF
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
          {offers.length === 0 && <p className="py-4 text-xs text-[var(--color-text-tertiary)]">Още няма оферти. Избери примерна оферта отгоре.</p>}
        </div>
      </section>
    </div>
  );
}
