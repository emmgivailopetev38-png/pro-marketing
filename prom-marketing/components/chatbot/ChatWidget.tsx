"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "pm_chat_session_v1";
const VISITOR_KEY = "pm_chat_visitor_v1";
const STATE_KEY = "pm_chat_open_v1";

function randomSessionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function loadVisitor(): { name?: string; email?: string; phone?: string } {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(VISITOR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomSessionId();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function loadOpenState(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STATE_KEY) === "open";
}

const GREETING: Message = {
  id: "system-greeting",
  role: "assistant",
  content:
    "Здравей! Аз съм AI асистентът на ProMarketing. Кажи ми накратко с какъв бизнес работиш — ще ти препоръчам конкретна автоматизация.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(loadOpenState);
  const [sessionId] = useState<string>(loadSessionId);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Запиши среща",
    "Какви услуги предлагате?",
    "Колко струва?",
  ]);
  const [visitor, setVisitor] = useState<{ name?: string; email?: string; phone?: string }>(loadVisitor);
  const [showContactForm, setShowContactForm] = useState(false);
  // When true, replaces the message thread with an inline Cal.com booking iframe.
  const [showBooking, setShowBooking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      window.localStorage.setItem(STATE_KEY, open ? "open" : "closed");
    }
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy || !sessionId) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((m) => [...m, userMsg]);
      setDraft("");
      setBusy(true);
      try {
        const res = await fetch("/api/chatbot/message", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            scope: "site_chatbot",
            message: trimmed,
            visitor,
            sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessages((m) => [
            ...m,
            {
              id: `e-${Date.now()}`,
              role: "assistant",
              content: "Опа — нещо не се получи. Опитай след малко или ми пиши на ivailopetev38@gmail.com",
            },
          ]);
          return;
        }
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: "assistant", content: data.reply },
        ]);
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);

        if (data.action === "open_booking") {
          // Inline embed instead of full-page nav — keeps the conversation context.
          setTimeout(() => setShowBooking(true), 600);
        } else if (data.action === "open_contact_form") {
          setShowContactForm(true);
        } else if (Array.isArray(data.collect) && data.collect.length > 0 && !visitor.email) {
          setShowContactForm(true);
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: "Грешка във връзката. Опитай отново след малко.",
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, sessionId, visitor]
  );

  const handleSuggest = (s: string) => sendMessage(s);

  const handleSaveVisitor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = {
      name: String(fd.get("name") ?? "").trim() || undefined,
      email: String(fd.get("email") ?? "").trim() || undefined,
      phone: String(fd.get("phone") ?? "").trim() || undefined,
    };
    setVisitor(next);
    window.localStorage.setItem(VISITOR_KEY, JSON.stringify(next));
    setShowContactForm(false);
    if (next.email) {
      setMessages((m) => [
        ...m,
        {
          id: `s-${Date.now()}`,
          role: "assistant",
          content: `Благодаря, ${next.name ?? "и"}! Записах те${
            next.email ? ` на ${next.email}` : ""
          }. Ще ти изпратя резюме на разговора и ще се свържем за безплатна 30-мин консултация.`,
        },
      ]);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        aria-label={open ? "Затвори чата" : "Отвори чата"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[88px] right-5 z-[60] md:bottom-5 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/40 bg-gradient-to-br from-cyan-500/95 to-violet-500/95 text-2xl shadow-[0_8px_30px_-8px_rgba(6,182,212,0.6)] transition hover:scale-105"
      >
        {open ? "×" : "💬"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-5 z-[60] flex h-[min(620px,80vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/95 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-4 py-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-base font-bold text-black">
                AI
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-deep)] bg-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  ProMarketing асистент
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                  {showBooking ? "избери удобен час" : "на линия · отговаря за секунди"}
                </p>
              </div>
              {showBooking && (
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-tertiary)] transition hover:bg-white/5 hover:text-[var(--color-text-primary)]"
                  aria-label="Назад към разговора"
                >
                  ← чат
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Затвори"
                className="rounded-full p-1.5 text-[var(--color-text-tertiary)] transition hover:bg-white/5 hover:text-[var(--color-text-primary)]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M4 12l8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Cal.com booking embed — replaces chat thread when active */}
            {showBooking ? (
              <div className="flex-1 overflow-hidden bg-black/40">
                <iframe
                  src={`https://cal.com/${process.env.NEXT_PUBLIC_CAL_USERNAME ?? "ivailo-petev-h8t28v"}/${process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation"}?embed=true&theme=dark&hideEventTypeDetails=false&layout=month_view`}
                  title="Запази час за консултация"
                  className="h-full w-full border-0"
                  loading="lazy"
                  allow="camera; microphone; fullscreen"
                />
              </div>
            ) : (
            <>
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-cyan-500 text-black"
                        : "rounded-bl-md bg-white/[0.06] text-[var(--color-text-primary)]"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact form modal */}
            <AnimatePresence>
              {showContactForm && (
                <motion.form
                  key="contact"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onSubmit={handleSaveVisitor}
                  className="space-y-2 border-t border-white/5 bg-black/40 p-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-accent-cyan)]">
                    Кратки данни — за да ти изпратя оферта
                  </p>
                  <input
                    name="name"
                    placeholder="Име"
                    defaultValue={visitor.name ?? ""}
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-500/60"
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Имейл *"
                    required
                    defaultValue={visitor.email ?? ""}
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-500/60"
                  />
                  <input
                    name="phone"
                    placeholder="Телефон (по желание)"
                    defaultValue={visitor.phone ?? ""}
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-500/60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400"
                    >
                      Запази
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="rounded-md border border-white/10 px-3 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]"
                    >
                      Не сега
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Suggestions */}
            {suggestions.length > 0 && !busy && (
              <div className="flex flex-wrap gap-1.5 border-t border-white/5 bg-black/30 px-3 py-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggest(s)}
                    className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(draft);
              }}
              className="flex items-center gap-2 border-t border-white/5 bg-black/40 p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Напиши съобщение..."
                className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-500/60"
                disabled={busy}
                maxLength={4000}
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-40"
              >
                →
              </button>
            </form>
            </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
