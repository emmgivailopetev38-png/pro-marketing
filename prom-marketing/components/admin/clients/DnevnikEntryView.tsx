import { channelOf, moodOf, type DnevnikEntry } from "@/lib/contacts/dnevnik";

const ROWS: Array<{ key: keyof DnevnikEntry; icon: string; label: string }> = [
  { key: "talked", icon: "🗣", label: "Говорихме" },
  { key: "they_promised", icon: "🤝", label: "Той обеща" },
  { key: "we_promised", icon: "🫡", label: "Аз обещах" },
  { key: "happened", icon: "📌", label: "Какво стана" },
  { key: "next_step", icon: "➡️", label: "Следва" },
];

/** Един запис от дневника — в картона (пълен) или в списъка (само най-важното). */
export function DnevnikEntryView({ entry, compact }: { entry: DnevnikEntry; compact?: boolean }) {
  const mood = moodOf(entry.mood);
  const ch = channelOf(entry.channel);
  const rows = ROWS.filter((r) => typeof entry[r.key] === "string" && (entry[r.key] as string).trim());
  const shown = compact ? rows.slice(0, 3) : rows;
  return (
    <div className="text-sm">
      <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
        <span>
          {ch.emoji} {ch.label}
        </span>
        {mood && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${mood.color}22`, color: mood.color }}>
            {mood.emoji} {mood.label}
          </span>
        )}
      </p>
      {shown.length > 0 && (
        <dl className={`mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 ${compact ? "text-xs" : ""}`}>
          {shown.map((r) => (
            <div key={r.key} className="contents">
              <dt className="whitespace-nowrap text-[var(--color-text-tertiary)]">
                {r.icon} {r.label}
              </dt>
              <dd className={`text-[var(--color-text-secondary)] ${compact ? "line-clamp-2" : "whitespace-pre-wrap"}`}>
                {entry[r.key] as string}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
