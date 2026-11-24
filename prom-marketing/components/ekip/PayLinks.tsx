"use client";
import { useState } from "react";
import { TEAM_PAY_LINKS, teamPayUrl } from "@/lib/stripe/team-links";
import { TbiBox } from "./TbiBox";

const eur = (n: number) => `${n.toLocaleString("bg-BG")} €`;

/**
 * „💳 Линк за плащане“ в картата на човека: четирите начина за „Пари с AI“
 * (пълна сума, 75 %, 50 %, депозит 25 %). Копира се линкът за ТОЗИ човек —
 * с попълнен имейл и с картона му, за да се познае плащането.
 */
export function PayLinks({ contactId, email }: { contactId: string; email: string | null }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(key: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1800);
    } catch {
      setCopied(null);
    }
  }
  return (
    <>
    <details className="mt-2 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-emerald-200">💳 Линк за плащане · „Пари с AI“ 3 900 €</summary>
      <ul className="mt-2 space-y-1.5">
        {TEAM_PAY_LINKS.map((l) => {
          const url = teamPayUrl(l, { contactId, email });
          return (
            <li key={l.key} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)]">
                <b className="text-[var(--color-text-primary)]">{l.label}</b> · {eur(l.amountEur)}
                {l.restEur > 0 ? ` · остават ${eur(l.restEur)}` : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copy(l.key, url)}
                  className="rounded-md border border-emerald-400/50 px-2.5 py-1 font-semibold text-emerald-200"
                >
                  {copied === l.key ? "✓ копирано" : "📋 Копирай"}
                </button>
                <a href={url} target="_blank" rel="noreferrer" className="text-[var(--color-text-tertiary)] underline">
                  виж
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-[var(--color-text-tertiary)]">
        Цената е с ДДС. Линкът е за този човек: имейлът му е попълнен. След плащането отбележи „Спечелен“ със сумата, която е платил.
        Остатъкът след първата вноска е със същите линкове: 975 € = „депозит 25 %“, 1 950 € = „50 %“, 2 925 € = „75 %“.
      </p>
    </details>
    <TbiBox />
    </>
  );
}
