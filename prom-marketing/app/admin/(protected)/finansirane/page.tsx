import type { Metadata } from "next";
import {
  ACTIVE_STATUSES,
  CATEGORIES,
  CATEGORY_LABEL,
  PROGRAM_STATUSES,
  PROGRAM_STATUS_LABEL,
  deadlineStrip,
  deadlineText,
  deadlineTone,
  todaySofia,
  type Category,
  type ProgramStatus,
} from "@/lib/finansirane/finansirane-rules";
import { listMatches, listPrograms, type FundingMatch, type ProgramWithCounts } from "@/lib/finansirane/repository";
import { ProgramCard } from "@/components/admin/finansirane/ProgramCard";
import { DEADLINE_TONE_CLASS, bgDate } from "@/components/admin/finansirane/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Евро проекти",
  robots: { index: false, follow: false },
};

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

function href(params: { cat?: string; status?: string }): string {
  const q = new URLSearchParams();
  if (params.cat) q.set("cat", params.cat);
  if (params.status) q.set("status", params.status);
  const s = q.toString();
  return `/admin/finansirane${s ? `?${s}` : ""}`;
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={to}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs",
        active ? "border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)] hover:border-white/30"
      )}
    >
      {children}
    </a>
  );
}

function Section({ title, hint, programs, byProgram, today }: { title: string; hint?: string; programs: ProgramWithCounts[]; byProgram: Map<string, FundingMatch[]>; today: string }) {
  if (programs.length === 0) return null;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
          {title} <span className="text-base font-normal text-[var(--color-text-tertiary)]">· {programs.length}</span>
        </h2>
        {hint ? <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p> : null}
      </div>
      {programs.map((p) => (
        <ProgramCard key={p.id} p={p} matches={byProgram.get(p.id) ?? []} today={today} />
      ))}
    </section>
  );
}

/**
 * 🇪🇺 Евро проекти (10.11.2026) — програмите за финансиране (ЕС и национални),
 * които следим, и кои контакти от CRM-а могат да кандидатстват по тях.
 * Пълни я автоматичната задача през /api/crm/finansirane/*; статусите на
 * съвпаденията се сменят тук с бутон.
 */
export default async function FinansiranePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const catRaw = one(sp.cat);
  const statusRaw = one(sp.status);
  const cat = catRaw && (CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : undefined;
  const status = statusRaw && (PROGRAM_STATUSES as readonly string[]).includes(statusRaw) ? statusRaw : undefined;
  const today = todaySofia();

  const all = await listPrograms();
  const filtered = all.filter((p) => (!cat || p.category === cat) && (!status || p.status === status));
  const matches = await listMatches({ programIds: filtered.map((p) => p.id) });
  const byProgram = new Map<string, FundingMatch[]>();
  for (const m of matches) {
    const list = byProgram.get(m.program_id) ?? [];
    list.push(m);
    byProgram.set(m.program_id, list);
  }

  const isActive = (p: ProgramWithCounts) => (ACTIVE_STATUSES as readonly string[]).includes(p.status);
  const strip = deadlineStrip(filtered, today);
  const forUs = filtered.filter((p) => isActive(p) && p.for_us);
  const forClients = filtered.filter((p) => isActive(p) && !p.for_us);
  const closed = filtered.filter((p) => !isActive(p));

  const openCount = all.filter((p) => p.status === "open" || p.status === "rolling").length;
  const upcomingCount = all.filter((p) => p.status === "upcoming").length;
  const urgentCount = all.filter((p) => isActive(p) && deadlineTone(p.deadline, today) === "urgent").length;
  const matchTotal = all.reduce((s, p) => s + p.matches.total, 0);
  const matchNew = all.reduce((s, p) => s + p.matches.nov, 0);
  const catsInUse = CATEGORIES.filter((c) => all.some((p) => p.category === c));

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Финансиране</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">🇪🇺 Евро проекти</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Програмите за финансиране (ЕС и национални), които следим, и кои хора от CRM-а могат да кандидатстват. Пълни се
            автоматично; статусът на всеки човек го сменяш ти с бутон.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="cc-chip">
              отворени <b>{openCount}</b>
            </span>
            <span className="cc-chip">
              предстоят <b>{upcomingCount}</b>
            </span>
            <span className="cc-chip">
              срок до 30 дни <b className={urgentCount ? "text-rose-300" : undefined}>{urgentCount}</b>
            </span>
            <span className="cc-chip">
              съвпадения <b>{matchTotal}</b>
              {matchNew ? <span className="text-sky-200">· нови {matchNew}</span> : null}
            </span>
          </div>
        </header>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Chip to={href({ status })} active={!cat}>
              всички категории
            </Chip>
            {catsInUse.map((c) => (
              <Chip key={c} to={href({ cat: c, status })} active={cat === c}>
                {CATEGORY_LABEL[c as Category]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip to={href({ cat })} active={!status}>
              всички статуси
            </Chip>
            {PROGRAM_STATUSES.map((s) => (
              <Chip key={s} to={href({ cat, status: s })} active={status === s}>
                {PROGRAM_STATUS_LABEL[s as ProgramStatus]}
              </Chip>
            ))}
          </div>
        </div>

        {all.length === 0 ? (
          <p className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">
            Още няма програми. Автоматичната задача ги пълни през <code>POST /api/crm/finansirane/program</code>, а кой може да
            кандидатства — през <code>POST /api/crm/finansirane/match</code>.
          </p>
        ) : filtered.length === 0 ? (
          <p className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">Няма програми с тези филтри.</p>
        ) : null}

        {strip.length > 0 ? (
          <section className="cc-panel p-5">
            <p className="hud mb-3">⏰ Отворени и предстоящи — по срок</p>
            <ul className="divide-y divide-white/5">
              {strip.map((p) => {
                const tone = deadlineTone(p.deadline, today);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
                    <span className={cn("w-24 shrink-0 font-mono", DEADLINE_TONE_CLASS[tone])}>{bgDate(p.deadline)}</span>
                    <span className={cn("w-28 shrink-0 text-xs", DEADLINE_TONE_CLASS[tone])}>{deadlineText(p.deadline, today)}</span>
                    <a href={`#${p.key}`} className="min-w-0 flex-1 text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">
                      {p.for_us ? "🏢 " : ""}
                      {p.name}
                    </a>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {PROGRAM_STATUS_LABEL[p.status as ProgramStatus] ?? p.status}
                      {p.matches.total ? ` · ${p.matches.total} души` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <Section title="🏢 За нас (ProMarketing кандидатства)" programs={forUs} byProgram={byProgram} today={today} />
        <Section title="👥 За клиентите" hint="Нашата роля: изпълнител, партньор или консултант по проекта им." programs={forClients} byProgram={byProgram} today={today} />

        {closed.length > 0 ? (
          <details className="space-y-3" open={status === "closed"}>
            <summary className="cursor-pointer font-display text-xl text-[var(--color-text-secondary)]">
              Затворени · {closed.length}
            </summary>
            <div className="mt-3 space-y-3">
              {closed.map((p) => (
                <ProgramCard key={p.id} p={p} matches={byProgram.get(p.id) ?? []} today={today} />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
