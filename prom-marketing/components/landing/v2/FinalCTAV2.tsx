"use client";
/* =====================================================================
   FinalCTAV2 — "2050" redesign of components/landing/FinalCTA.tsx.
   Every text, link, datum and interaction preserved 1:1:
     • the booking-popup onClick (openBookingPopup) and its Meta tracking,
     • the cal.com fallback link (CAL_LINK),
     • the MagneticButton magnetic pull,
     • the dual pulse-ring halo (its cyan/violet rgba already matches the
       v2 palette, so it's kept verbatim).
   Only reskinned to the "Luminescent Depth" language via v2-* classes,
   with a NeuralCore behind the CTA as the signature centerpiece.

   "use client" because the CTA is interactive (onClick → booking modal).
   A lightweight IntersectionObserver toggles `.is-in` on the .v2-reveal
   nodes (matches the FAQV2 / PainPointsV2 pattern).

   No currency strings present → nothing to convert.
   ===================================================================== */
import { useEffect } from "react";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";
import { openBookingPopup, CAL_LINK } from "@/lib/cal/embed";

export function FinalCTAV2() {
  // Lightweight reveal: toggle .is-in on .v2-reveal nodes as they enter.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = document.querySelectorAll<HTMLElement>(".v2-final-cta .v2-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section className="v2-final-cta v2-section relative overflow-hidden">
      {/* signature depth glow */}
      <div className="v2-aurora" aria-hidden />

      {/* NeuralCore centerpiece — sits behind the CTA, masked into the void */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.55] md:block"
        style={{
          maskImage: "radial-gradient(circle, #000 38%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle, #000 38%, transparent 72%)",
        }}
        aria-hidden
      >
        <NeuralCore nodeCount={200} radius={1.3} spin={0.9} />
      </div>

      <div className="v2-wrap">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="v2-reveal">
            <span className="v2-eyebrow justify-center">{"// финал"}</span>
            <h2
              className="v2-title mt-4"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Готов ли си да автоматизираш?
            </h2>
            <p className="v2-sub mx-auto mt-6 max-w-xl text-center">
              30 минути разговор. Без презентации. Излизаш с конкретен план.
            </p>
          </div>

          <div
            className="v2-reveal mt-12 flex flex-col items-center gap-5"
            style={{ ["--d" as string]: "0.16s" }}
          >
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 -m-2 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(34,211,238,0.5)",
                  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite",
                }}
              />
              <span
                aria-hidden
                className="absolute inset-0 -m-2 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(124,58,237,0.4)",
                  animation: "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite 0.8s",
                }}
              />
              <MagneticButton strength={0.45} radius={80}>
                <button
                  type="button"
                  onClick={() => void openBookingPopup()}
                  className="v2-btn v2-btn-primary is-lg"
                >
                  Запази среща сега
                  <span className="v2-arrow" aria-hidden>
                    →
                  </span>
                </button>
              </MagneticButton>
            </div>
            <a
              href={`https://cal.com/${CAL_LINK}`}
              target="_blank"
              rel="noopener noreferrer"
              className="v2-mono text-xs uppercase tracking-[0.2em] transition-colors"
              style={{ color: "var(--v2-faint)" }}
            >
              или отвори календара на cal.com →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
