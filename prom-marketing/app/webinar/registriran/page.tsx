import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Download, Mail, MonitorPlay } from "lucide-react";
import { WEBINAR, GIFT, webinarDateLabel } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: `Записан си! — ${WEBINAR.title} | ProMarketing`,
  description: "Мястото ти е запазено. Свали подаръка си и провери имейла си за Zoom линка.",
  robots: { index: false },
};

export default function WebinarThankYouPage() {
  const dateLabel = webinarDateLabel();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-void)] px-6 py-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(80vw 60vh at 50% 20%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(70vw 50vh at 80% 90%, rgba(124,58,237,0.12), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-xl">
        <div className="rounded-[28px] border border-cyan-400/25 bg-[rgba(7,10,22,0.85)] p-8 shadow-[0_0_90px_-20px_rgba(34,211,238,0.4)] backdrop-blur-xl md:p-10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-9 w-9 text-cyan-300" />
            <h1 className="text-2xl font-bold md:text-3xl">Мястото ти е запазено! 🎉</h1>
          </div>

          <div className="mt-6 space-y-3 text-[15px] text-slate-300">
            <p className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              {dateLabel ? (
                <span>
                  Обучението е <strong className="text-white">{dateLabel}</strong> — на живо в Zoom.
                </span>
              ) : (
                <span>
                  Датата се обявява всеки момент — ще я получиш <strong className="text-white">първи по имейл</strong>,
                  заедно със Zoom линка.
                </span>
              )}
            </p>
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <span>
                Провери пощата си (и папка „Спам/Промоции”) — изпратихме ти потвърждение
                {WEBINAR.zoomJoinUrl ? " със Zoom линка" : ""} и подаръка.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <MonitorPlay className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <span>
                Влиза се от компютър, телефон или таблет. Запази си {WEBINAR.durationMinutes} минути — бонусите в
                края са само за присъстващите на живо.
              </span>
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-violet-400/30 bg-[rgba(124,58,237,0.1)] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-violet-300">
              Подаръкът ти · стойност 90 €
            </p>
            <h2 className="mt-1.5 text-lg font-bold">„{GIFT.title}”</h2>
            <p className="mt-1 text-sm text-slate-400">
              7-дневен план, 25 промпта, чеклист и шаблонът на фунията — започни още днес.
            </p>
            <a
              href={GIFT.pdfPath}
              className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3 font-bold text-[var(--color-bg-void)] shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:shadow-[0_0_60px_rgba(34,211,238,0.55)]"
            >
              <Download className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
              Свали пакета (PDF)
            </a>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Дотогава — разгледай{" "}
            <Link href="/demo" className="font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4">
              живото демо
            </Link>{" "}
            на системите, които ще видиш на обучението.
          </p>
        </div>
      </div>
    </main>
  );
}
