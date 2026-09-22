import type { Material } from "@/lib/team/materials";

export function MaterialsList({ title, items, muted = false }: { title: string; items: Material[]; muted?: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className={`text-sm font-semibold uppercase tracking-[0.15em] ${muted ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-accent-cyan)]"}`}>{title}</h2>
      {items.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Още няма материали за тази роля.</p>}
      {items.map((m) => (
        <article key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold">{m.title}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{m.about}</p>
          <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">≈ {m.minutes} мин четене</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={m.file} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--color-accent-cyan)]/50 px-3 py-2 text-xs font-semibold text-[var(--color-accent-cyan)]">
              📄 Отвори PDF
            </a>
            <a href={m.file.replace(/\.pdf$/, ".html")} target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              🖥 За екрана
            </a>
            <a href={m.file} download className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              ⬇️ Свали
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
