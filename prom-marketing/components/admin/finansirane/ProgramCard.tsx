import Link from "next/link";
import {
  CATEGORY_LABEL,
  OUR_ROLE_LABEL,
  PROGRAM_STATUS_LABEL,
  deadlineText,
  deadlineTone,
  type Category,
  type OurRole,
  type ProgramStatus,
} from "@/lib/finansirane/finansirane-rules";
import type { FundingMatch, ProgramWithCounts } from "@/lib/finansirane/repository";
import { STAGE_LABEL, type ContactStage } from "@/lib/contacts/types";
import { cn } from "@/lib/utils";
import { MatchStatusForm } from "./MatchStatusForm";
import { DEADLINE_TONE_CLASS, bgDate, fitTone } from "./format";

const STATUS_TONE: Record<string, string> = {
  open: "border-emerald-400/50 text-emerald-200",
  rolling: "border-sky-400/50 text-sky-200",
  upcoming: "border-amber-400/50 text-amber-200",
  closed: "border-white/15 text-[var(--color-text-tertiary)]",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="hud">{label}</p>
      <div className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-primary)]">{children}</div>
    </div>
  );
}

function sourceLinks(sources: unknown[] | null): { title: string; url: string }[] {
  const out: { title: string; url: string }[] = [];
  for (const s of sources ?? []) {
    if (typeof s === "string" && /^https?:\/\//.test(s)) out.push({ title: s.replace(/^https?:\/\//, "").slice(0, 70), url: s });
    else if (s && typeof s === "object" && typeof (s as { url?: unknown }).url === "string") {
      const o = s as { url: string; title?: string };
      if (/^https?:\/\//.test(o.url)) out.push({ title: o.title || o.url.replace(/^https?:\/\//, "").slice(0, 70), url: o.url });
    }
  }
  return out;
}

/** Една програма: какво е, до кога, кой може, нашата роля — и под нея кои контакти пасват. */
export function ProgramCard({ p, matches, today }: { p: ProgramWithCounts; matches: FundingMatch[]; today: string }) {
  const tone = deadlineTone(p.deadline, today);
  const sources = sourceLinks(p.sources);
  return (
    <article id={p.key} className={cn("cc-panel scroll-mt-24 p-5", p.status === "closed" && "opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">{p.name}</h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            {[p.operator, p.program].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={cn("rounded-md border px-2 py-0.5", STATUS_TONE[p.status] ?? STATUS_TONE.closed)}>
            {PROGRAM_STATUS_LABEL[p.status as ProgramStatus] ?? p.status}
          </span>
          {p.category ? (
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-[var(--color-text-secondary)]">
              {CATEGORY_LABEL[p.category as Category] ?? p.category}
            </span>
          ) : null}
          {p.priority ? <span className="rounded-md border border-white/10 px-2 py-0.5 text-[var(--color-text-secondary)]">P{p.priority}</span> : null}
          {p.for_us ? <span className="rounded-md border border-[var(--color-accent-cyan)]/50 px-2 py-0.5 text-[var(--color-accent-cyan)]">🏢 за нас</span> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Срок">
          <span className={DEADLINE_TONE_CLASS[tone]}>{bgDate(p.deadline)}</span>
          {p.deadline ? <span className={cn("ml-1 text-xs", DEADLINE_TONE_CLASS[tone])}>({deadlineText(p.deadline, today)})</span> : null}
          {p.open_date ? <span className="block text-xs text-[var(--color-text-tertiary)]">отваря {bgDate(p.open_date)}</span> : null}
          {p.deadline_note ? <span className="block text-xs text-[var(--color-text-secondary)]">{p.deadline_note}</span> : null}
        </Field>
        <Field label="Грант / %">{p.grant_text || "—"}</Field>
        <Field label="Бюджет">{p.budget_text || "—"}</Field>
        <Field label="Нашата роля">
          {p.our_role ? OUR_ROLE_LABEL[p.our_role as OurRole] ?? p.our_role : "—"}
          {p.our_services && p.our_services.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {p.our_services.map((s) => (
                <span key={s} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                  {s}
                </span>
              ))}
            </span>
          ) : null}
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {p.beneficiaries ? <Field label="Кой може да кандидатства">{p.beneficiaries}</Field> : null}
        {p.client_profile ? <Field label="Профил на клиента">{p.client_profile}</Field> : null}
        {p.for_us && p.for_us_reason ? <Field label="Защо и ние">{p.for_us_reason}</Field> : null}
      </div>

      {p.eligible_costs || p.notes || sources.length > 0 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            Допустими разходи, бележки, източници
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {p.eligible_costs ? <Field label="Допустими разходи">{p.eligible_costs}</Field> : null}
            {p.notes ? <Field label="Бележки">{p.notes}</Field> : null}
            {sources.length > 0 ? (
              <Field label="Източници">
                <ul className="space-y-0.5">
                  {sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] hover:underline">
                        {s.title} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </Field>
            ) : null}
          </div>
        </details>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
        {p.url ? (
          <a href={p.url} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] hover:underline">
            Официален източник ↗
          </a>
        ) : null}
        {p.last_checked_at ? <span>проверено {bgDate(p.last_checked_at)}</span> : null}
        <span>
          съвпадения {p.matches.total}
          {p.matches.nov ? ` · нови ${p.matches.nov}` : ""}
          {p.matches.kandidatstva ? ` · кандидатстват ${p.matches.kandidatstva}` : ""}
          {p.matches.spechelen ? ` · спечелени ${p.matches.spechelen}` : ""}
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="hud mb-2">Кой от CRM-а може да кандидатства</p>
          <ul className="divide-y divide-white/5">
            {matches.map((m) => (
              <li key={m.id} className={cn("grid gap-2 py-2.5 md:grid-cols-[minmax(0,14rem)_3.5rem_minmax(0,1fr)_auto] md:items-start", m.status === "ne" && "opacity-55")}>
                <div className="min-w-0">
                  <Link href={`/admin/clients/${m.contact_id}`} className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">
                    {m.contact?.full_name || m.contact?.company || "контакт"}
                  </Link>
                  <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                    {[m.contact?.full_name ? m.contact?.company : null, m.contact?.stage ? STAGE_LABEL[m.contact.stage as ContactStage] ?? m.contact.stage : null, m.role]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className={cn("font-mono text-lg font-semibold", fitTone(m.fit))} title="колко пасва (0–100)">
                  {m.fit ?? "—"}
                </div>
                <div className="min-w-0 text-sm">
                  {m.reason ? <p className="text-[var(--color-text-secondary)]">{m.reason}</p> : null}
                  {m.next_step ? <p className="mt-0.5 text-xs text-[var(--color-text-primary)]">👉 {m.next_step}</p> : null}
                </div>
                <MatchStatusForm id={m.id} status={m.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
