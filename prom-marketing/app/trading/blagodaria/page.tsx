import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Download, PhoneCall } from "lucide-react";
import { TRADING, TRADING_DISCLAIMER } from "@/lib/trading/config";

export const metadata: Metadata = {
  title: `Книгата пътува към теб — ${TRADING.title} | ProMarketing`,
  description: "Провери пощата си. До 24 часа ще се свържем за краткия разговор.",
  robots: { index: false },
};

export default function TradingThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-void)] px-6 py-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(80vw 60vh at 50% 20%, rgba(124,58,237,0.15), transparent 60%), radial-gradient(70vw 50vh at 85% 90%, rgba(5,150,105,0.1), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-xl">
        <div className="rounded-[28px] border border-violet-400/30 bg-[rgba(12,8,22,0.9)] p-8 shadow-[0_0_90px_-20px_rgba(124,58,237,0.5)] backdrop-blur-xl md:p-10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-9 w-9 text-violet-300" />
            <h1 className="text-2xl font-bold md:text-3xl">Книгата пътува към теб! 📕</h1>
          </div>

          <div className="mt-6 space-y-3 text-[15px] text-slate-300">
            <p className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
              <span>
                Изпратихме „{TRADING.book.title}” на имейла ти (провери и „Спам/Промоции”) — или я свали направо
                от тук:
              </span>
            </p>
          </div>

          <a
            href={TRADING.book.pdfPath}
            className="tr-cta mt-5 inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-bold text-white"
            style={{
              background: "linear-gradient(120deg, #7c3aed, #6d28d9 55%, #059669)",
              boxShadow: "0 0 44px rgba(124,58,237,0.45)",
            }}
          >
            <Download className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
            Свали книгата (PDF)
          </a>

          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-[rgba(5,150,105,0.08)] p-6">
            <p className="flex items-start gap-3 text-[15px] text-slate-200">
              <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <span>
                <strong className="text-white">Какво следва:</strong> до 24 часа ще ти позвъним/пишем за краткия
                15-минутен разговор. Ако бързаш — запази си час сега:{" "}
                <Link href="/booking" className="font-semibold text-emerald-300 underline underline-offset-4">
                  promarketing.pw/booking
                </Link>
              </span>
            </p>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-slate-600">⚠️ {TRADING_DISCLAIMER}</p>
        </div>
      </div>
    </main>
  );
}
