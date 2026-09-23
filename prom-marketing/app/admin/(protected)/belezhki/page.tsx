import { listActiveMembers } from "@/lib/team/repository";
import { NOTE_AREAS, listAllNotes } from "@/lib/team/system-notes";
import { SystemNotesManager } from "@/components/admin/SystemNotesManager";

export const dynamic = "force-dynamic";

/**
 * Бележките от екипа — на едно място за Ивайло. Нови / видени / направени /
 * отхвърлени, филтър по човек и област; статусът и отговорът стигат до човека
 * по имейл. Оттук Ивайло пише и своите.
 */
export default async function AdminBelezhkiPage() {
  const [notes, members] = await Promise.all([listAllNotes(), listActiveMembers()]);
  const ownerName = process.env.ADMIN_ACTOR || "Ивайло";

  // Хората за филтъра: Ивайло, активните — и всеки, който е писал, дори да е вече спрян.
  const known = new Map<string, string>([["owner", ownerName], ...members.map((m): [string, string] => [m.id, m.full_name])]);
  for (const n of notes) if (!known.has(n.author_key)) known.set(n.author_key, n.author_name);
  const authors = [...known].map(([key, name]) => ({ key, name }));

  const count = (status: string) => notes.filter((n) => n.status === status).length;

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Бележки от екипа</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Какво в системата и в процеса пречи или може да е по-лесно — по думите на хората, които работят с тях всеки ден.
            „Видяна“ казва на човека, че бележката е стигнала; „Направено“, „Отхвърлена“ и отговорът отиват при него по имейл.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="cc-chip">
              <b>{count("new")}</b> нови
            </span>
            <span className="cc-chip">
              <b>{count("seen")}</b> видени
            </span>
            <span className="cc-chip">
              <b>{count("done")}</b> направени
            </span>
            <span className="cc-chip">
              <b>{count("dismissed")}</b> отхвърлени
            </span>
          </div>
        </header>
        <SystemNotesManager notes={notes} areas={NOTE_AREAS} authors={authors} ownerName={ownerName} />
      </div>
    </div>
  );
}
