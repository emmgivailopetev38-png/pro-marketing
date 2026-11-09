import Link from "next/link";
import { MATCH_STATUS_LABEL, deadlineText, deadlineTone, todaySofia, type MatchStatus } from "@/lib/finansirane/finansirane-rules";
import type { ContactFundingRow } from "@/lib/finansirane/repository";
import { cn } from "@/lib/utils";
import { MATCH_STATUS_TONE } from "./MatchStatusForm";
import { DEADLINE_TONE_CLASS, bgDate, fitTone } from "./format";

/** В картона: „🇪🇺 Може да кандидатства“ — само ако има съвпадения. */
export function ContactFundingBlock({ rows }: { rows: ContactFundingRow[] }) {
  const list = rows.filter((r) => r.program);
  if (list.length === 0) return null;
  const today = todaySofia();
  return (
    <section className="cc-panel mt-6 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="hud text-[var(--color-accent-cyan)]">🇪🇺 Може да кандидатства · {list.length}</p>
        <Link href="/admin/finansirane" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]">
          Всички евро проекти →
        </Link>
      </div>
      <ul className="divide-y divide-white/5">
        {list.map((r) => {
          const p = r.program!;
          const tone = p.status === "closed" ? "past" : deadlineTone(p.deadline, today);
          return (
            <li key={r.id} className={cn("flex flex-wrap items-start gap-x-4 gap-y-1 py-2.5", (r.status === "ne" || p.status === "closed") && "opacity-60")}>
              <span className={cn("w-10 shrink-0 font-mono text-lg font-semibold", fitTone(r.fit))} title="колко пасва (0–100)">
                {r.fit ?? "—"}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/finansirane#${p.key}`} className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">
                  {p.name}
                </Link>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {[p.grant_text, r.role].filter(Boolean).join(" · ")}
                </p>
                {r.next_step ? <p className="mt-0.5 text-xs text-[var(--color-text-primary)]">👉 {r.next_step}</p> : null}
              </div>
              <div className="text-right text-xs">
                <p className={DEADLINE_TONE_CLASS[tone]}>
                  {p.deadline ? `${bgDate(p.deadline)} · ${deadlineText(p.deadline, today)}` : (p.deadline_note ?? "без срок")}
                </p>
                <span className={cn("mt-1 inline-block rounded-md border px-2 py-0.5", MATCH_STATUS_TONE[r.status as MatchStatus])}>
                  {MATCH_STATUS_LABEL[r.status as MatchStatus] ?? r.status}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
