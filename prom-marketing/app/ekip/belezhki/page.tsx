import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor, participantKey } from "@/lib/team/roles";
import { NOTE_AREAS, NOTE_STATUS_LABEL, areaLabel, listAllNotes, listNotesFor, type SystemNote } from "@/lib/team/system-notes";
import { fmtSofia } from "@/lib/team/time";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { NotesPanel } from "@/components/ekip/NotesPanel";

export const dynamic = "force-dynamic";

/**
 * „Бележки“ — какво в системата пречи или може да е по-лесно, по думите на
 * човека, който работи с нея. Той вижда своите бележки със статуса и отговора
 * на Ивайло; собственикът вижда отдолу накратко и всичко от екипа.
 */
export default async function BelezhkiPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "belezhki")) redirect(homeFor(actor.member));

  const isOwner = actor.kind === "owner";
  const key = participantKey(actor.member);
  const [nav, mine, all] = await Promise.all([
    ekipNav(actor),
    listNotesFor(key),
    isOwner ? listAllNotes() : Promise.resolve([] as SystemNote[]),
  ]);
  const team = all.filter((n) => n.author_key !== "owner");
  const fresh = team.filter((n) => n.status === "new").length;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={isOwner} nav={nav.items} section="belezhki" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <section className="rounded-2xl border border-[var(--color-accent-cyan)]/25 bg-[var(--color-accent-cyan)]/5 p-4">
          <h1 className="text-base font-bold">📝 Бележки за системата</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Нещо в системата ти пречи или може да е по-лесно? Напиши го тук — Ивайло чете всичко и подобряваме.
          </p>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            Например: „тук ми трябва бутон за…“, „тази стъпка е излишна“, „на телефона това не се вижда“. Кратко и конкретно е
            най-полезно.
          </p>
        </section>

        <NotesPanel notes={mine} areas={NOTE_AREAS} statusLabel={NOTE_STATUS_LABEL} page="/ekip/belezhki" />

        {isOwner && (
          <section className="space-y-2">
            <h2 className="flex items-baseline justify-between gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
              <span>
                От екипа · {team.length}
                {fresh > 0 && <span className="text-[var(--color-accent-cyan)]"> · {fresh} нови</span>}
              </span>
              <Link href="/admin/belezhki" className="normal-case tracking-normal text-[var(--color-accent-cyan)] underline-offset-2 hover:underline">
                преглед и отговор →
              </Link>
            </h2>
            {team.length === 0 ? (
              <p className="rounded-2xl border border-white/10 p-4 text-center text-sm text-[var(--color-text-secondary)]">
                Още никой от екипа не е писал.
              </p>
            ) : (
              <ul className="space-y-2">
                {team.slice(0, 30).map((n) => (
                  <li key={n.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                    <p className="flex flex-wrap gap-x-2 text-[11px] text-[var(--color-text-tertiary)]">
                      <span className="font-semibold text-[var(--color-text-secondary)]">{n.author_name}</span>
                      <span>{fmtSofia(n.created_at)}</span>
                      <span>{areaLabel(n.area)}</span>
                      <span className={n.status === "new" ? "text-[var(--color-accent-cyan)]" : n.status === "done" ? "text-emerald-300" : ""}>
                        {NOTE_STATUS_LABEL[n.status] ?? n.status}
                      </span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm">{n.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
