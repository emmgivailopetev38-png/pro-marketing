"use client";
import { useState } from "react";
import { TBI_PORTAL_URL, TBI_USER, tbiTable } from "@/lib/tbi";

const eur = (n: number) => `${n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/**
 * „🏦 На вноски през TBI“ — вноската за всеки срок (сметната точно като
 * калкулатора на TBI) и как се пуска заявката. Стои в картата на човека, в
 * „Цени“ и в таблото на мениджъра. Паролата за портала я дава Ивайло лично.
 */
export function TbiBox({ amount = 3900, open = false }: { amount?: number; open?: boolean }) {
  const [sum, setSum] = useState(amount);
  const rows = tbiTable(sum);
  return (
    <details open={open} className="mt-2 rounded-xl border border-sky-400/25 bg-sky-400/5 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-sky-200">🏦 На вноски през TBI Bank · от {eur(rows[rows.length - 1]?.monthly ?? 0)}/мес</summary>
      <label className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        Сума с ДДС
        <input
          type="number"
          min={300}
          step={50}
          value={sum}
          onChange={(e) => setSum(Math.max(0, Number(e.target.value) || 0))}
          className="w-28 rounded-md border border-white/15 bg-black/20 px-2 py-1 text-right text-xs tabular-nums"
        />
        €
      </label>
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <th className="py-1">Срок</th>
            <th className="py-1 text-right">На месец</th>
            <th className="py-1 text-right">Общо</th>
            <th className="py-1 pl-2">Схема</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.months} className="border-b border-white/5">
              <td className="py-1">{r.months} мес.</td>
              <td className="py-1 text-right font-semibold tabular-nums">{eur(r.monthly)}</td>
              <td className="py-1 text-right tabular-nums text-[var(--color-text-tertiary)]">{eur(r.total)}</td>
              <td className="py-1 pl-2 text-[var(--color-text-tertiary)]">{r.scheme.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-snug text-[var(--color-text-secondary)]">
        <li>Кажи на клиента срока и вноската (без застраховка; точната дава калкулаторът в портала).</li>
        <li>
          Пусни заявката в портала на TBI за търговци:{" "}
          <a href={TBI_PORTAL_URL} target="_blank" rel="noreferrer" className="text-sky-300 underline">
            bnkl.tbibank.bg
          </a>{" "}
          · потребител <b>{TBI_USER}</b> · паролата я дава Ивайло лично. Калкулаторът е вдясно на началната страница.
        </li>
        <li>TBI одобрява клиента и превежда цялата сума на ПроМаркетинг. В картона: „Спечелен“ със сумата и „TBI“ в бележката.</li>
      </ol>
    </details>
  );
}
