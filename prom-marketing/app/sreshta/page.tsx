import type { Metadata } from "next";
import { BookingEmbed } from "@/components/booking/BookingEmbed";

/**
 * Срещите с Ивайло — фолоуъпи, оферти, втори срещи.
 *
 * /booking е за НОВИТЕ лийдове и от 02.11.2026 записва при Георги
 * (клоузъра, събитие konsultacia-georgi). Хората, с които Ивайло вече
 * говори, получават ТОЗИ линк: той пише в календара на Ивайло
 * (събитието consultation, 45 мин). Страницата не се индексира —
 * линкът се дава лично във фолоуъп.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/sreshta" },
  robots: { index: false },
  title: "Среща с Ивайло",
  description:
    "Запази 45-минутен разговор с Ивайло Петев — продължаваме оттам, докъдето сме стигнали.",
};

export default function SreshtaPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030308] text-[#f5f7ff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6, 182, 212, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan-300">
            Среща с Ивайло
          </p>
          <h1 className="font-display text-[clamp(36px,7vw,72px)] font-extrabold leading-[0.95]">
            Избери <span className="text-cyan-300">час</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a5b0c8] md:text-lg">
            45 минути с Ивайло Петев — продължаваме оттам, докъдето сме стигнали.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/15 bg-[#0a0a1f]/60 p-2 md:p-4">
          <BookingEmbed calLink="promarketing/consultation" />
        </div>

        <div className="mt-4 text-center">
          <a
            href="https://cal.com/promarketing/consultation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-6 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
          >
            Календарът не се вижда? Отвори го директно →
          </a>
        </div>
      </div>
    </main>
  );
}
