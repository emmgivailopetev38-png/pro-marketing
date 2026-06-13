"use client";

/* ---------------------------------------------------------------------------
   WelcomeLeadPopup — приветствен попъп при ВЛИЗАНЕ (за разлика от exit-intent).
   ---------------------------------------------------------------------------
   • Показва се ВЕДНЪЖ на сесия: ~7 сек след зареждане ИЛИ при пръв скрол
     надолу (което се случи първо). Работи и на телефон (exit-intent е само
     десктоп — този го допълва).
   • Форма за запитване: име (по желание) + телефон (задължителен) + кратко
     съобщение „с какво да помогнем" (по желание). Контракт: POST
     /api/leads/submit { full_name?, phone, message? } — както AiAudit/floats.
   • КООРДИНАЦИЯ: вдига exit-intent флага щом се покаже → потребителят никога
     не вижда два телефонни попъпа в една сесия.
   • Стил: v2 дизайн-система (резолва вътре в .v2-scope).
--------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";
import { Phone, User, ArrowRight, Check, Loader2, X, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics/track";

const SHOWN_FLAG = "pm_v2_welcome_shown"; // този попъп — веднъж/сесия
const EXIT_FLAG = "pm_v2_exit_intent_shown"; // споделен — за да не гръмнат и двата
const DELAY_MS = 7000;
const SCROLL_TRIGGER_PX = 600;

export function WelcomeLeadPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  /* --- Засичане на влизане (таймер ИЛИ скрол) ------------------------- */
  useEffect(() => {
    let already = false;
    try {
      already = sessionStorage.getItem(SHOWN_FLAG) === "1" || sessionStorage.getItem(EXIT_FLAG) === "1";
    } catch {
      /* private mode — продължаваме */
    }
    if (already) return;

    let fired = false;
    const trigger = () => {
      if (fired) return;
      fired = true;
      setOpen(true);
      track("welcome_popup_open", {});
      try {
        sessionStorage.setItem(SHOWN_FLAG, "1");
        sessionStorage.setItem(EXIT_FLAG, "1"); // спира exit-intent за тази сесия
      } catch {
        /* ignore */
      }
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };

    const onScroll = () => {
      if (window.scrollY > SCROLL_TRIGGER_PX) trigger();
    };

    const timer = window.setTimeout(trigger, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* --- A11y: фокус, Escape, заключен скрол ---------------------------- */
  useEffect(() => {
    if (!open) return;
    lastFocus.current = (document.activeElement as HTMLElement) ?? null;
    const focusTarget = status === "done" ? closeRef.current : inputRef.current;
    const fid = window.setTimeout(() => focusTarget?.focus(), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(fid);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status]);

  const close = () => {
    setOpen(false);
    track("welcome_popup_close", {});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) return;
    setStatus("submitting");
    track("welcome_popup_submit", {});
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name || undefined,
          phone,
          message: message
            ? `Запитване от сайта (welcome popup): ${message}`
            : "Welcome popup лийд · остави телефон при влизане",
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("done");
        track("welcome_popup_lead", {});
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pm-welcome-title"
      aria-describedby="pm-welcome-desc"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Затвори"
        onClick={close}
        className="absolute inset-0 cursor-default bg-[#04060d]/80 backdrop-blur-sm"
        style={{ animation: "v2wp-fade 0.25s var(--v2-ease) both" }}
      />

      {/* Карта */}
      <div
        className="v2-card v2-glow is-always relative w-full max-w-[460px]"
        style={{ animation: "v2wp-pop 0.42s var(--v2-ease) both" }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Затвори"
          className="absolute right-3.5 top-3.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--v2-line)] bg-[var(--v2-void)]/50 text-[var(--v2-muted)] transition hover:border-[var(--v2-line-bright)] hover:text-[var(--v2-ink)]"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "done" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(34,211,238,0.12)" }}>
              <Check className="h-7 w-7" style={{ color: "var(--v2-cyan)" }} />
            </span>
            <h3 id="pm-welcome-title" className="text-xl font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
              Прието — обаждаме се днес.
            </h3>
            <p id="pm-welcome-desc" className="mt-2 text-sm text-[var(--v2-muted)]">
              Благодарим! Звъним ти в рамките на работния ден и показваме как AI да поеме рутината.
            </p>
          </div>
        ) : (
          <>
            <span className="v2-eyebrow inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--v2-cyan)" }} /> Здравей 👋
            </span>
            <h3
              id="pm-welcome-title"
              className="mt-3 text-[1.5rem] font-bold leading-[1.12] text-[var(--v2-ink)]"
              style={{ fontFamily: "var(--v2-font-display)", letterSpacing: "-0.02em" }}
            >
              Остави телефон — <span className="v2-grad">обаждаме се днес.</span>
            </h3>
            <p id="pm-welcome-desc" className="mt-2.5 text-sm leading-relaxed text-[var(--v2-muted)]">
              Кажи накратко с какво да помогнем (по желание) и ти звъним безплатно, без ангажимент.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2 rounded-[var(--v2-r-pill)] border border-[var(--v2-line)] bg-[var(--v2-void)]/60 px-4 transition focus-within:border-[var(--v2-line-bright)]">
                <User className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Име (по желание)"
                  aria-label="Име"
                  className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
                />
              </div>

              <div className="flex items-center gap-2 rounded-[var(--v2-r-pill)] border border-[var(--v2-line)] bg-[var(--v2-void)]/60 px-4 transition focus-within:border-[var(--v2-line-bright)]">
                <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} />
                <input
                  ref={inputRef}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="Телефон за обаждане"
                  aria-label="Телефон за обаждане"
                  className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
                />
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="С какво да помогнем? (по желание)"
                aria-label="Запитване"
                className="w-full rounded-[16px] border border-[var(--v2-line)] bg-[var(--v2-void)]/60 px-4 py-3 text-sm text-[var(--v2-ink)] outline-none transition focus:border-[var(--v2-line-bright)] placeholder:text-[var(--v2-faint)]"
              />

              <button
                type="submit"
                disabled={status === "submitting"}
                className="v2-btn v2-btn-primary is-lg w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Изпращам…
                  </>
                ) : (
                  <>
                    Обадете ми се
                    <ArrowRight className="v2-arrow h-4 w-4" />
                  </>
                )}
              </button>

              {status === "error" && (
                <p className="text-[12px] text-[#fca5a5]">
                  Грешка — опитай пак или звънни на{" "}
                  <a href="tel:+359877399963" className="underline">
                    +359 877 399 963
                  </a>
                  .
                </p>
              )}

              <button
                type="button"
                onClick={close}
                className="block w-full text-center text-[12px] text-[var(--v2-faint)] transition hover:text-[var(--v2-muted)]"
              >
                Не сега, благодаря
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes v2wp-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes v2wp-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to { opacity: 1; transform: none }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="v2wp-fade"], [style*="v2wp-pop"] { animation: none !important }
        }
      `}</style>
    </div>
  );
}
