"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { zvaneneZapis, type ZvSaveResult } from "@/app/admin/(protected)/zvanene/actions";
import type { ZvKat, ZvOutcome, ZvRow } from "@/lib/zvanene/rules";

type Tab = ZvKat | "dnes";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "nov", label: "🆕 Нови" },
  { key: "topal", label: "🔥 Топли" },
  { key: "pisano", label: "✉️ Писано, без отговор" },
  { key: "star", label: "🗂 Стари" },
  { key: "dnes", label: "✓ Днес" },
];

const PRESETS: Array<{ key: string; label: string }> = [
  { key: "auto", label: "сама" },
  { key: "tomorrow", label: "утре" },
  { key: "3d", label: "3 дни" },
  { key: "1w", label: "седмица" },
  { key: "2w", label: "2 седм." },
  { key: "1m", label: "месец" },
  { key: "none", label: "без дата" },
];

const OUTCOMES: Array<{ key: ZvOutcome; label: string; cls: string }> = [
  { key: "govorihme", label: "✅ Говорихме", cls: "border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10" },
  { key: "interes", label: "🔥 Интерес", cls: "border-amber-500/50 text-amber-300 hover:bg-amber-500/10" },
  { key: "nevdigna", label: "📵 Не вдигна", cls: "border-sky-500/50 text-sky-300 hover:bg-sky-500/10" },
  { key: "ne_iska", label: "❌ Не иска", cls: "border-rose-500/50 text-rose-300 hover:bg-rose-500/10" },
  { key: "belezhka", label: "📝 Само бележка", cls: "border-white/15 text-[var(--color-text-secondary)] hover:bg-white/5" },
];

const PAGE = 40;
const AUTO_KEY = "zvanene-auto-zapis";

/* Web Speech API — в Chrome и Safari; типовете не са в lib.dom. */
type SpeechResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: SpeechResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechCtor = new () => SpeechRec;

function speechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("bg-BG", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit" });
}

export function ZvaneneList({ rows }: { rows: ZvRow[] }) {
  const [tab, setTab] = useState<Tab>("nov");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [preset, setPreset] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, ZvSaveResult>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [last, setLast] = useState<{ name: string; res: ZvSaveResult } | null>(null);

  const [autoRec, setAutoRec] = useState(true);
  const [recId, setRecId] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [recMsg, setRecMsg] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const recIdRef = useRef<string | null>(null);
  const restarts = useRef(0);
  const boxes = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    try {
      if (localStorage.getItem(AUTO_KEY) === "0") setAutoRec(false);
    } catch {}
  }, []);
  // Излизаш от страницата посред разговор — микрофонът се пуска.
  useEffect(
    () => () => {
      const r = recRef.current;
      recIdRef.current = null;
      try {
        r?.stop();
      } catch {}
    },
    []
  );

  function toggleAuto() {
    const v = !autoRec;
    setAutoRec(v);
    if (!v) stopRec();
    try {
      localStorage.setItem(AUTO_KEY, v ? "1" : "0");
    } catch {}
  }

  function stopRec() {
    const r = recRef.current;
    recIdRef.current = null;
    recRef.current = null;
    setRecId(null);
    setInterim("");
    if (r) {
      try {
        r.stop();
      } catch {}
    }
  }

  function startRec(id: string) {
    const SR = speechCtor();
    if (!SR) {
      setRecMsg("Този браузър не пише сам — задръж Fn за Wispr Flow.");
      return;
    }
    stopRec();
    const rec = new SR();
    rec.lang = "bg-BG";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let fin = "";
      let mid = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else mid += r[0].transcript;
      }
      if (fin.trim()) setNotes((n) => ({ ...n, [id]: `${(n[id] ?? "").trim()} ${fin.trim()}`.trim() }));
      setInterim(mid);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setRecMsg("Браузърът не даде микрофона — разреши го от катинарчето до адреса. Дотогава: Fn за Wispr Flow.");
        recIdRef.current = null;
        setRecId(null);
      }
    };
    // Chrome спира разпознаването след тишина — докато разговорът тече, го пускаме пак.
    rec.onend = () => {
      if (recIdRef.current !== id || restarts.current > 60) {
        if (recIdRef.current === id) stopRec();
        return;
      }
      restarts.current += 1;
      setTimeout(() => {
        if (recIdRef.current !== id) return;
        try {
          rec.start();
        } catch {
          stopRec();
        }
      }, 250);
    };
    recRef.current = rec;
    recIdRef.current = id;
    restarts.current = 0;
    setRecId(id);
    setRecMsg(null);
    try {
      rec.start();
    } catch {
      stopRec();
    }
  }

  function onCall(id: string) {
    if (autoRec) startRec(id);
    setTimeout(() => boxes.current[id]?.focus(), 150);
  }

  async function save(row: ZvRow, outcome: ZvOutcome) {
    if (recId === row.id) stopRec();
    setPending(row.id + outcome);
    let res: ZvSaveResult;
    try {
      res = await zvaneneZapis({
        contact_id: row.id,
        outcome,
        preset: preset[row.id] ?? "auto",
        note: notes[row.id] ?? "",
      });
    } catch {
      res = { ok: false, error: "Мрежата прекъсна — опитай пак" };
    }
    setPending(null);
    setSaved((s) => ({ ...s, [row.id]: res }));
    setLast({ name: row.name, res });
    if (res.ok) setNotes((n) => ({ ...n, [row.id]: "" }));
  }

  const savedOk = (id: string) => saved[id]?.ok === true;
  const isDnes = (r: ZvRow) => !!r.called_today || savedOk(r.id);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { nov: 0, topal: 0, pisano: 0, star: 0, dnes: 0 };
    for (const r of rows) {
      if (isDnes(r)) c.dnes += 1;
      else c[r.kat] += 1;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, saved]);

  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const list = rows.filter((r) => {
    if (needle) {
      const hay = `${r.name} ${r.company ?? ""}`.toLowerCase();
      const tel = (r.tel ?? "").replace(/\D/g, "");
      return hay.includes(needle) || (digits.length >= 4 && tel.includes(digits.replace(/^0/, "")));
    }
    // Записаното в тази сесия остава на мястото си, за да не скача списъкът под пръста.
    if (savedOk(r.id) && !r.called_today) return r.kat === tab || tab === "dnes";
    return tab === "dnes" ? isDnes(r) : !isDnes(r) && r.kat === tab;
  });

  return (
    <div className="space-y-4">
      <div className="cc-panel sticky top-0 z-20 space-y-3 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setShown(PAGE);
                setQ("");
              }}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                tab === t.key && !needle
                  ? "border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]"
                  : "border-white/10 text-[var(--color-text-secondary)] hover:border-white/30"
              }`}
            >
              {t.label} <span className="font-mono text-xs opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Търси име или номер…"
            className="min-w-[200px] flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
          />
          <button
            type="button"
            onClick={toggleAuto}
            className={`rounded-md border px-3 py-2 text-xs ${
              autoRec ? "border-emerald-500/50 text-emerald-300" : "border-white/10 text-[var(--color-text-tertiary)]"
            }`}
            title="Когато натиснеш номера, страницата започва сама да пише какво казваш (Chrome/Safari). Wispr Flow (Fn) работи и без това."
          >
            🎙 Пиши само при звънене: {autoRec ? "ВКЛ" : "ИЗКЛ"}
          </button>
        </div>
        {recMsg ? <p className="text-xs text-amber-300">{recMsg}</p> : null}
        {last ? (
          <p className={`text-sm ${last.res.ok ? "text-emerald-300" : "text-rose-300"}`}>
            {last.res.ok ? `✓ Записано на ${last.name}: ${last.res.title}` : `⚠️ ${last.name}: ${last.res.error}`}
          </p>
        ) : null}
      </div>

      {list.length === 0 ? (
        <p className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">Тук няма никой 🎉</p>
      ) : null}

      <div className="space-y-3">
        {list.slice(0, shown).map((r) => {
          const s = saved[r.id];
          const recording = recId === r.id;
          return (
            <div
              key={r.id}
              className={`cc-panel p-4 ${savedOk(r.id) ? "opacity-60" : ""} ${recording ? "ring-1 ring-rose-400/60" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{r.name}</span>
                    {r.company ? <span className="text-sm text-[var(--color-text-tertiary)]">{r.company}</span> : null}
                    {r.due === "today" ? (
                      <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-300">📅 за днес</span>
                    ) : null}
                    {r.due === "overdue" ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">⏰ просрочено</span>
                    ) : null}
                    {r.oferta ? (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">оферта</span>
                    ) : null}
                    {r.nevdigna > 0 ? (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                        не вдигна ×{r.nevdigna}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{r.zashto}</p>
                  {r.called_today ? (
                    <p className="mt-1 text-xs text-emerald-300">
                      ✓ днес {fmtTime(r.called_today.at)} · {r.called_today.title}
                    </p>
                  ) : null}
                  {r.posledno.map((p, i) => (
                    <p key={i} className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                      {p}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {r.tel ? (
                    <a
                      href={`tel:${r.tel}`}
                      onClick={() => onCall(r.id)}
                      className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 font-mono text-base font-semibold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      📞 {r.phone_pretty}
                    </a>
                  ) : null}
                  <Link
                    href={`/admin/clients/${r.id}`}
                    target="_blank"
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]"
                  >
                    картон ↗
                  </Link>
                </div>
              </div>

              <div className="mt-3">
                <div className="relative">
                  <textarea
                    ref={(el) => {
                      boxes.current[r.id] = el;
                    }}
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    rows={recording || (notes[r.id] ?? "").length > 80 ? 4 : 2}
                    placeholder="Какво стана? Задръж Fn (Wispr Flow) и кажи — или просто говори, ако 🎙 е включено."
                    className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
                  />
                  {recording ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-rose-300">● пиша какво казваш…</span>
                      {interim ? <span className="italic text-[var(--color-text-tertiary)]">{interim}</span> : null}
                      <button type="button" onClick={stopRec} className="ml-auto rounded border border-white/15 px-2 py-0.5">
                        ⏹ спри
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[11px] text-[var(--color-text-tertiary)]">Пак:</span>
                  {PRESETS.map((p) => {
                    const on = (preset[r.id] ?? "auto") === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPreset((m) => ({ ...m, [r.id]: p.key }))}
                        className={`rounded px-2 py-0.5 text-[11px] ${
                          on ? "bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]" : "text-[var(--color-text-tertiary)] hover:bg-white/5"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      disabled={pending !== null}
                      onClick={() => save(r, o.key)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${o.cls}`}
                    >
                      {pending === r.id + o.key ? "…" : o.label}
                    </button>
                  ))}
                </div>
                {s ? (
                  <p className={`mt-2 text-xs ${s.ok ? "text-emerald-300" : "text-rose-300"}`}>
                    {s.ok ? `✓ Записано: ${s.title}` : `⚠️ ${s.error}`}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {list.length > shown ? (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="w-full rounded-md border border-white/10 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-white/5"
        >
          Покажи още {Math.min(PAGE, list.length - shown)} (остават {list.length - shown})
        </button>
      ) : null}
    </div>
  );
}
