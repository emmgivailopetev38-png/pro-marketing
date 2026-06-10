"use client";
/* =====================================================================
   GuaranteeV2 — "2050" гаранция + недостиг секция за promarketing.pw/v2.
   Изградена 1:1 върху "Luminescent Depth" езика (app/v2/v2-design.css):
   depth-glass панел с ротиращ conic neon ръб (.v2-glow), холографски
   .v2-title, и signature .v2-aurora фон.

   Съдържание:
     • голяма значка „🛡️ Гаранция за резултат: 30 дни или не плащаш",
     • риск-реверс копи (безплатно · без ангажимент · ние се обаждаме),
     • спешност „Само 5 места за нови клиенти този месец" с визуален
       брояч (5 общо → 2 заети, анимиран при влизане във вю),
     • CTA, който разкрива телефон-only capture (точно патернът от
       components/landing/v2/AiAudit.tsx → POST /api/leads/submit).

   "use client" защото секцията е интерактивна (брояч + capture форма).
   Лек IntersectionObserver toggle-ва `.is-in` на .v2-reveal възлите и
   стартира броя на заетите места — същият патерн като FinalCTAV2.

   ⚠ Никакви реални клиенти — само неутрални числа за наличност.
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck, Phone, ArrowRight, Check, Loader2, Sparkles, Clock, Gift,
} from "lucide-react";
import { track } from "@/lib/analytics/track";

const TOTAL_SPOTS = 5;
const TAKEN_SPOTS = 2; // 5 → 2 заети, остават 3 свободни

const REASSURANCE = [
  { icon: Gift, label: "100% безплатно", sub: "Нулев риск за теб" },
  { icon: ShieldCheck, label: "Без ангажимент", sub: "Решаваш след като видиш плана" },
  { icon: Phone, label: "Ние се обаждаме", sub: "Ти само остави телефон" },
];

export function GuaranteeV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [taken, setTaken] = useState(0);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  // Reveal + анимация на брояча: toggle .is-in и брой заетите места.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setTaken(TAKEN_SPOTS);
      return;
    }
    const root = sectionRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>(".v2-reveal");
    let counted = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
        if (!counted && entries.some((e) => e.isIntersecting)) {
          counted = true;
          // постепенно „заемане" на местата за визуален ефект
          let n = 0;
          const step = () => {
            n += 1;
            setTaken(n);
            if (n < TAKEN_SPOTS) window.setTimeout(step, 420);
          };
          window.setTimeout(step, 350);
        }
      },
      { threshold: 0.18 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const free = TOTAL_SPOTS - TAKEN_SPOTS;

  const reveal = () => {
    setOpen(true);
    track("guarantee_cta_open");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) return;
    setStatus("submitting");
    track("guarantee_submit");
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: "Гаранция 30 дни · запази място (v2) · телефон за обаждане",
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("done");
        track("guarantee_lead");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section ref={sectionRef} className="v2-guarantee v2-section relative overflow-hidden">
      {/* signature depth glow */}
      <div className="v2-aurora" aria-hidden />

      <div className="v2-wrap">
        <div
          className="v2-reveal v2-card v2-glow is-always relative mx-auto max-w-4xl text-center"
          style={{
            ["--v2-c" as never]: "var(--v2-cyan)",
            padding: "clamp(32px, 5vw, 60px)",
          }}
        >
          {/* ——— Значка „Гаранция за резултат" ——— */}
          <div className="flex flex-col items-center">
            <span
              className="mb-7 inline-flex items-center justify-center rounded-full"
              style={{
                width: "clamp(78px, 11vw, 104px)",
                height: "clamp(78px, 11vw, 104px)",
                background:
                  "radial-gradient(circle at 50% 35%, rgba(34,211,238,0.22), rgba(124,58,237,0.12) 60%, transparent 75%)",
                border: "1px solid var(--v2-line-bright)",
                boxShadow: "0 0 50px -10px var(--v2-glow-cyan), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <ShieldCheck
                className="h-12 w-12"
                strokeWidth={1.4}
                style={{ color: "var(--v2-cyan)" }}
                aria-hidden
              />
            </span>

            <span className="v2-eyebrow justify-center">{"// гаранция за резултат"}</span>

            <h2
              className="v2-title mt-4"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              30 дни или не плащаш.
            </h2>

            <p className="v2-sub mx-auto mt-5 max-w-2xl text-center">
              Толкова сме сигурни в резултата, че го гарантираме писмено. Ако за 30 дни
              нашето AI решение не свърши уговорената работа — не ни дължиш нищо.
              Целият риск е наш, не твой.
            </p>
          </div>

          {/* ——— Риск-реверс: 3 микро-уверения ——— */}
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {REASSURANCE.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.label}
                  className="v2-glass flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                    style={{ border: "1px solid var(--v2-line)", background: "var(--v2-glass-2)" }}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.5} style={{ color: "var(--v2-cyan)" }} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold" style={{ color: "var(--v2-ink)" }}>
                      {r.label}
                    </span>
                    <span className="block text-xs leading-snug" style={{ color: "var(--v2-faint)" }}>
                      {r.sub}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* ——— Недостиг: „Само 5 места" + визуален брояч ——— */}
          <div
            className="v2-reveal mt-8 rounded-[var(--v2-r)] px-5 py-6"
            style={{
              ["--d" as never]: "0.12s",
              border: "1px solid rgba(217,70,239,0.28)",
              background:
                "linear-gradient(180deg, rgba(217,70,239,0.07), rgba(124,58,237,0.05))",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" style={{ color: "var(--v2-magenta)" }} aria-hidden />
              <span
                className="v2-mono text-[11px] font-medium uppercase"
                style={{ letterSpacing: "0.2em", color: "var(--v2-violet-2)" }}
              >
                Ограничен капацитет този месец
              </span>
            </div>

            <p className="mt-3 text-lg font-bold sm:text-xl" style={{ color: "var(--v2-ink)" }}>
              Само{" "}
              <span style={{ color: "var(--v2-magenta)" }}>5 места</span>{" "}
              за нови клиенти.
            </p>

            {/* брояч на местата: запълнените са „заети", останалите светят */}
            <div className="mt-4 flex items-center justify-center gap-2.5" aria-hidden>
              {Array.from({ length: TOTAL_SPOTS }).map((_, i) => {
                const isTaken = i < taken;
                return (
                  <span
                    key={i}
                    className="relative grid place-items-center rounded-[10px] transition-all duration-500"
                    style={{
                      width: "clamp(40px, 9vw, 52px)",
                      height: "clamp(40px, 9vw, 52px)",
                      fontFamily: "var(--v2-font-mono)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isTaken ? "var(--v2-faint)" : "var(--v2-cyan)",
                      border: isTaken
                        ? "1px solid var(--v2-line)"
                        : "1px solid var(--v2-line-bright)",
                      background: isTaken
                        ? "rgba(255,255,255,0.02)"
                        : "var(--v2-glass-2)",
                      boxShadow: isTaken ? "none" : "0 0 24px -8px var(--v2-glow-cyan)",
                      opacity: isTaken ? 0.55 : 1,
                    }}
                  >
                    {isTaken ? "✕" : "●"}
                  </span>
                );
              })}
            </div>

            <p
              className="v2-mono mt-3.5 text-[11px] uppercase"
              style={{ letterSpacing: "0.16em", color: "var(--v2-muted)" }}
              aria-live="polite"
            >
              {taken} заети · остават{" "}
              <span style={{ color: "var(--v2-cyan)" }}>{TOTAL_SPOTS - taken}</span>{" "}
              свободни
            </p>
          </div>

          {/* ——— CTA / телефон-only capture ——— */}
          <div
            className="v2-reveal mx-auto mt-9 max-w-md"
            style={{ ["--d" as never]: "0.2s" }}
          >
            {status === "done" ? (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(34,211,238,0.12)" }}>
                  <Check className="h-7 w-7" style={{ color: "var(--v2-cyan)" }} aria-hidden />
                </span>
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-ink)" }}>
                  Мястото ти е запазено.
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--v2-muted)" }}>
                  Обаждаме се в рамките на работния ден с твоята гаранция и план — черно на бяло.
                </p>
              </div>
            ) : !open ? (
              <>
                <button type="button" onClick={reveal} className="v2-btn v2-btn-primary is-lg w-full justify-center">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Запази едно от местата
                  <span className="v2-arrow" aria-hidden>→</span>
                </button>
                <p className="v2-mono mt-3 text-[10.5px] uppercase" style={{ letterSpacing: "0.16em", color: "var(--v2-faint)" }}>
                  Безплатно · без ангажимент · ние ти звъним
                </p>
              </>
            ) : (
              <form onSubmit={submit} className="space-y-2.5 text-left">
                <p className="text-center text-sm" style={{ color: "var(--v2-muted)" }}>
                  Остави телефон — поемаме всичко останало.
                </p>
                <div
                  className="flex items-center gap-2 rounded-[14px] px-4 transition"
                  style={{ border: "1px solid var(--v2-line)", background: "rgba(0,0,0,0.3)" }}
                >
                  <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} aria-hidden />
                  <input
                    value={phone}
                    onChange={(ev) => setPhone(ev.target.value)}
                    type="tel"
                    required
                    autoFocus
                    autoComplete="tel"
                    placeholder="Телефон за обаждане"
                    className="w-full bg-transparent py-3.5 text-sm outline-none"
                    style={{ color: "var(--v2-ink)", fontFamily: "var(--v2-font-display)" }}
                  />
                </div>

                {status === "error" && (
                  <p
                    className="rounded-[10px] px-3 py-2 text-xs"
                    style={{ border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#fca5a5" }}
                  >
                    Грешка — опитай пак или звънни на +359 877 399 963.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="v2-btn v2-btn-primary is-lg w-full justify-center"
                >
                  {status === "submitting" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Запазвам…</>
                  ) : (
                    <>Запази мястото си <ArrowRight className="h-4 w-4 v2-arrow" aria-hidden /></>
                  )}
                </button>
                <p className="v2-mono text-center text-[10.5px] uppercase" style={{ letterSpacing: "0.16em", color: "var(--v2-faint)" }}>
                  Само телефон · отговор в работния ден
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
