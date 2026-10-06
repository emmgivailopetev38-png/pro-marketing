import type { Metadata } from "next";
import Link from "next/link";
import Stripe from "stripe";
import { KINO } from "@/lib/kino/config";
import { formatEur, isKinoPlan } from "@/lib/kino/pricing";
import { resolveViewer, firstParam } from "@/lib/kino/viewer";
import { KinoTop, KinoFooter } from "@/components/kino/KinoChrome";
import { KinoPurchaseBeacon, ThankYouCal } from "@/components/kino/PaymentClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Благодарим · ${KINO.title}` },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Сумата от Stripe (ако ключът е сложен) — за да не пише страницата нещо, което не е станало. */
async function paidSession(sessionId: string | null): Promise<{ amount: number; total: number; paid: boolean } | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const s = await new Stripe(key).checkout.sessions.retrieve(sessionId);
    if (s.metadata?.funnel !== "kino") return null;
    const amount = (s.amount_total ?? 0) / 100;
    return { amount, total: Number(s.metadata?.total_eur) || amount, paid: s.payment_status === "paid" };
  } catch {
    return null;
  }
}

/* =====================================================================
   /kino/blagodarim — след плащането.
   Поток: „Добре дошъл“ + какво следва + онбординг разговор.
   Капаро: „Мястото ти е запазено“ + направо календарът.
   ===================================================================== */
export default async function BlagodarimPage({ searchParams }: Props) {
  const sp = await searchParams;
  const plan = firstParam(sp.plan);
  const sessionId = firstParam(sp.session_id);
  const viewer = await resolveViewer(firstParam(sp.t));
  const session = await paidSession(sessionId);
  const first = viewer.named ? viewer.name.split(/\s+/)[0] : "";
  const deposit = plan === "deposit";

  return (
    <div className="kino">
      <KinoTop right={<span className="k-pill">{deposit ? "Капаро" : "Поток"}</span>} />
      <section className="k-hero">
        <div className="k-wrap k-narrow">
          {deposit ? (
            <>
              <span className="k-kicker">Мястото ти е запазено</span>
              <h1 className="k-h2">Благодаря{first ? `, ${first}` : ""}! 🔒</h1>
              <p className="k-lead">
                Капарото {session ? `(${formatEur(session.amount)}) ` : ""}мина — мястото ти в потока е запазено до разговора ни.
                Приспада се изцяло от цената.
              </p>
              <p className="k-lead">Избери час — 20 минути, в които ще видим заедно откъде да започнеш:</p>
            </>
          ) : (
            <>
              <span className="k-kicker">Добре дошъл в потока</span>
              <h1 className="k-h2">Част втора започва{first ? `, ${first}` : ""}! 🎉</h1>
              <p className="k-lead">
                {session ? `Плащането (${formatEur(session.amount)}) мина. ` : ""}Радвам се, че ще го направим заедно. Ето какво
                следва:
              </p>
              <ol className="k-list" style={{ listStyle: "none" }}>
                <li>До 24 часа получаваш покана за Академията на имейла си.</li>
                <li>Запази си първия разговор с мен — там започваме „AI картата на бизнеса ти“.</li>
                <li>Датата на първата жива среща идва в отделно писмо. Касовата бележка от Stripe — също.</li>
              </ol>
              <p className="k-lead">Избери час за първия разговор:</p>
            </>
          )}
          <div style={{ marginTop: 18 }}>
            <ThankYouCal
              name={viewer.contact?.full_name ?? null}
              email={viewer.contact?.email ?? null}
              notes={deposit ? `Капаро от залата на „${KINO.title}“ — разговор преди потока` : `Онбординг — влезе в потока от „${KINO.title}“`}
            />
          </div>
          <p className="k-muted" style={{ marginTop: 18 }}>
            Въпрос? Отговори на писмото, което ти пратихме — пише го човек.{" "}
            {viewer.token && (
              <Link className="k-link" href={`/kino/zala?t=${viewer.token}`}>
                Обратно към залата
              </Link>
            )}
          </p>
        </div>
      </section>
      <KinoFooter />
      {!deposit && sessionId && isKinoPlan(plan) && session?.paid && (
        <KinoPurchaseBeacon sessionId={sessionId} value={session.total} plan={plan} />
      )}
    </div>
  );
}
