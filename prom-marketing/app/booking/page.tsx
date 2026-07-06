import type { Metadata } from "next";
import { BookingEmbed } from "@/components/booking/BookingEmbed";

export const metadata: Metadata = {
  title: "Резервирай разговор · ProMarketing",
  description:
    "Запази 30-минутен разговор с Ивайло Петев — обсъждаме процесите ви и какво AI автоматизация може да направи за бизнеса ви.",
};

export default function BookingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030308] text-[#f5f7ff]">
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6, 182, 212, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 20%, rgba(6, 182, 212, 0.10) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(124, 58, 237, 0.08) 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em] text-cyan-300">
            Резервация
          </p>
          <h1 className="font-display text-[clamp(36px,7vw,72px)] font-extrabold leading-[0.95]">
            Запази <span className="text-cyan-300">30 мин</span> разговор
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a5b0c8] md:text-lg">
            Без презентации. Без обещания на калпак. Обсъждаме процесите ви, болезнените места и
            конкретно какво AI автоматизация може да направи за вашия бизнес. Излизаш с план.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/15 bg-[#0a0a1f]/60 p-2 md:p-4">
          <BookingEmbed />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card title="30 минути" body="Достатъчно за дълбок разговор, не за повърхностно представяне." />
          <Card title="Без презентации" body="Не сме тук да продаваме. Тук сме да разберем дали ще си помогнем." />
          <Card title="Конкретен план" body="След разговора получаваш писмен план — какво, кога, на каква стойност." />
        </div>

        <div className="mt-16 border-t border-cyan-500/10 pt-10 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#5a6480]">
            Не намираш подходящ час?
          </p>
          <p className="mt-3 text-sm text-[#a5b0c8]">
            Пиши на{" "}
            <a
              href="mailto:ivailopetev38@gmail.com"
              className="text-cyan-300 hover:underline"
            >
              ivailopetev38@gmail.com
            </a>{" "}
            или се обади на{" "}
            <a href="tel:+359877399963" className="text-cyan-300 hover:underline">
              +359 877 399 963
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0a1f]/40 p-6">
      <h3 className="mb-2 font-display text-lg font-bold text-[#f5f7ff]">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a5b0c8]">{body}</p>
    </div>
  );
}
