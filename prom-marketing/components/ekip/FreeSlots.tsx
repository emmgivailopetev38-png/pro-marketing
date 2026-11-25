"use client";
import { useEffect, useRef, useState } from "react";
import { freeSlotsAction } from "@/app/ekip/kalendar/actions";
import type { CloserSlots } from "@/lib/team/kalendar";
import { slotLabel } from "@/lib/team/grafik-rules";

// Едно четене за всички отворени карти на страницата (за минута).
let cache: { at: number; p: Promise<CloserSlots[]> } | null = null;
function load(): Promise<CloserSlots[]> {
  if (!cache || Date.now() - cache.at > 60_000) {
    cache = {
      at: Date.now(),
      p: freeSlotsAction()
        .then((r) => (r.ok ? r.closers : []))
        .catch(() => []),
    };
  }
  return cache.p;
}

/**
 * Свободните часове на клоузъра по графика му — под „Записах среща“ (25.11.2026).
 * Едно докосване попълва часа (и клоузъра, ако има избор), така сетърът не
 * записва среща, когато клоузърът не е на линия.
 */
export function FreeSlots() {
  const ref = useRef<HTMLDivElement>(null);
  const [all, setAll] = useState<CloserSlots[] | null>(null);
  const [pick, setPick] = useState("");
  const [chosen, setChosen] = useState("");

  useEffect(() => {
    let alive = true;
    void load().then((x) => {
      if (alive) setAll(x);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const sel = ref.current?.closest("form")?.querySelector<HTMLSelectElement>('select[name="closer_id"]');
    if (!sel) return;
    const on = () => setPick(sel.value);
    on();
    sel.addEventListener("change", on);
    return () => sel.removeEventListener("change", on);
  }, [all]);

  if (!all || all.length === 0) return <div ref={ref} />;
  const shown = pick ? all.filter((c) => c.id === pick) : all;

  function use(c: CloserSlots, local: string) {
    const form = ref.current?.closest("form");
    const input = form?.querySelector<HTMLInputElement>('input[name="meeting_at"]');
    if (input) input.value = local;
    const sel = form?.querySelector<HTMLSelectElement>('select[name="closer_id"]');
    if (sel && all && all.length > 1 && sel.value !== c.id) {
      sel.value = c.id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setChosen(`${c.id}|${local}`);
  }

  return (
    <div ref={ref} className="mt-1.5 space-y-1">
      {shown.map((c) => (
        <div key={c.id} className="text-[11px] leading-snug text-emerald-200/80">
          <span className="font-semibold">🕒 {all.length > 1 ? `${c.name} е свободен:` : "Свободни часове:"}</span>{" "}
          {!c.scheduled ? (
            <span className="text-emerald-200/60">няма график — всеки свободен час от 10:00</span>
          ) : c.slots.length === 0 ? (
            <span className="text-amber-200">няма свободен час тази седмица</span>
          ) : (
            <span className="mt-1 flex flex-wrap gap-1">
              {c.slots.slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => use(c, s)}
                  className={`rounded-md border px-1.5 py-0.5 tabular-nums ${chosen === `${c.id}|${s}` ? "border-emerald-300 bg-emerald-400/25 text-emerald-50" : "border-emerald-400/40 text-emerald-100"}`}
                >
                  {slotLabel(s)}
                </button>
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
