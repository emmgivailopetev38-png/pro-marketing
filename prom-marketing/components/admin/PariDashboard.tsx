"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { addDebtAction, addMovementAction, markPaidAction, updateDebtAction } from "@/app/admin/(protected)/pari/actions";
import { CATEGORY_LABEL, DEBT_KIND_LABEL, MOVEMENT_CATEGORIES, type Debt } from "@/lib/crm/pari";
import type { PariOverview } from "@/lib/crm/pari-data";

const FIELD = "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";
const TH = "pb-2 font-normal";
const LEVEL = { red: "#e2574e", amber: "#e5c069", green: "#35c08c" } as const;

function eur(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function monthLabel(m: string): string {
  return new Date(`${m}-01T12:00:00Z`).toLocaleDateString("bg-BG", { month: "short", year: "2-digit" });
}

function dmy(d: string | null): string {
  return d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "—";
}

function Btn({ children, small }: { children: React.ReactNode; small?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md bg-[var(--color-accent-cyan)] font-bold text-[var(--color-bg-void)] disabled:opacity-50 ${small ? "px-2 py-1 text-[11px]" : "px-4 py-2 text-sm"}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

function OwnerTag({ owner }: { owner: Debt["owner"] }) {
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${owner === "company" ? "bg-cyan-400/10 text-cyan-300" : "bg-violet-400/10 text-violet-300"}`}>
      {owner === "company" ? "фирма" : "лично"}
    </span>
  );
}

export function PariDashboard({ data }: { data: PariOverview }) {
  const [mov, movAct] = useActionState(addMovementAction, null);
  const [deb, debAct] = useActionState(addDebtAction, null);
  const [dir, setDir] = useState<"in" | "out">("out");
  const t = data.totals;
  const payables = data.debts.filter((d) => d.direction === "payable");
  const receivables = data.debts.filter((d) => d.direction === "receivable");
  const withData = data.summaries.filter((s) => s.clientIncome > 0 || s.out > 0);
  const focus = withData[withData.length - 1] ?? data.summaries[data.summaries.length - 1];
  const max = Math.max(1, ...data.summaries.map((s) => Math.max(s.clientIncome, s.out)));
  const in30 = data.upcoming.reduce((s, u) => s + u.amount, 0);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Дълг · фирма" value={eur(t.payableCompany)} color="#e08a3c" hint={`вноски ${eur(t.installmentsCompany)}/мес`} />
        <Kpi label="Дълг · лично" value={eur(t.payablePersonal)} color="#c98ee0" hint={`вноски ${eur(t.installmentsPersonal)}/мес`} />
        <Kpi label="Ни дължат" value={eur(t.receivable)} color="#35c08c" hint={t.potential > 0 ? `+ ${eur(t.potential)} за договаряне` : undefined} />
        <Kpi label="Плащания до 31 дни" value={eur(in30)} color="#e5c069" hint={`лихви ≈ ${eur(t.interestPerMonth)}/мес`} />
        <Kpi label={`От клиенти · ${monthLabel(focus.month)}`} value={eur(focus.clientIncome)} color="#35c08c" hint={focus.otherIn > 0 ? `+ ${eur(focus.otherIn)} не е приход (кредит/кеш)` : undefined} />
        <Kpi label={`Излезли · ${monthLabel(focus.month)}`} value={eur(focus.out)} color="#e08a3c" />
        <Kpi label={`Резултат · ${monthLabel(focus.month)}`} value={eur(focus.net)} color={focus.net >= 0 ? "#35c08c" : "#e2574e"} />
        <Kpi label={`Теглени в брой · ${monthLabel(focus.month)}`} value={eur(focus.cashWithdrawn)} color={focus.cashWithdrawn > 1000 ? "#e2574e" : "#d9a74a"} hint={focus.cardCash > 0 ? `${eur(focus.cardCash)} от кредитни карти` : undefined} />
      </section>

      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">Оптимизация · къде изтичат и откъде идват пари</h2>
        <ul className="mt-3 space-y-2">
          {data.signals.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-md border border-white/5 bg-black/20 p-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: LEVEL[s.level] }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {s.title}
                  {s.value ? <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">≈ {eur(s.value)}</span> : null}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">{s.detail}</p>
              </div>
            </li>
          ))}
          {data.signals.length === 0 && <li className="text-sm text-[var(--color-text-tertiary)]">Няма сигнали — още няма данни.</li>}
        </ul>
      </section>

      <section className="cc-panel overflow-x-auto p-5">
        <h2 className="font-display text-lg font-bold">Плащания · следващите 31 дни</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className={TH}>Падеж</th>
              <th className={TH}>Какво</th>
              <th className={`${TH} text-right`}>Сума</th>
              <th className={TH}></th>
            </tr>
          </thead>
          <tbody>
            {data.upcoming.map((u) => (
              <tr key={u.debt.id} className="border-t border-white/5">
                <td className="py-2 whitespace-nowrap">
                  {dmy(u.date)}{" "}
                  <span className={`text-[11px] ${u.daysLeft < 0 ? "text-red-300" : u.daysLeft <= 3 ? "text-amber-300" : "text-[var(--color-text-tertiary)]"}`}>
                    {u.daysLeft < 0 ? `просрочено ${-u.daysLeft} д.` : u.daysLeft === 0 ? "днес" : `след ${u.daysLeft} д.`}
                  </span>
                </td>
                <td className="py-2">
                  {u.debt.name} <OwnerTag owner={u.debt.owner} />
                  {u.debt.account && <span className="ml-1 font-mono text-[10px] text-[var(--color-text-tertiary)]">{u.debt.account}</span>}
                </td>
                <td className="py-2 text-right font-mono text-orange-300">{eur(u.amount)}</td>
                <td className="py-2 text-right">
                  <form action={markPaidAction} className="flex items-center justify-end gap-1">
                    <input type="hidden" name="id" value={u.debt.id} />
                    <input name="amount" defaultValue={u.amount} inputMode="decimal" className={`${FIELD} w-24 px-2 py-1 text-xs`} />
                    <Btn small>Платено</Btn>
                  </form>
                </td>
              </tr>
            ))}
            {data.upcoming.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
                  Няма падежи в следващия месец.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <DebtTable title="Кредити и задължения" rows={payables} />
      <DebtTable title="Ни дължат · вземания" rows={receivables} receivable />

      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">Фирмата по месеци · по банката</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <tr>
                <th className={TH}>Месец</th>
                <th className={`${TH} text-right`}>От клиенти</th>
                <th className={`${TH} text-right`}>Друго влязло</th>
                <th className={`${TH} text-right`}>Излезли</th>
                <th className={`${TH} text-right`}>Резултат</th>
                <th className={`${TH} text-right`}>Теглени в брой</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.map((s) => (
                <tr key={s.month} className="border-t border-white/5">
                  <td className="py-2">{monthLabel(s.month)}</td>
                  <td className="py-2 text-right font-mono text-emerald-300">{eur(s.clientIncome)}</td>
                  <td className="py-2 text-right font-mono text-[var(--color-text-tertiary)]">{eur(s.otherIn)}</td>
                  <td className="py-2 text-right font-mono text-orange-300">{eur(s.out)}</td>
                  <td className={`py-2 text-right font-mono ${s.net >= 0 ? "text-emerald-300" : "text-red-300"}`}>{eur(s.net)}</td>
                  <td className="py-2 text-right font-mono text-violet-300">{eur(s.cashWithdrawn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-end gap-2" style={{ height: 90 }}>
          {data.summaries.map((s) => (
            <div key={s.month} className="flex flex-1 items-end justify-center gap-[2px]" title={`${monthLabel(s.month)} · от клиенти ${eur(s.clientIncome)} · излезли ${eur(s.out)} · в брой ${eur(s.cashWithdrawn)}`}>
              <div className="w-1/4 rounded-t-sm bg-emerald-400/70" style={{ height: `${Math.round((s.clientIncome / max) * 100)}%` }} />
              <div className="w-1/4 rounded-t-sm bg-orange-400/70" style={{ height: `${Math.round((s.out / max) * 100)}%` }} />
              <div className="w-1/4 rounded-t-sm bg-violet-400/70" style={{ height: `${Math.round((s.cashWithdrawn / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
          зелено от клиенти · оранжево излезли · лилаво теглени в брой. Пари от кредит, внесен кеш и преводи между нашите сметки не са приход.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Breakdown title={`Излезли · ${monthLabel(focus.month)}`} rows={focus.outByCategory} />
        <Breakdown title={`По кредитните карти · ${monthLabel(focus.month)}`} rows={focus.cardByCategory} note="подробност — погасяването на картите вече е в „излезли“" />
        <div className="cc-panel p-5">
          <h3 className="font-display font-bold">Кой плати · {monthLabel(focus.month)}</h3>
          <ul className="mt-2 space-y-1">
            {focus.topClients.map((c) => (
              <li key={c.counterparty} className="flex justify-between gap-2 text-sm">
                <span className="truncate text-[var(--color-text-secondary)]">{c.counterparty}</span>
                <span className="font-mono text-emerald-300">{eur(c.amount)}</span>
              </li>
            ))}
            {focus.topClients.length === 0 && <li className="text-sm text-[var(--color-text-tertiary)]">—</li>}
          </ul>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cc-panel p-5">
          <h2 className="font-display text-lg font-bold">Ново движение</h2>
          <form action={movAct} className="mt-3 grid grid-cols-2 gap-2">
            <div className="col-span-2 flex gap-2">
              {(["out", "in"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setDir(k)} className={`rounded-full border px-3 py-1 text-xs ${dir === k ? "border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`}>
                  {k === "out" ? "− излязло" : "+ влязло"}
                </button>
              ))}
              <input type="hidden" name="direction" value={dir} />
            </div>
            <input name="amount" inputMode="decimal" required placeholder="сума €" className={FIELD} />
            <input name="occurred_on" type="date" defaultValue={data.today} className={FIELD} />
            <select name="category" defaultValue={dir === "in" ? "client" : "other"} key={dir} className={FIELD}>
              {MOVEMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <input name="counterparty" placeholder="от/към кого" className={FIELD} />
            <select name="account_type" className={FIELD}>
              <option value="bank">банкова сметка</option>
              <option value="card">кредитна карта</option>
            </select>
            <select name="owner" className={FIELD}>
              <option value="company">фирма</option>
              <option value="personal">лично</option>
            </select>
            <input name="account" placeholder="сметка (по избор)" className={FIELD} />
            <input name="description" placeholder="основание" className={FIELD} />
            <div className="col-span-2 flex items-center gap-2">
              <Btn>Запиши</Btn>
              {mov && <span className={`text-xs ${mov.ok ? "text-emerald-300" : "text-red-300"}`}>{mov.message ?? mov.error}</span>}
            </div>
          </form>
        </section>

        <section className="cc-panel p-5">
          <h2 className="font-display text-lg font-bold">Нов кредит, задължение или вземане</h2>
          <form action={debAct} className="mt-3 grid grid-cols-2 gap-2">
            <select name="direction" className={FIELD}>
              <option value="payable">ние дължим</option>
              <option value="receivable">ни дължат</option>
            </select>
            <select name="owner" className={FIELD}>
              <option value="company">фирма</option>
              <option value="personal">лично</option>
            </select>
            <input name="name" required placeholder="име (напр. Кредит ОББ)" className={`${FIELD} col-span-2`} />
            <select name="kind" className={FIELD}>
              {Object.entries(DEBT_KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input name="counterparty" placeholder="банка / клиент" className={FIELD} />
            <input name="balance" inputMode="decimal" placeholder="остатък €" className={FIELD} />
            <input name="installment" inputMode="decimal" placeholder="вноска €/мес" className={FIELD} />
            <input name="due_day" inputMode="numeric" placeholder="ден от месеца (1–31)" className={FIELD} />
            <input name="next_due_date" type="date" className={FIELD} />
            <input name="note" placeholder="бележка" className={`${FIELD} col-span-2`} />
            <label className="col-span-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input type="checkbox" name="potential" value="1" /> още не е договорено (не влиза в сборовете)
            </label>
            <div className="col-span-2 flex items-center gap-2">
              <Btn>Добави</Btn>
              {deb && <span className={`text-xs ${deb.ok ? "text-emerald-300" : "text-red-300"}`}>{deb.message ?? deb.error}</span>}
            </div>
          </form>
        </section>
      </div>

      <section className="cc-panel overflow-x-auto p-5">
        <h2 className="font-display text-lg font-bold">Движения · {data.movements.length}</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className={TH}>Дата</th>
              <th className={TH}>От/към</th>
              <th className={TH}>Категория</th>
              <th className={TH}>Сметка</th>
              <th className={`${TH} text-right`}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {data.movements.slice(0, 150).map((m) => (
              <tr key={m.id} className="border-t border-white/5" title={m.description ?? undefined}>
                <td className="py-1.5 text-xs text-[var(--color-text-tertiary)]">{dmy(m.occurred_on)}</td>
                <td className="py-1.5">
                  {m.counterparty ?? "—"}
                  {m.description && <span className="ml-1 text-[11px] text-[var(--color-text-tertiary)]">· {m.description.slice(0, 60)}</span>}
                </td>
                <td className="py-1.5 text-xs text-[var(--color-text-secondary)]">{CATEGORY_LABEL[m.category] ?? m.category}</td>
                <td className="py-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                  {m.account}
                  {m.account_type === "card" && " · карта"}
                </td>
                <td className={`py-1.5 text-right font-mono ${m.direction === "in" ? "text-emerald-300" : "text-orange-300"}`}>
                  {m.direction === "in" ? "+" : "−"}
                  {eur(m.amount)}
                </td>
              </tr>
            ))}
            {data.movements.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-[var(--color-text-tertiary)]">
                  Още няма движения.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function DebtTable({ title, rows, receivable }: { title: string; rows: Debt[]; receivable?: boolean }) {
  return (
    <section className="cc-panel overflow-x-auto p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          <tr>
            <th className={TH}>Какво</th>
            <th className={`${TH} text-right`}>{receivable ? "Остава да получим" : "Остатък"}</th>
            {!receivable && <th className={`${TH} text-right`}>Лимит</th>}
            <th className={`${TH} text-right`}>{receivable ? "Плащане" : "Вноска"}</th>
            <th className={TH}>Падеж</th>
            {!receivable && <th className={`${TH} text-right`}>Лихва</th>}
            <th className={TH}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <DebtRow key={d.id} d={d} receivable={receivable} />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
                Няма записи.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function DebtRow({ d, receivable }: { d: Debt; receivable?: boolean }) {
  const [state, act] = useActionState(updateDebtAction, null);
  const over = d.kind === "credit_card" && d.credit_limit != null && (d.balance ?? 0) > d.credit_limit;
  const paidShare = d.original_amount && d.balance != null ? Math.max(0, Math.min(100, Math.round(((d.original_amount - d.balance) / d.original_amount) * 100))) : null;
  return (
    <tr className={`border-t border-white/5 align-top ${d.status === "potential" ? "opacity-60" : ""}`}>
      <td className="py-2">
        <p>
          {d.name} <OwnerTag owner={d.owner} />
          {d.status === "potential" && <span className="ml-1 text-[10px] text-amber-300">за договаряне</span>}
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {DEBT_KIND_LABEL[d.kind]}
          {d.counterparty && ` · ${d.counterparty}`}
          {d.account && <span className="font-mono"> · {d.account}</span>}
        </p>
        {paidShare != null && (
          <div className="mt-1 h-1 w-40 rounded bg-white/10" title={`изплатено ${paidShare} % от ${eur(d.original_amount)}`}>
            <div className="h-1 rounded bg-emerald-400/70" style={{ width: `${paidShare}%` }} />
          </div>
        )}
        {d.note && <p className="mt-1 max-w-md text-[11px] text-[var(--color-text-secondary)]">{d.note}</p>}
      </td>
      <td className={`py-2 text-right font-mono ${over ? "text-red-300" : receivable ? "text-emerald-300" : "text-orange-300"}`}>
        {eur(d.balance)}
        {d.balance_as_of && <p className="text-[10px] text-[var(--color-text-tertiary)]">към {dmy(d.balance_as_of)}</p>}
      </td>
      {!receivable && <td className="py-2 text-right font-mono text-[var(--color-text-tertiary)]">{eur(d.credit_limit)}</td>}
      <td className="py-2 text-right font-mono">{eur(d.installment)}</td>
      <td className="py-2 whitespace-nowrap text-xs">
        {dmy(d.next_due_date)}
        {d.due_day && <p className="text-[10px] text-[var(--color-text-tertiary)]">всяко {d.due_day}-о</p>}
        {d.ends_on && <p className="text-[10px] text-[var(--color-text-tertiary)]">до {dmy(d.ends_on)}</p>}
      </td>
      {!receivable && <td className="py-2 text-right text-xs">{d.interest_rate != null ? `${d.interest_rate} %` : "—"}</td>}
      <td className="py-2 text-right">
        <details>
          <summary className="cursor-pointer text-[11px] text-[var(--color-accent-cyan)]">Обнови</summary>
          <form action={act} className="mt-2 grid w-56 gap-1 text-left">
            <input type="hidden" name="id" value={d.id} />
            <input name="balance" inputMode="decimal" placeholder={`остатък (${eur(d.balance)})`} className={`${FIELD} px-2 py-1 text-xs`} />
            <input name="installment" inputMode="decimal" placeholder={`вноска (${eur(d.installment)})`} className={`${FIELD} px-2 py-1 text-xs`} />
            <input name="next_due_date" type="date" className={`${FIELD} px-2 py-1 text-xs`} />
            <label className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
              <input type="checkbox" name="close" value="1" /> изплатено / затвори
            </label>
            <Btn small>Запиши</Btn>
            {state && <span className={`text-[11px] ${state.ok ? "text-emerald-300" : "text-red-300"}`}>{state.message ?? state.error}</span>}
          </form>
        </details>
      </td>
    </tr>
  );
}

function Breakdown({ title, rows, note }: { title: string; rows: Array<{ category: string; amount: number }>; note?: string }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="cc-panel p-5">
      <h3 className="font-display font-bold">{title}</h3>
      {note && <p className="text-[10px] text-[var(--color-text-tertiary)]">{note}</p>}
      <ul className="mt-2 space-y-1">
        {rows.map((r) => (
          <li key={r.category} className="text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-[var(--color-text-secondary)]">{CATEGORY_LABEL[r.category] ?? r.category}</span>
              <span className="font-mono">{eur(r.amount)}</span>
            </div>
            <div className="h-1 rounded bg-white/5">
              <div className="h-1 rounded bg-orange-400/60" style={{ width: `${total ? Math.round((r.amount / total) * 100) : 0}%` }} />
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-[var(--color-text-tertiary)]">—</li>}
      </ul>
    </div>
  );
}

function Kpi({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="cc-panel p-4">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}
