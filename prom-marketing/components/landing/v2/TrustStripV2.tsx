import { CounterRamp } from "@/components/effects/CounterRamp";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

/* =====================================================================
   TrustStripV2 — the original TrustStrip, redrawn in the "2050" language.
   Same content 1:1 (4 live AI-team stats), now staged as a depth-glass
   telemetry panel: a NeuralCore centerpiece on the left, the four
   count-up metrics as neon-edged cards on the right.

   No client boundary here — CounterRamp and NeuralCore each own their
   own "use client" runtime, so this stays a server component.
   ===================================================================== */

const STATS = [
  { target: 7, suffix: "", label: "AI агента на смяна", color: "var(--v2-cyan)", tag: "AGENTS" },
  { target: 24, suffix: "/7", label: "Без почивка, без отпуск", color: "var(--v2-violet-2)", tag: "UPTIME" },
  { target: 12, suffix: "ч", label: "Спестени седмично", color: "var(--v2-mint)", tag: "SAVED" },
  { target: 90, suffix: "%", label: "От рутината — на AI", color: "var(--v2-cyan-2)", tag: "AUTOMATED" },
];

export function TrustStripV2() {
  return (
    <section className="v2-section" style={{ paddingBlock: "clamp(56px, 8vw, 104px)" }}>
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
      <hr className="v2-divider" />

      <div className="v2-wrap">
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Left — the living AI core */}
          <div className="v2-reveal order-2 lg:order-1" style={{ ["--d" as string]: "0.05s" }}>
            <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[420px]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[12%] rounded-full opacity-70 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, var(--v2-glow-cyan) 0%, transparent 62%)",
                }}
              />
              <NeuralCore radius={1.25} nodeCount={200} />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="v2-status">AI екип · онлайн</span>
              <span className="v2-mono text-[11px] text-[var(--v2-faint)]">latency&nbsp;~40ms</span>
            </div>
          </div>

          {/* Right — the four live metrics */}
          <div className="order-1 lg:order-2">
            <div className="v2-reveal mb-7">
              <span className="v2-eyebrow">ЕКИПЪТ · НА ЖИВО</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="v2-reveal"
                  style={{ ["--d" as string]: `${0.08 + i * 0.07}s` }}
                >
                  <div
                    className="v2-card v2-glow group h-full"
                    style={{ ["--v2-c" as string]: s.color }}
                  >
                    <span className="v2-tag">{s.tag}</span>
                    <span
                      className="mt-4 block font-bold tracking-tight"
                      style={{
                        color: s.color,
                        fontFamily: "var(--v2-font-display)",
                        fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
                        lineHeight: 1,
                      }}
                    >
                      <CounterRamp target={s.target} suffix={s.suffix} />
                    </span>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[var(--v2-muted)] md:text-xs">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
