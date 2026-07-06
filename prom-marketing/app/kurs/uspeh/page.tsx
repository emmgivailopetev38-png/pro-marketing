import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Crown, Mail } from "lucide-react";
import { CheckoutButton } from "@/components/webinar/CheckoutButton";
import { PurchasePixel } from "@/components/webinar/PurchasePixel";
import { OFFERS } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: "Успешна покупка | ProMarketing",
  description: "Плащането е прието. Следващите стъпки пристигат по имейл.",
  robots: { index: false },
};

/**
 * Страница след успешен Stripe Checkout.
 * - Покупка на курса → благодарност + еднократна ъпгрейд оферта към менторството.
 * - ?stage=mentorship → само благодарност (няма по-горно стъпало).
 */
export default async function KursUspehPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; product?: string; session_id?: string }>;
}) {
  const { stage, product, session_id } = await searchParams;
  const isMentorship = stage === "mentorship";
  const m = OFFERS.mentorship;
  const saving = m.priceEur - m.upgradePriceEur;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-void)] px-6 py-20 text-white">
      <PurchasePixel product={product} sessionId={session_id} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(80vw 60vh at 50% 15%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(70vw 50vh at 85% 90%, rgba(124,58,237,0.14), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-xl space-y-6">
        <div className="rounded-[28px] border border-cyan-400/25 bg-[rgba(7,10,22,0.85)] p-8 shadow-[0_0_90px_-20px_rgba(34,211,238,0.4)] backdrop-blur-xl md:p-10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-9 w-9 text-cyan-300" />
            <h1 className="text-2xl font-bold md:text-3xl">
              {isMentorship ? "Добре дошъл в менторската програма! 🚀" : "Поздравления — вътре си! 🎉"}
            </h1>
          </div>
          <p className="mt-4 flex items-start gap-3 text-[15px] text-slate-300">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <span>
              Плащането е прието. До минути ще получиш имейл с достъпа и следващите стъпки
              {isMentorship ? " — включително линк за първата ни 1-на-1 сесия." : "."}
              {" "}Ако не го виждаш, провери „Спам/Промоции”.
            </span>
          </p>
        </div>

        {!isMentorship && (
          <div className="relative overflow-hidden rounded-[28px] border border-violet-400/35 bg-[linear-gradient(150deg,rgba(124,58,237,0.16),rgba(34,211,238,0.06))] p-8 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)" }}
            />
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-[rgba(124,58,237,0.15)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-200">
              <Crown className="h-3.5 w-3.5" /> Еднократна оферта · само за купилите курса
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-snug">
              Ъпгрейд към „{m.name}” с кредит от {saving} €
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
              {m.tagline} Вместо {m.priceEur} € — доплащаш{" "}
              <strong className="text-violet-200">{m.upgradePriceEur} €</strong>, защото курсът ти се
              признава като кредит. Тази цена се предлага само на тази страница.
            </p>
            <ul className="mt-5 space-y-2 text-[15px] text-slate-300">
              <li>• 16 лични 1-на-1 сесии — изграждаме твоята система заедно</li>
              <li>• Преглед на твоите реални кампании, фунии и автоматизации</li>
              <li>• Директна връзка с ментора между сесиите</li>
            </ul>
            <div className="mt-7">
              <CheckoutButton product="mentorship-upgrade">
                Взимам ъпгрейда · {m.upgradePriceEur} € вместо {m.priceEur} €
              </CheckoutButton>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Или продължи само с курса — той е напълно самостоятелен.{" "}
              <Link href="/mentor" className="underline underline-offset-2 hover:text-slate-300">
                Детайли за програмата
              </Link>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-slate-600">
          Въпрос? Пиши ни на promarketing.pw — отговаряме бързо.
        </p>
      </div>
    </main>
  );
}
