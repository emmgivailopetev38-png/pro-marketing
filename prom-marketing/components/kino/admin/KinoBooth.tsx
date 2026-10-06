"use client";
import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { setKinoLiveAction, type LiveResult } from "@/app/admin/(protected)/kino/actions";
import type { BoothData } from "@/lib/kino/live";

/**
 * Режисьорската кабина в /admin/kino: колко души са в залата сега, въпросите,
 * докато пристигат, и „Влизам на живо“ (линк към Zoom / Google Meet / YouTube
 * Live). Обновява се на 10 s. По подразбиране превключвателят е изключен.
 */

const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

const timeOf = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("bg-BG", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="min-w-[120px]">
      <div className="text-xs text-[var(--color-text-tertiary)]">{label}</div>
      <div className="font-display text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

export function KinoBooth({ initial }: { initial: BoothData }) {
  const [data, setData] = useState(initial);
  const [fresh, setFresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kino/booth", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as BoothData);
      setFresh(new Date().toISOString());
    } catch {
      /* пак след 10 s */
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [load]);

  const [state, action, pending] = useActionState<LiveResult | null, FormData>(async (prev, fd) => {
    const r = await setKinoLiveAction(prev, fd);
    await load();
    return r;
  }, null);

  const on = data.live.on;
  return (
    <section className="cc-panel p-5" style={{ borderColor: on ? "rgba(239, 68, 68, 0.65)" : undefined }} aria-labelledby="k-booth">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="k-booth" className="font-display text-base font-semibold">
            🎬 Режисьорска кабина {on && <span className="ml-2 text-sm text-red-300">● НА ЖИВО</span>}
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Обновява се на 10 s{fresh ? ` · последно ${timeOf(fresh)}` : ""}. „В залата сега“ = пулс в последните 45 секунди.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Stat label="В залата сега" value={data.inHall} color="#22d3ee" />
          <Stat label="Гледат филма" value={data.watching} color="#a78bfa" />
          <Stat label="Въпроси" value={data.questions.length} color="#f472b6" />
        </div>
      </div>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs text-[var(--color-text-tertiary)]">
          Линк за влизане на живо — Zoom, Google Meet или YouTube Live
          <input
            name="url"
            type="url"
            inputMode="url"
            defaultValue={data.live.url ?? ""}
            placeholder="https://zoom.us/j/…"
            className={inputCls}
            key={data.live.url ?? "empty"}
          />
        </label>
        <input type="hidden" name="on" value={on ? "0" : "1"} />
        <button
          type="submit"
          className={on ? "cc-btn" : "cc-btn cc-btn-primary"}
          disabled={pending || !data.ready}
          style={on ? undefined : { background: "#dc2626", borderColor: "#dc2626" }}
        >
          {pending ? "…" : on ? "■ Излизам — изключи бутона" : "● Влизам на живо"}
        </button>
        {state && (
          <span role="status" className="text-sm" style={{ color: state.ok ? "#86efac" : "#fca5a5" }}>
            {state.message}
          </span>
        )}
      </form>
      {on && (
        <p className="mt-2 text-sm text-red-200">
          Залата показва „НА ЖИВО — Ивайло влезе. Включи се“ от {timeOf(data.live.since)} · {data.live.label}
          {data.live.by ? ` · ${data.live.by}` : ""}.
        </p>
      )}
      {!data.ready && (
        <p className="mt-2 text-sm text-amber-300">
          Миграцията (kino_watch · kino_live) още не е приложена — кабината тръгва веднага след нея.
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Въпросите, докато пристигат</h3>
          {data.questions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още няма въпроси.</p>
          ) : (
            <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {data.questions.map((q) => (
                <li key={q.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    <Link href={`/admin/clients/${q.contactId}`} className="font-medium text-[var(--color-accent-cyan)] hover:underline">
                      {q.name}
                    </Link>
                    {q.minute != null ? ` · минута ${q.minute}` : ""} · {timeOf(q.at)}
                  </div>
                  <p className="mt-1 text-sm">{q.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold">Превключванията</h3>
          {data.log.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още не е включвано.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.log.map((l, i) => (
                <li key={`${l.at}-${i}`} className="text-[var(--color-text-secondary)]">
                  {timeOf(l.at)} · {l.on ? "● включи" : "■ изключи"}
                  {l.actor ? ` · ${l.actor}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
