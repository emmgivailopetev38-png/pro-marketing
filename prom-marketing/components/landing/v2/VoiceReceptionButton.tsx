"use client";

/* ---------------------------------------------------------------------------
   VoiceReceptionButton — „Говори с агента и си запиши час“.
   ---------------------------------------------------------------------------
   Бутонът, който показва услугата, вместо да я описва: човекът натиска,
   говори на български и излиза с час в календара на Ивайло.

   Редът е форма → разговор, а не обратното, и това е нарочно на две места:

   1. Лийдът се хваща ПРЕДИ линията да е отворена. Половината хора затварят
      след трийсет секунди; ако формата беше накрая, от тях не остава нищо.
   2. Агентът получава имейла НАПИСАН. Продиктуваният на глас имейл е най-
      честата счупена среща — потвърждението заминава на несъществуващ адрес
      и никой не разбира, докато човекът не се появи (или не се появи).

   Микрофонът се пуска с втори натиск, вътре в самия говорител. Не е пропуск:
   браузърът дава достъп до микрофона само след жест на потребителя, а
   „Разреши микрофона?" веднага след изпращане на форма изглежда като капан.
--------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, Phone, User, Mail, Building2, Loader2, X, ArrowRight, CalendarCheck } from "lucide-react";
import { track } from "@/lib/analytics/track";

const WIDGET_SRC = "https://unpkg.com/@elevenlabs/convai-widget-embed";

type Vars = Record<string, string>;
type Step = "form" | "connecting" | "live";

export function VoiceReceptionButton({ variant = "hero" }: { variant?: "hero" | "inline" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");

  const holder = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  /**
   * ⚠️ Прозорецът излиза през портал към <body> и това НЕ е стилистичен избор.
   *
   * Бутонът живее вътре в `MagneticButton`, който го мести с CSS `transform`.
   * А трансформиран родител става новата отправна рамка за `position: fixed`
   * на всяко дете — прозорецът се лепваше за бутона и излизаше като тясна
   * ивица насред героя, вместо да покрие екрана.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /**
   * `?glas=1` идва от подписа на автоматичните писма: човекът натиска линка
   * и разговорът се отваря направо, без да търси бутона на страницата.
   * Чете се от `window`, а не от `useSearchParams` — така героят не иска Suspense.
   */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("glas") !== "1") return;
    // След първото рендиране, не в тялото на ефекта — така героят се показва,
    // а прозорецът излиза върху него, вместо да се бие с хидратацията.
    const id = window.setTimeout(() => {
      setOpen(true);
      track("voice_reception_open", { location: variant, via: "email_link" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [variant]);

  /* --- Отваряне и затваряне -------------------------------------------- */
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    firstField.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      // Escape затваря само формата. Насред разговор би прекъснал линията
      // с погрешен натиск — там се излиза само с бутона.
      if (e.key === "Escape" && step === "form") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  function close() {
    setOpen(false);
    setStep("form");
    setError(null);
    // Говорителят се маха от дървото — иначе микрофонът остава отворен.
    if (holder.current) holder.current.innerHTML = "";
    lastFocus.current?.focus?.();
  }

  /* --- Говорителят се зарежда веднъж за целия живот на страницата ------- */
  function ensureWidgetScript() {
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.type = "text/javascript";
    document.body.appendChild(s);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "connecting") return;
    setError(null);
    setStep("connecting");
    track("voice_reception_submit", { location: variant });

    try {
      const res = await fetch("/api/voice/public/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, business: business || undefined }),
      });
      const data = (await res.json()) as {
        agent_id?: string;
        variables?: Vars;
        error?: string;
        spoken?: string;
        detail?: string;
      };

      if (!res.ok || !data.agent_id) {
        setStep("form");
        setError(
          data.spoken ??
            (data.error === "invalid"
              ? "Провери имейла и телефона — нещо не се получи."
              : "Точно сега линията не се отваря. Пробвай пак след минута.")
        );
        return;
      }

      ensureWidgetScript();
      if (holder.current) {
        holder.current.innerHTML = "";
        const el = document.createElement("elevenlabs-convai");
        // Идентификаторът, не подписан адрес: агентът е публичен и се пази с
        // allowlist за този домейн. Виж коментара в /api/voice/public/session.
        el.setAttribute("agent-id", data.agent_id);
        // Агентът знае кой е насреща — затова не пита за имейл на глас.
        if (data.variables) el.setAttribute("dynamic-variables", JSON.stringify(data.variables));
        el.setAttribute("variant", "expanded");
        holder.current.appendChild(el);
      }
      setStep("live");
      track("voice_reception_live", { location: variant });
    } catch {
      setStep("form");
      setError("Няма връзка със сървъра. Пробвай пак.");
    }
  }

  const valid = name.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && phone.trim().length >= 6;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track("cta_clicked", { location: `${variant}_v2`, target: "voice_reception" });
        }}
        className={
          variant === "hero"
            ? "group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-[var(--color-accent-cyan)]/60 bg-[rgba(34,211,238,0.05)] px-7 py-4 text-base font-semibold text-[var(--color-accent-cyan)] backdrop-blur-sm transition hover:border-[var(--color-accent-cyan)] hover:shadow-[0_0_50px_rgba(34,211,238,0.35)]"
            : "inline-flex items-center gap-2.5 rounded-full border border-[var(--v2-line-bright)] bg-[var(--v2-void)]/60 px-5 py-3 text-sm font-semibold text-[var(--v2-ink)] transition hover:border-[var(--v2-cyan)]"
        }
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-cyan)] text-[var(--color-bg-void)] shadow-[0_0_18px_rgba(34,211,238,0.8)]">
          <Mic className="h-4 w-4" />
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-[var(--color-accent-cyan)] opacity-40"
            style={{ animationDuration: "2.2s" }}
          />
        </span>
        <span className="relative text-left leading-tight">
          Говори с агента
          <span className="block text-[11px] font-normal opacity-75">и си запиши час — сега</span>
        </span>
      </button>

      {open && mounted && createPortal(
        <div
          data-v2
          className="v2-scope fixed inset-0 z-[130] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pm-voice-title"
        >
          <button
            type="button"
            aria-label="Затвори"
            onClick={close}
            className="absolute inset-0 cursor-default bg-[#04060d]/85 backdrop-blur-sm"
          />

          <div className="v2-card v2-glow is-always relative w-full max-w-[480px]">
            <button
              type="button"
              onClick={close}
              aria-label="Затвори"
              className="absolute right-3.5 top-3.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--v2-line)] bg-[var(--v2-void)]/50 text-[var(--v2-muted)] transition hover:border-[var(--v2-line-bright)] hover:text-[var(--v2-ink)]"
            >
              <X className="h-4 w-4" />
            </button>

            {step === "live" ? (
              <div className="p-1">
                <span className="v2-eyebrow inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--v2-cyan)]" /> На линия
                </span>
                <h3
                  id="pm-voice-title"
                  className="mt-3 text-[1.35rem] font-bold leading-[1.15] text-[var(--v2-ink)]"
                  style={{ fontFamily: "var(--v2-font-display)" }}
                >
                  Натисни микрофона и <span className="v2-grad">говори</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--v2-muted)]">
                  Коста знае кой си — не му диктувай имейл. Кажи му с какво се занимаваш и
                  го помоли да ти запише час. Прекъсни го насред изречение: спира и слуша.
                </p>

                <div ref={holder} className="mt-4" />

                <div className="mt-4 rounded-[14px] border border-[var(--v2-line)] bg-[var(--v2-void)]/50 p-3.5">
                  <strong className="block text-xs uppercase tracking-wider text-[var(--v2-cyan)]">
                    Пробвай с
                  </strong>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--v2-muted)]">
                    <li>„Имам сервиз и изпускам обаждания — какво може да се направи?“</li>
                    <li>„Кога е свободен Ивайло тази седмица?“</li>
                    <li>„Запиши ме за четвъртък сутринта.“</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--v2-r-pill)] border border-[var(--v2-line)] py-3 text-sm font-semibold text-[var(--v2-muted)] transition hover:border-[var(--v2-line-bright)] hover:text-[var(--v2-ink)]"
                >
                  Затвори разговора
                </button>
              </div>
            ) : (
              <div className="p-1">
                <span className="v2-eyebrow inline-flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" style={{ color: "var(--v2-cyan)" }} /> Живо демо
                </span>
                <h3
                  id="pm-voice-title"
                  className="mt-3 text-[1.5rem] font-bold leading-[1.12] text-[var(--v2-ink)]"
                  style={{ fontFamily: "var(--v2-font-display)" }}
                >
                  Говори с агента — той ти <span className="v2-grad">запазва часа</span>
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--v2-muted)]">
                  Същият агент, който може да вдига твоя телефон. Пита те няколко неща и
                  сам ти записва час при Ивайло — в истинския календар.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-2.5">
                  <Field icon={<User className="h-4 w-4" />}>
                    <input
                      ref={firstField}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Име"
                      autoComplete="name"
                      required
                      className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
                    />
                  </Field>
                  <Field icon={<Mail className="h-4 w-4" />}>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      inputMode="email"
                      placeholder="Имейл — там отива потвърждението за часа"
                      autoComplete="email"
                      required
                      className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
                    />
                  </Field>
                  <Field icon={<Phone className="h-4 w-4" />}>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      inputMode="tel"
                      placeholder="Телефон"
                      autoComplete="tel"
                      required
                      className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
                    />
                  </Field>
                  <Field icon={<Building2 className="h-4 w-4" />}>
                    <input
                      value={business}
                      onChange={(e) => setBusiness(e.target.value)}
                      placeholder="С какво се занимаваш (по желание)"
                      className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
                    />
                  </Field>

                  {error && <p className="pt-1 text-sm text-[#fca5a5]">{error}</p>}

                  <button
                    type="submit"
                    disabled={!valid || step === "connecting"}
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[var(--v2-r-pill)] bg-[var(--v2-cyan)] py-3.5 text-sm font-bold text-[#04060d] transition disabled:opacity-45"
                  >
                    {step === "connecting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Свързвам…
                      </>
                    ) : (
                      <>
                        Пусни разговора <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--v2-faint)]">
                  Разговорът е с AI и той сам ти го казва. Нужен е микрофон.
                  Предпочиташ мълчаливо?{" "}
                  <a href="/booking" className="underline underline-offset-2 hover:text-[var(--v2-muted)]">
                    Запази час от календара
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--v2-r-pill)] border border-[var(--v2-line)] bg-[var(--v2-void)]/60 px-4 transition focus-within:border-[var(--v2-line-bright)]">
      <span className="shrink-0" style={{ color: "var(--v2-cyan)" }}>
        {icon}
      </span>
      {children}
    </div>
  );
}
