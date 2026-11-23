"use client";

import { useEffect, useState } from "react";

const KEY = "pd_danaci_cheklist_v1";

/** Стъпките с отметки — помни ги в браузъра (само за удобство; без него работи нормално). */
export function Cheklist({ stapki }: { stapki: readonly { t: string; d: string }[] }) {
  const [done, setDone] = useState<boolean[]>(() => stapki.map(() => false));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) setDone(stapki.map((_, i) => arr[i] === true));
    } catch {
      /* частен прозорец или блокирано хранилище — няма проблем */
    }
  }, [stapki]);

  function toggle(i: number) {
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* без запазване */
      }
      return next;
    });
  }

  const n = done.filter(Boolean).length;
  const pct = Math.round((n / stapki.length) * 100);

  return (
    <>
      <div className="pd-progress pd-noprint" aria-live="polite">
        <span>
          {n} от {stapki.length}
        </span>
        <div className="pd-progress-bar" aria-hidden>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span>{pct === 100 ? "Готово 🎉" : `${pct} %`}</span>
      </div>
      <ol className="pd-check">
        {stapki.map((s, i) => (
          <li key={s.t} className={done[i] ? "done" : undefined}>
            <label>
              <input type="checkbox" checked={done[i]} onChange={() => toggle(i)} />
              <span className="pd-box-tick" aria-hidden>
                ✓
              </span>
              <span>
                <b>
                  {i + 1}. {s.t}
                </b>
                <span className="d">{s.d}</span>
              </span>
            </label>
          </li>
        ))}
      </ol>
    </>
  );
}
