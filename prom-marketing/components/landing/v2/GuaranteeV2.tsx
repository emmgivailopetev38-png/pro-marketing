"use client";
/* =====================================================================
   GuaranteeV2 — гаранцията „30 дни или не плащаш" на началната страница.
   Изградена върху "Luminescent Depth" езика (app/v2/v2-design.css):
   depth-glass панел с неонов ръб (.v2-glow), холографски .v2-title и
   .v2-aurora фон.

   Съдържание: значката, гаранцията, три уверения и един бутон към
   формата за контакт (#kontakti).

   04.10.2026 — свален броячът „Само 5 места… 2 заети": числата бяха
   написани в кода, а не истински, а фалшивият недостиг руши доверието
   (и е забранена търговска практика). Свалена е и отделната форма тук —
   на страницата вече има една ясна форма за контакт.
   ===================================================================== */
import { useEffect, useRef } from "react";
import { ShieldCheck, Phone, ArrowRight, Gift } from "lucide-react";
import { track } from "@/lib/analytics/track";

const REASSURANCE = [
  { icon: Gift, label: "Безплатен първи разговор", sub: "Без ангажимент" },
  { icon: ShieldCheck, label: "Писмена гаранция", sub: "Черно на бяло" },
  { icon: Phone, label: "Ние се обаждаме", sub: "Ти само остави телефон" },
];

export function GuaranteeV2() {
  const sectionRef = useRef<HTMLElement | null>(null);

  // Reveal: toggle .is-in на .v2-reveal възлите при влизане във вю.
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>(".v2-reveal");
    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.18 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="v2-guarantee v2-section relative overflow-hidden">
      <div className="v2-aurora" aria-hidden />

      <div className="v2-wrap">
        <div
          className="v2-reveal v2-card v2-glow is-always relative mx-auto max-w-4xl text-center"
          style={{
            ["--v2-c" as never]: "var(--v2-cyan)",
            padding: "clamp(32px, 5vw, 60px)",
          }}
        >
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
              <ShieldCheck className="h-12 w-12" strokeWidth={1.4} style={{ color: "var(--v2-cyan)" }} aria-hidden />
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

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {REASSURANCE.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="v2-glass flex items-center gap-3 px-4 py-3.5 text-left">
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

          <div className="v2-reveal mx-auto mt-9 max-w-md" style={{ ["--d" as never]: "0.12s" }}>
            <a
              href="#kontakti"
              onClick={() => track("cta_clicked", { location: "guarantee", target: "kontakti" })}
              className="v2-btn v2-btn-primary is-lg w-full justify-center"
            >
              Искам разговор
              <ArrowRight className="h-4 w-4 v2-arrow" aria-hidden />
            </a>
            <p
              className="v2-mono mt-3 text-[10.5px] uppercase"
              style={{ letterSpacing: "0.16em", color: "var(--v2-faint)" }}
            >
              Безплатно · без ангажимент · ние ти звъним
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
