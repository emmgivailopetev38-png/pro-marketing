"use client";
import { splitCountdown } from "@/lib/kino/time";
import { useKinoClock } from "./useKinoClock";

/**
 * Истинското обратно броене до премиерата — по часа на сървъра, не по
 * измислен таймер. Преди синхронизацията показва тирета (без разминаване
 * при хидратацията и без „скачане“ на числата).
 */
export function Countdown({
  targetMs,
  simMs,
  after,
}: {
  targetMs: number;
  simMs?: number | null;
  /** Какво да пише, когато времето изтече. */
  after?: React.ReactNode;
}) {
  const { now, synced } = useKinoClock({ initialMs: targetMs, simMs });
  const left = targetMs - now;
  if (synced && left <= 0 && after) return <>{after}</>;
  const p = splitCountdown(left);
  const cells: Array<[number, string]> = [
    [p.days, "дни"],
    [p.hours, "часа"],
    [p.minutes, "мин"],
    [p.seconds, "сек"],
  ];
  return (
    <div className="k-count" role="timer" aria-live="off" aria-label="Оставащо време до премиерата">
      {cells.map(([n, label]) => (
        <div className="k-count-cell" key={label}>
          <span className="k-count-num">{synced ? String(n).padStart(2, "0") : "––"}</span>
          <span className="k-count-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
