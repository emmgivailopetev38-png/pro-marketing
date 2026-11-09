/** 2026-11-30 → 30.11.2026 */
export function bgDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return y && m && day ? `${day}.${m}.${y}` : d;
}

export function fitTone(fit: number | null): string {
  if (fit === null) return "text-[var(--color-text-tertiary)]";
  if (fit >= 75) return "text-emerald-300";
  if (fit >= 50) return "text-amber-200";
  return "text-[var(--color-text-secondary)]";
}

export const DEADLINE_TONE_CLASS = {
  none: "text-[var(--color-text-tertiary)]",
  past: "text-[var(--color-text-tertiary)] line-through",
  urgent: "text-rose-300 font-semibold",
  ok: "text-[var(--color-text-secondary)]",
} as const;
