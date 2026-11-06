"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { OfferRow } from "@/lib/crm/types";
import { OFFER_STATUS_LABEL, OFFER_STATUS_COLOR, formatMoney, formatDate } from "@/lib/crm/labels";
import { DEFAULT_TEMPLATES, type OfferModule, type OfferTemplate } from "@/lib/oferti/katalog";
import { fmtEur } from "@/lib/oferti/smetki";
import type { OfferFull } from "@/lib/oferti/view";
import type { BuilderState, ContactLite } from "@/lib/oferti/builder-types";
import { OfferBuilder } from "@/components/admin/oferti/OfferBuilder";
import {
  createOfferAction,
  setOfferStatusAction,
  buildOfferAction,
  sendOfferAction,
  saveTemplateAction,
  resetTemplateAction,
} from "@/app/admin/(protected)/offers/actions";

export type { ContactLite };

const STATUS_OPTIONS = Object.keys(OFFER_STATUS_LABEL);
const DEFAULT_KEYS = new Set(DEFAULT_TEMPLATES.map((t) => t.key));
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

type View = "none" | "offer" | "template" | "manual";

export function OffersManager({
  rows,
  contacts,
  templates,
  modules,
  initialOffer,
  initialTemplate,
  presetTemplateKey,
  presetContactId,
  openBuilder,
  builderMode,
}: {
  rows: OfferRow[];
  contacts: ContactLite[];
  templates: OfferTemplate[];
  modules: OfferModule[];
  initialOffer: OfferFull | null;
  initialTemplate: OfferTemplate | null;
  presetTemplateKey: string | null;
  presetContactId: string | null;
  openBuilder: boolean;
  builderMode: "offer" | "template";
}) {
  const [view, setView] = useState<View>(openBuilder ? builderMode : "none");
  const [builderKey, setBuilderKey] = useState(0);
  const [preset, setPreset] = useState<string | null>(presetTemplateKey);
  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const openOffer = (templateKey: string | null) => {
    setPreset(templateKey);
    setBuilderKey((k) => k + 1);
    setView("offer");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => (view === "offer" ? setView("none") : openOffer(null))} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
          {view === "offer" ? "✕ Затвори" : "+ Нова оферта (линк + PDF)"}
        </button>
        <Link href="?new_template=1" className="rounded-md border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20">
          + Нов шаблон
        </Link>
        <button type="button" onClick={() => setView((v) => (v === "manual" ? "none" : "manual"))} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
          {view === "manual" ? "✕ Затвори" : "+ Само запис (без PDF)"}
        </button>
      </div>

      {view === "offer" && (
        <OfferBuilder
          key={`offer-${builderKey}-${initialOffer?.id ?? ""}`}
          mode="offer"
          contacts={contacts}
          templates={templates.filter((t) => t.active)}
          modules={modules}
          initialOffer={initialOffer}
          presetTemplateKey={preset}
          presetContactId={presetContactId}
          build={buildOfferAction}
          send={sendOfferAction}
          onClose={() => setView("none")}
        />
      )}
      {view === "template" && (
        <OfferBuilder
          key={`template-${initialTemplate?.key ?? "new"}`}
          mode="template"
          templates={templates}
          modules={modules}
          initialTemplate={initialTemplate}
          build={saveTemplateAction}
          onClose={() => setView("none")}
        />
      )}
      {view === "manual" && <ManualForm contacts={contacts} onClose={() => setView("none")} />}

      <section className="cc-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Примерни оферти (шаблоните)</h3>
          <span className="text-[11px] text-[var(--color-text-tertiary)]">{templates.length} · асистентите ги виждат през API-то</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <div key={t.key} className={`rounded-xl border p-3 ${t.active ? "border-white/10" : "border-white/5 opacity-60"}`}>
              <p className="text-sm font-semibold">
                {t.name}
                {!t.active && <span className="ml-2 text-[10px] text-[var(--color-text-tertiary)]">скрит</span>}
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{t.description}</p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                {t.items.map((i, j) => (
                  <li key={j}>
                    {i.title} · {i.price === null || i.price === undefined ? <span className="text-amber-300">цена от Ивайло</span> : `${fmtEur(i.price)} ${i.unit}`}
                    {i.setup_price ? ` + ${fmtEur(i.setup_price)}` : ""}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => openOffer(t.key)} className="rounded-md bg-[var(--color-accent-cyan)]/20 px-3 py-1.5 font-semibold text-[var(--color-accent-cyan)]">
                  Използвай
                </button>
                <a href={`/admin/offers/primer/${t.key}/pdf`} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-3 py-1.5">
                  Примерен PDF
                </a>
                <Link href={`?template_edit=${t.key}`} className="rounded-md border border-white/15 px-3 py-1.5">
                  Редактирай
                </Link>
                {DEFAULT_KEYS.has(t.key) && (
                  <form action={resetTemplateAction}>
                    <input type="hidden" name="key" value={t.key} />
                    <button type="submit" className="rounded-md border border-white/10 px-3 py-1.5 text-[var(--color-text-tertiary)]" title="Връща стандартния вариант от каталога">
                      ↺ стандартен
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="cc-panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-deep)] text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Оферта · Клиент</th>
              <th className="px-4 py-3 font-medium text-right">Сума</th>
              <th className="px-4 py-3 font-medium">Валидна до</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {rows.map((o) => {
              const c = o.contact_id ? contactsById.get(o.contact_id) : undefined;
              return (
                <OfferTr key={o.id} o={o} contact={c} />
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  {'Няма оферти още. Избери примерна оферта или „+ Нова оферта" — при „Приета" проектът се създава сам.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferTr({ o, contact }: { o: OfferRow; contact?: ContactLite }) {
  const [sendOpen, setSendOpen] = useState(false);
  const [sendState, sendAct, sending] = useActionState<BuilderState, FormData>(sendOfferAction, null);
  const modular = Boolean(o.token);
  return (
    <>
      <tr className="transition-colors hover:bg-[var(--color-bg-deep)]/40">
        <td className="px-4 py-3">
          <div className="text-[var(--color-text-primary)]">
            {modular && <span className="mr-2 font-mono text-[11px] text-[var(--color-text-tertiary)]">№ {o.number}</span>}
            {o.url ? (
              <a href={o.url} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent-cyan)]">
                {o.title} ↗
              </a>
            ) : (
              o.title
            )}
          </div>
          <div className="text-[11px] text-[var(--color-text-tertiary)]">
            {contact ? (
              <Link href={`/admin/clients/${contact.id}`} className="hover:text-[var(--color-accent-cyan)]">
                {contact.full_name ?? contact.company ?? contact.email}
              </Link>
            ) : (
              "— без контакт"
            )}
            {o.sent_at ? ` · изпратена ${formatDate(o.sent_at)}` : ""}
            {o.accepted_at ? ` · приета ${formatDate(o.accepted_at)}` : ""}
            {o.created_by ? ` · ${o.created_by}` : ""}
          </div>
        </td>
        <td className="px-4 py-3 text-right font-medium text-[var(--color-text-primary)]">{formatMoney(o.amount_gross, o.currency)}</td>
        <td className="px-4 py-3 text-xs text-[var(--color-text-tertiary)]">{formatDate(o.valid_until)}</td>
        <td className="px-4 py-3">
          <form action={setOfferStatusAction} className="inline">
            <input type="hidden" name="offer_id" value={o.id} />
            <select
              name="status"
              defaultValue={o.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-md border px-2 py-1 text-[11px] outline-none"
              style={{ background: `${OFFER_STATUS_COLOR[o.status]}1a`, color: OFFER_STATUS_COLOR[o.status], borderColor: `${OFFER_STATUS_COLOR[o.status]}55` }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {OFFER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </form>
        </td>
        <td className="px-4 py-3 text-xs">
          {modular ? (
            <div className="flex flex-wrap gap-2">
              <a href={`/oferta/${o.token}/pdf`} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-2 py-1">
                PDF
              </a>
              <Link href={`?edit=${o.id}`} className="rounded-md border border-white/15 px-2 py-1">
                Редакция
              </Link>
              {o.status !== "accepted" && (
                <button type="button" onClick={() => setSendOpen((v) => !v)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-300">
                  📧 {o.sent_at ? "Прати пак" : "Изпрати"}
                </button>
              )}
            </div>
          ) : (
            <span className="text-[var(--color-text-tertiary)]">ръчна</span>
          )}
        </td>
      </tr>
      {sendOpen && (
        <tr>
          <td colSpan={5} className="bg-black/20 px-4 py-3">
            {sendState?.ok ? (
              <p className="text-sm text-emerald-300">📧 Изпратена до {sendState.sent?.to}. Отговорът стига до продавача и до Ивайло.</p>
            ) : (
              <form action={sendAct} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input type="hidden" name="id" value={o.id} />
                <div className="space-y-2">
                  <input name="to" type="email" defaultValue={contact?.email ?? ""} placeholder="имейлът на човека" required className={inputCls} />
                  <input name="subject" placeholder="Тема (по желание — иначе стандартната)" className={inputCls} />
                  <textarea name="text" placeholder="Уводът на имейла (по желание) — линкът, редовете, PDF-ът и подписът се добавят сами" className={`${inputCls} min-h-[70px]`} />
                </div>
                <button type="submit" disabled={sending} className="self-start rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60">
                  {sending ? "Праща се…" : "Изпрати с PDF"}
                </button>
                {sendState?.error && <p className="text-xs text-rose-300 sm:col-span-2">{sendState.error}</p>}
              </form>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ManualForm({ contacts, onClose }: { contacts: ContactLite[]; onClose: () => void }) {
  return (
    <form action={createOfferAction} className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
      <h3 className="mb-3 font-display text-base font-semibold">Само запис (оферта, направена другаде)</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Заглавие *">
          <input name="title" required className={inputCls} />
        </Field>
        <Field label="Имейл на клиента">
          <input name="client_email" type="email" list="offer-contact-emails" className={inputCls} />
        </Field>
        <Field label="Линк към офертата">
          <input name="url" placeholder="https://promarketing.pw/oferta/..." className={inputCls} />
        </Field>
        <Field label="Нето">
          <input name="amount_net" type="number" step="0.01" className={inputCls} />
        </Field>
        <Field label="ДДС">
          <input name="vat_amount" type="number" step="0.01" className={inputCls} />
        </Field>
        <Field label="Бруто (общо)">
          <input name="amount_gross" type="number" step="0.01" className={inputCls} />
        </Field>
        <Field label="Валута">
          <input name="currency" defaultValue="EUR" className={inputCls} />
        </Field>
        <Field label="Валидна до">
          <input name="valid_until" type="date" className={inputCls} />
        </Field>
        <Field label="Бележка">
          <input name="notes" className={inputCls} />
        </Field>
      </div>
      <datalist id="offer-contact-emails">
        {contacts
          .filter((c) => c.email)
          .map((c) => (
            <option key={c.id} value={c.email!}>
              {c.full_name ?? c.company ?? c.email}
            </option>
          ))}
      </datalist>
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
          Запази оферта
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
          Отказ
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}
