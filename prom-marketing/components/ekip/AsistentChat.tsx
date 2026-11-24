"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Send, Sparkles, Wrench } from "lucide-react";
import { korekciaAction } from "@/app/ekip/asistent/actions";
import type { EkipActionResult } from "@/lib/team/types";

interface Turn {
  role: "user" | "assistant";
  text: string;
}

const STORAGE = "ekip-asistent-v1";
const QUICK = [
  "Човекът казва „скъпо е“ — какво да му кажа?",
  "Колко е вноската за 3 900 € за 12 месеца през TBI?",
  "Как записвам среща и кой я води?",
  "Какви са моите числа днес?",
  "Напиши ми Viber съобщение за човек, който не вдига",
  "Каква е разликата между „Пари с AI“ и Команден център?",
];

/** Чатът с AI асистента + „🛠 Корекция / въпрос към Ивайло“. */
export function AsistentChat({ page }: { page?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE) ?? "[]") as Turn[];
      if (Array.isArray(saved)) setTurns(saved.slice(-20));
    } catch {
      /* празно */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE, JSON.stringify(turns.slice(-20)));
    } catch {
      /* без памет */
    }
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...turns, { role: "user" as const, text: q }];
    setTurns(next);
    setInput("");
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/ekip/asistent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ turns: next }) });
      const j = (await r.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (!r.ok || !j.answer) throw new Error(j.error || "Асистентът не отговори.");
      setTurns([...next, { role: "assistant", text: j.answer }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Грешка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.07] to-transparent">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {turns.length === 0 && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Sparkles className="h-4 w-4 text-violet-300" /> Питай каквото и да е — за разговора, офертите и цените, TBI, системата, твоите числа или конкретен лийд (по телефон или име).
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-white/15 px-3 py-1.5 text-left text-xs text-[var(--color-text-secondary)] hover:border-violet-300 hover:text-white">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  t.role === "user" ? "bg-[var(--color-accent-cyan)]/15 text-white" : "border border-white/10 bg-white/[0.04] text-[var(--color-text-primary)]"
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}
          {busy && <p className="text-xs text-[var(--color-text-tertiary)]">Асистентът мисли…</p>}
          {err && <p className="text-xs text-red-300">{err}</p>}
          <div ref={end} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="flex gap-2 border-t border-white/10 p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
            rows={2}
            placeholder="Напиши въпрос… (Enter — праща, Shift+Enter — нов ред)"
            className="flex-1 resize-none rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm"
          />
          <button disabled={busy || !input.trim()} className="self-end rounded-xl border border-violet-400/60 bg-violet-500/20 px-3 py-2 text-violet-100 disabled:opacity-40" aria-label="Изпрати">
            <Send className="h-4 w-4" />
          </button>
        </form>
        {turns.length > 0 && (
          <button type="button" onClick={() => setTurns([])} className="pb-3 text-[11px] text-[var(--color-text-tertiary)] underline">
            Нов разговор
          </button>
        )}
      </section>
      <Korekcia page={page} />
    </div>
  );
}

function Korekcia({ page }: { page?: string }) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(korekciaAction, null);
  return (
    <aside className="h-fit rounded-2xl border border-amber-400/25 bg-amber-400/[0.05] p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Wrench className="h-4 w-4 text-amber-300" /> Корекция / въпрос към Ивайло
      </h2>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Нещо не работи, не е ясно или трябва да се промени? Пиши тук — оправя се до няколко часа.</p>
      {state?.ok ? (
        <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{state.message}</p>
      ) : (
        <form action={action} className="mt-3 space-y-2">
          <input type="hidden" name="page" value={page ?? ""} />
          <select name="area" defaultValue="crm" className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm">
            <option value="crm">CRM-ът · екран или бутон</option>
            <option value="bug">Нещо е счупено</option>
            <option value="process">Процесът · как работим</option>
            <option value="idea">Идея</option>
            <option value="other">Друго</option>
          </select>
          <textarea name="text" rows={5} required placeholder="Какво не работи / какво не е ясно / какво да се промени…" className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm" />
          {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
          <SendBtn />
        </form>
      )}
    </aside>
  );
}

function SendBtn() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded-xl border border-amber-400/60 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50">
      {pending ? "Праща…" : "Прати на Ивайло"}
    </button>
  );
}
