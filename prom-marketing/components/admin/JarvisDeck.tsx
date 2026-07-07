"use client";
/* =====================================================================
   JarvisDeck — /admin/jarvis: командният JARVIS център на CRM-а.
   Живо ядро + гласов стил брифинг върху реални CRM данни (подадени от
   сървърния компонент), команден вход през /api/admin/copilot (същия
   контракт като CopilotWidget) и бързи действия. Стилът е командният
   HUD език на admin.css (cc-panel, cc-kpi, hud...).
   ===================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Users,
  Target,
  Calendar,
  Receipt,
  FileSignature,
  Wallet,
  Inbox,
  SearchCheck,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { formatMoney } from "@/lib/crm/labels";

export type JarvisBriefing = {
  generatedAt: string;
  activeClients: number;
  newLeads7d: number;
  overdueFollowups: number;
  overdueNames: string[];
  bookingsToday: number;
  nextBooking: { name: string; at: string } | null;
  pipelineValue: number;
  openOffers: number;
  openOffersSum: number;
  unpaidInvoices: number;
  unpaidSum: number;
  receivedYtd: number;
  metaUnprocessed: number;
  manualReview: number;
};

type Msg = { id: string; role: "user" | "assistant"; content: string };

const COMMANDS = [
  "Какво да правя първо днес?",
  "Кои клиенти не съм пипал от 7 дни?",
  "Покажи ми приходите за месеца",
  "Подготви ми следващата среща",
];

function hourGreeting(h: number): string {
  if (h < 5) return "Късна смяна, шефе.";
  if (h < 12) return "Добро утро, шефе.";
  if (h < 18) return "Добър ден, шефе.";
  return "Добър вечер, шефе.";
}

function buildBriefingLines(b: JarvisBriefing, hour: number): string[] {
  const lines: string[] = [hourGreeting(hour) + " Ето състоянието на системата."];
  if (b.bookingsToday > 0 && b.nextBooking) {
    const t = new Date(b.nextBooking.at).toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    lines.push(
      `Днес имаш ${b.bookingsToday} ${b.bookingsToday === 1 ? "среща" : "срещи"} — първата е с ${b.nextBooking.name} в ${t}.`
    );
  } else {
    lines.push("Днес няма насрочени срещи — ден за офанзива по фунията.");
  }
  if (b.overdueFollowups > 0) {
    const names = b.overdueNames.filter(Boolean).slice(0, 2).join(", ");
    lines.push(
      `${b.overdueFollowups} follow-up${b.overdueFollowups === 1 ? "а чака" : "а чакат"} отговор${names ? ` — започни със: ${names}` : ""}.`
    );
  } else {
    lines.push("Нула просрочени follow-up-а. Чисто.");
  }
  if (b.openOffers > 0) {
    lines.push(`${b.openOffers} отворени оферти за ${formatMoney(b.openOffersSum, "EUR")} чакат решение.`);
  }
  if (b.unpaidInvoices > 0) {
    lines.push(`Неплатени фактури: ${b.unpaidInvoices} на стойност ${formatMoney(b.unpaidSum, "EUR")}. Следя ги.`);
  }
  if (b.metaUnprocessed > 0) {
    lines.push(`${b.metaUnprocessed} необработени Meta лида в опашката.`);
  }
  lines.push(`Пайплайн: ${formatMoney(b.pipelineValue, "EUR")} · получени тази година: ${formatMoney(b.receivedYtd, "EUR")}.`);
  return lines;
}

function QuickAction({ href, icon: Icon, label, value, tone }: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "alert" | "ok";
}) {
  return (
    <Link
      href={href}
      className="cc-panel group flex items-center gap-3 !p-4 transition-transform hover:-translate-y-0.5"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor:
            tone === "alert" ? "rgba(248,113,113,0.4)" : "rgba(6,182,212,0.35)",
          background:
            tone === "alert" ? "rgba(248,113,113,0.08)" : "rgba(6,182,212,0.08)",
        }}
      >
        <Icon
          className="h-4.5 w-4.5"
          style={{ color: tone === "alert" ? "#f87171" : "#06b6d4", width: 18, height: 18 }}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="hud block">{label}</span>
        <span
          className="block truncate font-mono text-sm font-semibold"
          style={{ color: tone === "alert" ? "#fca5a5" : "var(--color-text-primary, #f5f7ff)" }}
        >
          {value}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#4a5070] transition-transform group-hover:translate-x-0.5 group-hover:text-[#06b6d4]" />
    </Link>
  );
}

export function JarvisDeck({ briefing }: { briefing: JarvisBriefing }) {
  const [clock, setClock] = useState<string>("");
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [spoken, setSpoken] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(
    () => buildBriefingLines(briefing, new Date(briefing.generatedAt).getHours()),
    [briefing]
  );

  // live clock (client-only, avoids hydration mismatch by starting empty)
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // typewriter briefing
  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const full = lines[lineIdx];
    if (reduced) {
      setSpoken(lines);
      setLineIdx(lines.length);
      return;
    }
    if (typed.length < full.length) {
      const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 16);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setSpoken((s) => [...s, full]);
      setTyped("");
      setLineIdx((i) => i + 1);
    }, 520);
    return () => clearTimeout(t);
  }, [typed, lineIdx, lines]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: t }]);
      setDraft("");
      setBusy(true);
      try {
        const res = await fetch("/api/admin/copilot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: t,
            context: { page: "/admin/jarvis" },
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: res.ok ? String(data.reply ?? "—") : (data.error ?? "Грешка. Опитай отново."),
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { id: `e-${Date.now()}`, role: "assistant", content: "Грешка във връзката." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages]
  );

  const alertsCount =
    briefing.overdueFollowups + briefing.metaUnprocessed + briefing.manualReview;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8">
      {/* ===== Header ===== */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="hud">// JARVIS · КОМАНДЕН ЦЕНТЪР</p>
          <h1 className="cc-title mt-1 text-3xl font-bold md:text-4xl">JARVIS</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="cc-livedot" aria-hidden />
          <span className="hud">онлайн</span>
          <span className="font-mono text-lg tabular-nums text-[#06b6d4]" aria-label="часовник">
            {clock}
          </span>
        </div>
      </div>

      {/* ===== Core + briefing ===== */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Core */}
        <div className="cc-panel cc-panel-accent flex flex-col items-center justify-center gap-4 !p-6">
          <div className="jdx-core" aria-hidden>
            <span className="jdx-ring jdx-r1" />
            <span className="jdx-ring jdx-r2" />
            <span className="jdx-ring jdx-r3" />
            <Bot className="jdx-bot" />
          </div>
          <p className="hud text-center">
            AI ядро · {alertsCount > 0 ? `${alertsCount} сигнала` : "няма сигнали"}
          </p>
          <div className="grid w-full grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-[rgba(6,182,212,0.2)] p-2">
              <p className="hud">Пайплайн</p>
              <p className="font-mono text-sm font-bold text-[#f5f7ff]">
                {formatMoney(briefing.pipelineValue, "EUR")}
              </p>
            </div>
            <div className="rounded-lg border border-[rgba(6,182,212,0.2)] p-2">
              <p className="hud">Получено YTD</p>
              <p className="font-mono text-sm font-bold text-[#34d399]">
                {formatMoney(briefing.receivedYtd, "EUR")}
              </p>
            </div>
          </div>
        </div>

        {/* Briefing */}
        <div className="cc-panel !p-6">
          <p className="hud mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#06b6d4]" />
            Дневен брифинг · на живо от CRM данните
          </p>
          <div className="space-y-2.5 font-mono text-[13.5px] leading-relaxed text-[#c7d0e8]">
            {spoken.map((l, i) => (
              <p key={i}>
                <span className="mr-2 text-[#06b6d4]">▸</span>
                {l}
              </p>
            ))}
            {lineIdx < lines.length && (
              <p aria-live="polite">
                <span className="mr-2 text-[#06b6d4]">▸</span>
                {typed}
                <span className="jdx-caret" aria-hidden>▊</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== Quick actions ===== */}
      <p className="hud mb-2">// Бързи действия</p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/admin/follow-up"
          icon={Target}
          label="Просрочени follow-up"
          value={String(briefing.overdueFollowups)}
          tone={briefing.overdueFollowups > 0 ? "alert" : "ok"}
        />
        <QuickAction
          href="/admin/bookings"
          icon={Calendar}
          label="Срещи днес"
          value={String(briefing.bookingsToday)}
        />
        <QuickAction
          href="/admin/offers"
          icon={FileSignature}
          label="Отворени оферти"
          value={`${briefing.openOffers} · ${formatMoney(briefing.openOffersSum, "EUR")}`}
        />
        <QuickAction
          href="/admin/invoices"
          icon={Receipt}
          label="Неплатени фактури"
          value={`${briefing.unpaidInvoices} · ${formatMoney(briefing.unpaidSum, "EUR")}`}
          tone={briefing.unpaidInvoices > 0 ? "alert" : "ok"}
        />
        <QuickAction
          href="/admin/clients"
          icon={Users}
          label="Активни клиенти"
          value={`${briefing.activeClients} · +${briefing.newLeads7d} за 7д`}
        />
        <QuickAction
          href="/admin/leads"
          icon={Inbox}
          label="Meta лидове (нови)"
          value={String(briefing.metaUnprocessed)}
          tone={briefing.metaUnprocessed > 0 ? "alert" : "ok"}
        />
        <QuickAction
          href="/admin/manual-review"
          icon={SearchCheck}
          label="Ръчна проверка"
          value={String(briefing.manualReview)}
          tone={briefing.manualReview > 0 ? "alert" : "ok"}
        />
        <QuickAction
          href="/admin/accounting"
          icon={Wallet}
          label="Получено тази година"
          value={formatMoney(briefing.receivedYtd, "EUR")}
        />
      </div>

      {/* ===== Command console ===== */}
      <div className="cc-panel !p-0">
        <div className="flex items-center justify-between border-b border-[rgba(6,182,212,0.18)] px-5 py-3">
          <p className="hud flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-[#06b6d4]" />
            Команден вход · JARVIS изпълнява
          </p>
          <span className="hud text-[#34d399]">Hermes свързан</span>
        </div>

        <div ref={logRef} className="max-h-72 min-h-[96px] space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <p className="font-mono text-[13px] text-[#5a6889]">
              Дай команда — „напиши имейл", „кои клиенти забравих", „смени етап"…
              или избери отдолу.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-cyan-500/90 text-black"
                    : "border border-[rgba(6,182,212,0.2)] bg-white/[0.04] text-[#e8edfb]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-1.5 px-1" aria-label="JARVIS мисли">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-4 py-2.5">
          {COMMANDS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={busy}
              onClick={() => send(c)}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
          className="flex items-center gap-2 border-t border-white/5 p-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Команда към JARVIS…"
            disabled={busy}
            maxLength={2000}
            className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-[#f5f7ff] outline-none focus:border-cyan-500/60"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label="Изпрати команда"
            className="rounded-md bg-cyan-500 px-3 py-2 text-black transition hover:bg-cyan-400 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <style>{`
        .jdx-core { position: relative; width: 150px; height: 150px; display: grid; place-items: center; }
        .jdx-bot { width: 40px; height: 40px; color: #06b6d4; filter: drop-shadow(0 0 14px rgba(6,182,212,0.7)); }
        .jdx-ring { position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(6,182,212,0.35); }
        .jdx-r1 { animation: jdx-spin 9s linear infinite; border-top-color: #06b6d4; }
        .jdx-r2 { inset: 14px; animation: jdx-spin 6s linear infinite reverse; border-right-color: #7c3aed; border-color: rgba(124,58,237,0.3); }
        .jdx-r3 { inset: 28px; animation: jdx-spin 12s linear infinite; border-bottom-color: #ec4899; border-color: rgba(236,72,153,0.22); }
        @keyframes jdx-spin { to { transform: rotate(360deg); } }
        .jdx-caret { animation: jdx-blink 0.9s steps(1) infinite; color: #06b6d4; }
        @keyframes jdx-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .jdx-r1, .jdx-r2, .jdx-r3, .jdx-caret { animation: none; }
        }
      `}</style>
    </div>
  );
}
