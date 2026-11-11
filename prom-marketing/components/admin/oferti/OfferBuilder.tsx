"use client";
import { useActionState, useMemo, useState } from "react";
import type { OfferItem, OfferModule, OfferTemplate, SellerKey, VatMode } from "@/lib/oferti/katalog";
import { fmtEur, itemFromModule, totals } from "@/lib/oferti/smetki";
import type { OfferFull } from "@/lib/oferti/view";
import type { BuilderAction, ContactLite } from "@/lib/oferti/builder-types";

const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";
const areaCls = `${inputCls} min-h-[72px] leading-relaxed`;

export interface OfferBuilderProps {
  mode: "offer" | "template";
  contacts?: ContactLite[];
  templates: OfferTemplate[];
  modules: OfferModule[];
  initialOffer?: OfferFull | null;
  initialTemplate?: OfferTemplate | null;
  presetTemplateKey?: string | null;
  presetContactId?: string | null;
  /** продавачът е фиксиран (човек от екипа прави оферта от свое име) */
  sellerLocked?: SellerKey | null;
  canDiscount?: boolean;
  canVat?: boolean;
  build: BuilderAction;
  send?: BuilderAction;
  onClose?: () => void;
}

type Draft = {
  /** заглавието на ръка (празно = от модулите) */
  title: string;
  contact_id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  template_key: string;
  items: OfferItem[];
  greeting: "ti" | "vie";
  seller: SellerKey;
  intro: string;
  pain: string;
  outcome: string;
  next_steps: string;
  terms: string;
  ps: string;
  discount: string;
  discount_note: string;
  valid_days: string;
  vat_mode: VatMode;
  notes: string;
  /** ключовете на модулите „за сравнение“ (не влизат в сумата) */
  alternatives: string[];
  /** раздел „Кой е Ивайло Петев“ */
  about: boolean;
  // template mode
  key: string;
  name: string;
  description: string;
  active: boolean;
  sort_order: string;
};

const lines = (a?: string[] | null) => (a ?? []).join("\n");
const toLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const num = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

function fromTemplate(t: OfferTemplate | null | undefined, base: Draft): Draft {
  if (!t) return base;
  const c = t.content ?? {};
  return {
    ...base,
    template_key: t.key,
    items: t.items.map((i) => ({ ...i, bullets: [...(i.bullets ?? [])] })),
    greeting: c.greeting ?? base.greeting,
    intro: c.intro ?? "",
    pain: c.pain ?? "",
    outcome: c.outcome ?? "",
    next_steps: lines(c.next_steps),
    terms: lines(c.terms),
    ps: c.ps ?? "",
    vat_mode: t.vat_mode ?? base.vat_mode,
  };
}

export function OfferBuilder(p: OfferBuilderProps) {
  const contacts = useMemo(() => p.contacts ?? [], [p.contacts]);
  const isTemplate = p.mode === "template";
  const empty: Draft = {
    title: "",
    contact_id: p.presetContactId ?? "",
    client_name: "",
    client_company: "",
    client_email: "",
    template_key: "",
    items: [],
    greeting: "ti",
    seller: p.sellerLocked ?? "ivailo",
    intro: "",
    pain: "",
    outcome: "",
    next_steps: "",
    terms: "",
    ps: "",
    discount: "",
    discount_note: "",
    valid_days: "14",
    vat_mode: "incl",
    notes: "",
    alternatives: [],
    about: false,
    key: "",
    name: "",
    description: "",
    active: true,
    sort_order: "50",
  };

  const initial = useMemo<Draft>(() => {
    if (p.initialOffer) {
      const o = p.initialOffer;
      return {
        ...empty,
        title: o.content.title ?? "",
        contact_id: o.contact_id ?? "",
        client_name: o.content.client_name ?? o.contact?.full_name ?? "",
        client_company: o.content.client_company ?? o.contact?.company ?? "",
        client_email: o.contact?.email ?? "",
        template_key: o.template_key ?? "",
        items: o.items.map((i) => ({ ...i, bullets: [...(i.bullets ?? [])] })),
        greeting: o.content.greeting,
        seller: p.sellerLocked ?? o.content.seller,
        intro: o.content.intro ?? "",
        pain: o.content.pain ?? "",
        outcome: o.content.outcome ?? "",
        next_steps: lines(o.content.next_steps),
        terms: lines(o.content.terms),
        ps: o.content.ps ?? "",
        discount: o.discount ? String(o.discount) : "",
        discount_note: o.discount_note ?? "",
        valid_days: "",
        vat_mode: o.vat_mode,
        notes: o.notes ?? "",
        alternatives: (o.content.alternatives ?? []).map((a) => a.key),
        about: Boolean(o.content.about),
      };
    }
    if (p.initialTemplate) {
      const t = p.initialTemplate;
      return { ...fromTemplate(t, empty), key: t.key, name: t.name, description: t.description, active: t.active, sort_order: String(t.sort_order) };
    }
    if (p.presetTemplateKey) {
      const t = p.templates.find((x) => x.key === p.presetTemplateKey);
      const d = fromTemplate(t, empty);
      if (p.presetContactId) {
        const c = contacts.find((x) => x.id === p.presetContactId);
        if (c) return { ...d, client_name: c.full_name ?? "", client_company: c.company ?? "", client_email: c.email ?? "" };
      }
      return d;
    }
    return empty;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [d, setD] = useState<Draft>(initial);
  const [q, setQ] = useState("");
  const [addKey, setAddKey] = useState(p.modules[0]?.key ?? "");
  const [state, formAction, pending] = useActionState(p.build, null);
  const [sendState, sendAction, sending] = useActionState(p.send ?? (async () => null), null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setItem = (i: number, patch: Partial<OfferItem>) =>
    setD((x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const removeItem = (i: number) => setD((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }));
  const addModule = () => {
    const m = p.modules.find((x) => x.key === addKey);
    if (!m) return;
    setD((x) => ({ ...x, items: [...x.items, itemFromModule(m)] }));
  };
  const pickTemplate = (key: string) => {
    const t = p.templates.find((x) => x.key === key);
    setD((x) => (t ? fromTemplate(t, { ...x, template_key: key }) : { ...x, template_key: "" }));
  };
  const pickContact = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    setD((x) => ({ ...x, contact_id: id, client_name: c?.full_name ?? x.client_name, client_company: c?.company ?? x.client_company, client_email: c?.email ?? x.client_email }));
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? contacts.filter((c) => [c.full_name, c.company, c.email].some((v) => (v ?? "").toLowerCase().includes(s)))
      : contacts;
    return list.slice(0, 80);
  }, [contacts, q]);

  const t = totals(d.items, num(d.discount), d.vat_mode);
  const missingPrice = d.items.filter((i) => i.price === null || i.price === undefined);

  const payload = isTemplate
    ? {
        key: d.key,
        name: d.name,
        description: d.description,
        items: d.items.map(itemPayload),
        content: {
          greeting: d.greeting,
          intro: d.intro || undefined,
          pain: d.pain || undefined,
          outcome: d.outcome || undefined,
          next_steps: toLines(d.next_steps),
          terms: toLines(d.terms),
          ps: d.ps || undefined,
        },
        vat_mode: d.vat_mode,
        active: d.active,
        sort_order: num(d.sort_order) ?? 50,
      }
    : {
        id: p.initialOffer?.id,
        contact_id: d.contact_id || undefined,
        client_email: !d.contact_id && d.client_email ? d.client_email : undefined,
        client_name: d.client_name || undefined,
        client_company: d.client_company || undefined,
        template_key: d.template_key || undefined,
        title: p.initialOffer ? d.title.trim() : d.title.trim() || undefined,
        items: d.items.map(itemPayload),
        greeting: d.greeting,
        seller: d.seller,
        intro: d.intro || undefined,
        pain: d.pain || undefined,
        outcome: d.outcome || undefined,
        next_steps: toLines(d.next_steps),
        terms: toLines(d.terms),
        ps: d.ps || undefined,
        discount: p.canDiscount === false ? undefined : num(d.discount),
        discount_note: p.canDiscount === false ? undefined : d.discount_note || undefined,
        valid_days: num(d.valid_days) ?? undefined,
        vat_mode: p.canVat === false ? undefined : d.vat_mode,
        notes: d.notes || undefined,
        // при промяна без пипане поправките по алтернативите (от асистента) се пазят: пращаме ги само ако списъкът е сменен
        alternatives: sameKeys(d.alternatives, (p.initialOffer?.content.alternatives ?? []).map((a) => a.key)) && p.initialOffer ? undefined : d.alternatives.map((key) => ({ key })),
        about: d.about,
      };

  const done = state?.ok && state.id;

  return (
    <div className="rounded-xl border border-[var(--color-accent-cyan)]/30 bg-[var(--color-accent-cyan)]/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold">
          {isTemplate ? (p.initialTemplate ? `Шаблон „${p.initialTemplate.name}“` : "Нов шаблон (примерна оферта)") : p.initialOffer ? `Оферта № ${p.initialOffer.number ?? "—"} — промяна` : "Нова оферта от модули"}
        </h3>
        {p.onClose && (
          <button type="button" onClick={p.onClose} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            ✕ Затвори
          </button>
        )}
      </div>

      {done ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
          <p className="font-semibold text-emerald-300">
            ✅ {isTemplate ? "Шаблонът е записан." : `Оферта № ${state.number} е готова: ${state.title}`}
          </p>
          {!isTemplate && (
            <>
              <p className="text-sm">
                <a href={state.url} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] underline">
                  {state.url}
                </a>
                {" · "}
                <a href={state.pdf_url} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] underline">
                  PDF
                </a>
              </p>
              {state.summary && <pre className="whitespace-pre-wrap rounded-md bg-black/30 p-3 text-xs text-[var(--color-text-secondary)]">{state.summary}</pre>}
              {p.send && !sendState?.ok && (
                <form action={sendAction} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="id" value={state.id} />
                  <div className="space-y-2">
                    <input name="to" type="text" defaultValue={d.client_email} placeholder="имейлът на човека (няколко — със запетая)" required className={inputCls} />
                    <input name="cc" type="text" placeholder="копие (CC) — по желание, със запетая" className={inputCls} />
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Скрито копие отива до продавача и до Ивайло; отговорите — също.</p>
                    <textarea name="text" placeholder="Уводът на имейла (по желание) — линкът, редовете, PDF-ът и подписът се добавят сами" className={areaCls} />
                  </div>
                  <button type="submit" disabled={sending} className="self-start rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60">
                    {sending ? "Праща се…" : "📧 Изпрати с PDF"}
                  </button>
                  {sendState?.error && <p className="text-xs text-rose-300 sm:col-span-2">{sendState.error}</p>}
                </form>
              )}
              {sendState?.ok && sendState.sent && <p className="text-sm text-emerald-300">📧 Изпратена до {sendState.sent.to}. Отговорът стига до продавача и до Ивайло.</p>}
            </>
          )}
          <a href={isTemplate ? "?" : "?"} className="inline-block text-xs text-[var(--color-text-tertiary)] underline">
            Обнови списъка
          </a>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="payload" value={JSON.stringify(payload)} readOnly />

          {isTemplate ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Ключ (латиница) *">
                <input value={d.key} onChange={(e) => set("key", e.target.value)} disabled={Boolean(p.initialTemplate)} placeholder="programa-2-eli" className={inputCls} />
              </Field>
              <Field label="Име *">
                <input value={d.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Ред">
                <input value={d.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Активен">
                <select value={d.active ? "1" : "0"} onChange={(e) => set("active", e.target.value === "1")} className={inputCls}>
                  <option value="1">да</option>
                  <option value="0">скрит</option>
                </select>
              </Field>
              <Field label="За кого е (вътрешно описание)" className="sm:col-span-2 lg:col-span-4">
                <input value={d.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Търси човек (име, фирма, имейл)">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Лъчезар…" className={inputCls} />
              </Field>
              <Field label="Контакт в CRM-а">
                <select value={d.contact_id} onChange={(e) => pickContact(e.target.value)} className={inputCls}>
                  <option value="">— без контакт (само име) —</option>
                  {filtered.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name ?? "—"}
                      {c.company ? ` · ${c.company}` : ""}
                      {c.email ? ` · ${c.email}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Име на човека">
                <input value={d.client_name} onChange={(e) => set("client_name", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Фирма">
                <input value={d.client_company} onChange={(e) => set("client_company", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Шаблон (примерна оферта)">
                <select value={d.template_key} onChange={(e) => pickTemplate(e.target.value)} className={inputCls}>
                  <option value="">— без шаблон, сглобявам сам —</option>
                  {p.templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Обръщение">
                <select value={d.greeting} onChange={(e) => set("greeting", e.target.value as "ti" | "vie")} className={inputCls}>
                  <option value="ti">на „ти“</option>
                  <option value="vie">на „Вие“</option>
                </select>
              </Field>
              <Field label="От кого е офертата">
                <select value={d.seller} onChange={(e) => set("seller", e.target.value as SellerKey)} disabled={Boolean(p.sellerLocked)} className={inputCls}>
                  <option value="ivailo">Ивайло Петев</option>
                  <option value="georgi">Георги Мандаджиев</option>
                </select>
              </Field>
              <Field label="Заглавие на офертата (по желание)" className="sm:col-span-2">
                <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="празно = от модулите, напр. „Гласов агент + Ели“" className={inputCls} />
              </Field>
              <Field label="Валидна (дни)">
                <input value={d.valid_days} onChange={(e) => set("valid_days", e.target.value)} placeholder={p.initialOffer ? "без промяна" : "14"} className={inputCls} />
              </Field>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Модули</span>
              <select value={addKey} onChange={(e) => setAddKey(e.target.value)} className={`${inputCls} max-w-xs`}>
                {p.modules.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.title}
                    {m.price === null ? " (цена от Ивайло)" : ` · ${fmtEur(m.price)} ${m.unit}`}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addModule} className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/5">
                + Добави
              </button>
            </div>
            {d.items.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Избери шаблон или добави модули. Всеки ред се редактира за човека — цена, точки, бележка.</p>}
            {d.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                  <Field label="Заглавие" className="lg:col-span-2">
                    <input value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label={it.price === null || it.price === undefined ? "Цена € (от Ивайло!)" : "Цена €"}>
                    <input value={it.price ?? ""} onChange={(e) => setItem(i, { price: num(e.target.value) })} className={`${inputCls} ${it.price === null || it.price === undefined ? "border-amber-400/60" : ""}`} />
                  </Field>
                  <Field label="Вид">
                    <select value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value as OfferItem["unit"] })} className={inputCls}>
                      <option value="еднократно">еднократно</option>
                      <option value="/мес">на месец</option>
                    </select>
                  </Field>
                  <Field label="Внедряване €">
                    <input value={it.setup_price ?? ""} onChange={(e) => setItem(i, { setup_price: num(e.target.value) })} className={inputCls} />
                  </Field>
                  <Field label="Бр.">
                    <input value={it.qty ?? 1} onChange={(e) => setItem(i, { qty: Math.max(1, Math.round(num(e.target.value) ?? 1)) })} className={inputCls} />
                  </Field>
                  <Field label="Подзаглавие" className="sm:col-span-2 lg:col-span-6">
                    <input value={it.subtitle ?? ""} onChange={(e) => setItem(i, { subtitle: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Какво включва (по един ред)" className="sm:col-span-2 lg:col-span-3">
                    <textarea value={lines(it.bullets)} onChange={(e) => setItem(i, { bullets: toLines(e.target.value) })} className={areaCls} />
                  </Field>
                  <Field label="Резултатът / не включва / бележка" className="sm:col-span-2 lg:col-span-3">
                    <input value={it.outcome ?? ""} onChange={(e) => setItem(i, { outcome: e.target.value })} placeholder="Резултатът: …" className={`${inputCls} mb-1`} />
                    <input value={(it.not_included ?? []).join(" · ")} onChange={(e) => setItem(i, { not_included: e.target.value.split("·").map((x) => x.trim()).filter(Boolean) })} placeholder="Не включва: … · …" className={`${inputCls} mb-1`} />
                    <input value={it.note ?? ""} onChange={(e) => setItem(i, { note: e.target.value })} placeholder="бележка за човека (курсив)" className={inputCls} />
                  </Field>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                  <span>
                    {it.key} {it.installments?.length ? `· вноски: ${it.installments.map((x) => `${x.term} ${fmtEur(x.monthly)}`).join(", ")}` : ""}
                  </span>
                  <button type="button" onClick={() => removeItem(i)} className="text-rose-300 hover:text-rose-200">
                    махни
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Увод (след „Здравей, …!“) · {име} {фирма} {продавач}">
              <textarea value={d.intro} onChange={(e) => set("intro", e.target.value)} className={areaCls} />
            </Field>
            <Field label="„Това чухме от теб“ — какво каза човекът">
              <textarea value={d.pain} onChange={(e) => set("pain", e.target.value)} className={areaCls} />
            </Field>
            <Field label="Резултатът с едно изречение">
              <textarea value={d.outcome} onChange={(e) => set("outcome", e.target.value)} className={areaCls} />
            </Field>
            <Field label="P.S. (по желание)">
              <textarea value={d.ps} onChange={(e) => set("ps", e.target.value)} className={areaCls} />
            </Field>
            <Field label="Как протича (стъпка на ред) · {дата}">
              <textarea value={d.next_steps} onChange={(e) => set("next_steps", e.target.value)} className={`${areaCls} min-h-[110px]`} />
            </Field>
            <Field label="Условия (по един ред) · {дата}">
              <textarea value={d.terms} onChange={(e) => set("terms", e.target.value)} className={`${areaCls} min-h-[110px]`} />
            </Field>
          </div>

          {!isTemplate && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                За сравнение в офертата — показват се с цената си, но не влизат в сумата (напр. другите нива)
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {p.modules
                  .filter((m) => m.price !== null && m.key !== "custom" && !d.items.some((i) => i.key === m.key))
                  .map((m) => (
                    <label key={m.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d.alternatives.includes(m.key)}
                        disabled={!d.alternatives.includes(m.key) && d.alternatives.length >= 4}
                        onChange={(e) => set("alternatives", e.target.checked ? [...d.alternatives, m.key] : d.alternatives.filter((k) => k !== m.key))}
                      />
                      {m.title} · {fmtEur(m.price)}
                    </label>
                  ))}
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={d.about} onChange={(e) => set("about", e.target.checked)} />
                Раздел „Кой е Ивайло Петев“ — пътят му, числата от CRM-а, линкове към успехите, отзивите и видеата
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {!isTemplate && p.canDiscount !== false && (
              <>
                <Field label="Отстъпка € (само с „да“ от Ивайло)">
                  <input value={d.discount} onChange={(e) => set("discount", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Срещу какво е отстъпката">
                  <input value={d.discount_note} onChange={(e) => set("discount_note", e.target.value)} placeholder="плащане накуп / видеоотзив" className={inputCls} />
                </Field>
              </>
            )}
            {p.canVat !== false && (
              <Field label="ДДС">
                <select value={d.vat_mode} onChange={(e) => set("vat_mode", e.target.value as VatMode)} className={inputCls}>
                  <option value="incl">цените са с ДДС</option>
                  <option value="excl">цените са без ДДС (+20 %)</option>
                  <option value="none">без ред за ДДС</option>
                </select>
              </Field>
            )}
            {!isTemplate && (
              <Field label="Вътрешна бележка (не отива към клиента)">
                <input value={d.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} />
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
            <span>
              Еднократно: <b className="text-amber-300">{fmtEur(t.one_time_after)}</b>
            </span>
            <span>
              Месечно: <b className="text-amber-300">{fmtEur(t.monthly_after)}</b>
            </span>
            {t.discount > 0 && <span>отстъпка {fmtEur(t.discount)}</span>}
            <span className="text-[var(--color-text-tertiary)]">стойност за година {fmtEur(t.year_value)} · ДДС {fmtEur(t.vat)}</span>
            {missingPrice.length > 0 && !isTemplate && (
              <span className="text-amber-300">⚠ без цена: {missingPrice.map((m) => m.title).join(", ")} — цената я дава Ивайло</span>
            )}
          </div>

          {state?.error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>}

          <div className="flex items-center gap-2">
            <button type="submit" disabled={pending || d.items.length === 0} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60">
              {pending ? "Записва се…" : isTemplate ? "Запази шаблона" : p.initialOffer ? "Запази промените" : "Създай офертата (чернова + PDF)"}
            </button>
            {p.onClose && (
              <button type="button" onClick={p.onClose} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                Отказ
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function sameKeys(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((k) => b.includes(k));
}

function itemPayload(i: OfferItem) {
  return {
    key: i.key,
    title: i.title,
    subtitle: i.subtitle || undefined,
    bullets: i.bullets ?? [],
    outcome: i.outcome || undefined,
    not_included: i.not_included && i.not_included.length > 0 ? i.not_included : undefined,
    price: i.price ?? null,
    unit: i.unit,
    setup_price: i.setup_price ?? null,
    setup_label: i.setup_label || undefined,
    qty: i.qty ?? 1,
    note: i.note || undefined,
  };
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}
