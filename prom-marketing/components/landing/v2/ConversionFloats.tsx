"use client";

/* ---------------------------------------------------------------------------
   ConversionFloats — плаващи конверсионни елементи за /v2
   ---------------------------------------------------------------------------
   (1) EXIT-INTENT модал: при бързо движение на мишката извън горния ръб
       (mouseleave + clientY<=0) показва ВЕДНЪЖ на сесия покана за телефон.
   (2) WhatsApp FAB: дискретен зелен бутон долу-вляво → wa.me/359877399963.

   Capture контрактът е същият като components/landing/v2/AiAudit.tsx и
   ProductShowcaseV2.tsx → POST /api/leads/submit с { phone, message } (само
   телефонът е задължителен). Стилът ползва v2 дизайн-системата (v2-design.css)
   и токените, които резолват вътре в .v2-scope.
--------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";
import { Phone, ArrowRight, Check, Loader2, X, MessageCircle } from "lucide-react";
import { track } from "@/lib/analytics/track";

const WHATSAPP_URL = "https://wa.me/359877399963";
const EXIT_FLAG = "pm_v2_exit_intent_shown"; // sessionStorage: показвай само веднъж/сесия

export function ConversionFloats() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Пазим елемента, който е бил на фокус преди модала — за да го върнем при затваряне.
  const lastFocus = useRef<HTMLElement | null>(null);

  /* --- EXIT-INTENT засичане ------------------------------------------- */
  useEffect(() => {
    // Не закачай нищо, ако вече е показано тази сесия.
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(EXIT_FLAG) === "1";
    } catch {
      /* sessionStorage недостъпен (private mode) — просто продължаваме */
    }
    if (alreadyShown) return;

    // Exit-intent е концепция за десктоп (курсор излиза от прозореца нагоре).
    // На тъч устройства няма mouseleave към ръба — пропускаме, без да дразним.
    const isCoarse =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    const trigger = () => {
      setOpen(true);
      track("exit_intent_open", {});
      try {
        sessionStorage.setItem(EXIT_FLAG, "1");
      } catch {
        /* ignore */
      }
      document.removeEventListener("mouseout", onMouseOut);
    };

    // mouseout с relatedTarget==null + clientY<=0 = курсорът напуска прозореца
    // нагоре (към адрес-лентата / табовете). По-надеждно от mouseleave за това.
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };

    // Малко закъснение — да не гръмне при случайно движение веднага при зареждане.
    const armId = window.setTimeout(() => {
      document.addEventListener("mouseout", onMouseOut);
    }, 4000);

    return () => {
      window.clearTimeout(armId);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  /* --- Достъпност на модала: фокус, Escape, заключен скрол --------------- */
  useEffect(() => {
    if (!open) return;

    lastFocus.current = (document.activeElement as HTMLElement) ?? null;
    // Фокус към полето за телефон (към close бутона, ако вече е „done“).
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
    track("exit_intent_close", {});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) return;
    setStatus("submitting");
    track("exit_intent_submit", {});
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: "Exit-intent лийд · напусна сайта → остави телефон (/v2)",
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("done");
        track("exit_intent_lead", {});
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* ============================ EXIT-INTENT МОДАЛ ====================== */}
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pm-exit-title"
          aria-describedby="pm-exit-desc"
        >
          {/* Backdrop — клик затваря */}
          <button
            type="button"
            aria-label="Затвори"
            onClick={close}
            className="absolute inset-0 cursor-default bg-[#04060d]/80 backdrop-blur-sm"
            style={{ animation: "v2cf-fade 0.25s var(--v2-ease) both" }}
          />

          {/* Карта */}
          <div
            className="v2-card v2-glow is-always relative w-full max-w-[440px]"
            style={{ animation: "v2cf-pop 0.4s var(--v2-ease) both" }}
          >
            {/* Затваряне */}
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
                <span
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "rgba(34,211,238,0.12)" }}
                >
                  <Check className="h-7 w-7" style={{ color: "var(--v2-cyan)" }} />
                </span>
                <h3
                  id="pm-exit-title"
                  className="text-xl font-bold text-[var(--v2-ink)]"
                  style={{ fontFamily: "var(--v2-font-display)" }}
                >
                  Прието — обаждаме се днес.
                </h3>
                <p id="pm-exit-desc" className="mt-2 text-sm text-[var(--v2-muted)]">
                  Благодарим! Звъним ти в рамките на работния ден, за да видим как AI
                  да свали рутината от твоя бизнес.
                </p>
              </div>
            ) : (
              <>
                <span className="v2-eyebrow">Преди да тръгнеш</span>
                <h3
                  id="pm-exit-title"
                  className="mt-3 text-[1.55rem] font-bold leading-[1.12] text-[var(--v2-ink)]"
                  style={{ fontFamily: "var(--v2-font-display)", letterSpacing: "-0.02em" }}
                >
                  Тръгваш? Остави телефон —{" "}
                  <span className="v2-grad">обаждаме се днес.</span>
                </h3>
                <p id="pm-exit-desc" className="mt-2.5 text-sm leading-relaxed text-[var(--v2-muted)]">
                  60 секунди разговор, безплатно и без ангажимент. Показваме ти точно
                  какво AI може да автоматизира при теб.
                </p>

                <form onSubmit={submit} className="mt-5">
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

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="v2-btn v2-btn-primary is-lg mt-3 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Изпращам…
                      </>
                    ) : (
                      <>
                        Обадете ми се
                        <ArrowRight className="v2-arrow h-4 w-4" />
                      </>
                    )}
                  </button>

                  {status === "error" && (
                    <p className="mt-2.5 text-[12px] text-[#fca5a5]">
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
                    className="mt-3 block w-full text-center text-[12px] text-[var(--v2-faint)] transition hover:text-[var(--v2-muted)]"
                  >
                    Не сега, благодаря
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================ WHATSAPP FAB ========================== */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_fab_click", {})}
        aria-label="Пиши ни в WhatsApp"
        className="group fixed bottom-5 left-5 z-[110] inline-flex items-center gap-0 overflow-hidden rounded-[var(--v2-r-pill)] py-3.5 pl-3.5 pr-3.5 text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)] transition-all duration-300 hover:pr-5 hover:shadow-[0_12px_38px_-6px_rgba(37,211,102,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--v2-void)]"
        style={{ background: "linear-gradient(150deg, #25d366, #1ebe5a)" }}
      >
        <MessageCircle className="h-[22px] w-[22px] shrink-0" />
        {/* Етикетът се разгъва на hover — дискретно по подразбиране */}
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[160px] group-hover:opacity-100">
          Пиши ни в WhatsApp
        </span>
      </a>

      {/* Локални keyframes за модала (scoped имена, без колизия с v2-design.css) */}
      <style>{`
        @keyframes v2cf-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes v2cf-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to { opacity: 1; transform: none }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="v2cf-fade"], [style*="v2cf-pop"] { animation: none !important }
        }
      `}</style>
    </>
  );
}
