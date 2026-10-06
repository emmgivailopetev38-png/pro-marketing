import type { Metadata } from "next";
import Link from "next/link";
import { firstCohort } from "@/lib/kino/cohorts";
import { KINO } from "@/lib/kino/config";
import { resolveViewer, firstParam, canPreview, previewAs } from "@/lib/kino/viewer";
import { hallState, hasKinoInvite, serverNow, cohortFor } from "@/lib/kino/server";
import { isCartOpen } from "@/lib/kino/pricing";
import { premiereLabels } from "@/lib/kino/time";
import { KinoTop, KinoFooter } from "@/components/kino/KinoChrome";
import { PaymentOffer } from "@/components/kino/PaymentClient";
import { CallPanel } from "@/components/kino/Offer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Плащане · ${KINO.title}` },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/* =====================================================================
   /kino/plashtane?t=… — личната страница за плащане:
    - „ДОПЛАТИ“ след капарото — на срещата или след нея (пон–чт, 19–22.10);
      капарото е приспаднато автоматично, мястото е в потока на капарото;
    - линкът, който Ивайло или Димитър пращат след разговор.
   До затварянето (нд 18.10, 23:59) е отворена за всеки с билет. След това —
   само за платилите капаро и поканените (записан час / даден на Димитър),
   решава CRM-ът; за останалите — следващият поток и час за разговор.
   Прегледът: ?as=deposit | invited | bought.
   ===================================================================== */
export default async function PlashtanePage({ searchParams }: Props) {
  const sp = await searchParams;
  const viewer = await resolveViewer(firstParam(sp.t));
  if (!viewer.token || !viewer.contactId) {
    return (
      <div className="kino">
        <KinoTop />
        <section className="k-section" style={{ borderTop: 0 }}>
          <div className="k-wrap k-narrow" style={{ textAlign: "center" }}>
            <h1 className="k-h2">Тази страница е лична</h1>
            <p className="k-lead" style={{ marginInline: "auto" }}>
              Отвори я от линка, който ти пратихме. Нямаш линк? Вземи си билет за филма — там е всичко.
            </p>
            <div className="k-cta-row" style={{ justifyContent: "center" }}>
              <Link className="k-btn k-btn--primary" href="/kino">
                Към „{KINO.title}“
              </Link>
            </div>
          </div>
        </section>
        <KinoFooter />
      </div>
    );
  }
  const as = (await canPreview()) ? previewAs(firstParam(sp.as)) : null;
  const real = await hallState(viewer.contactId);
  const st =
    as === "deposit" ? { ...real, depositPaid: KINO.prices.deposit, depositCohort: firstCohort().id } : as === "bought" ? { ...real, bought: true } : real;
  const now = serverNow();
  const invited = as === "invited" || (await hasKinoInvite(viewer.contactId));
  const cohort = await cohortFor(now, st.depositCohort);
  const closed = !st.bought && !isCartOpen(now, { depositPaid: st.depositPaid > 0, invited });
  const hello = viewer.named ? `Здравей, ${viewer.name.split(/\s+/)[0]}` : "Здравей";
  if (closed) {
    const when = premiereLabels();
    return (
      <div className="kino">
        <KinoTop right={<span className="k-pill">Лична страница</span>} />
        <section className="k-section" style={{ borderTop: 0 }}>
          <div className="k-wrap k-narrow">
            <span className="k-kicker">{hello}</span>
            <h1 className="k-h2">Записването в първия поток затвори</h1>
            <p className="k-lead">
              Затвори {when.closeDay}, {when.closeTime}. Следващият поток започва {cohort.startOnDay} — да поговорим ли дали е за
              теб? Кратка заявка и избираш час — {KINO.cal.minutes} минути.
            </p>
            <CallPanel token={viewer.token} name={viewer.name} email={viewer.contact?.email ?? null} />
          </div>
        </section>
        <KinoFooter />
      </div>
    );
  }
  const topUp = st.depositPaid > 0 && !st.bought;
  return (
    <div className="kino">
      <KinoTop right={<span className="k-pill">Лична страница</span>} />
      <section className="k-hero" style={{ paddingTop: 8 }}>
        <div className="k-wrap">
          <span className="k-kicker">{hello}</span>
          <h1 className="k-h2">{topUp ? "Доплащане — мястото ти е запазено" : "Да продължим заедно"}</h1>
          {topUp && (
            <p className="k-lead" style={{ marginTop: 0 }}>
              Капарото ти ({KINO.prices.deposit} €) е приспаднато. Избираш как да доплатиш — наведнъж или на вноски.
            </p>
          )}
          <PaymentOffer
            token={viewer.token}
            depositPaid={st.depositPaid}
            bought={st.bought}
            name={viewer.name}
            email={viewer.contact?.email ?? null}
            hours={st.hours}
            cohort={cohort}
          />
        </div>
      </section>
      <KinoFooter />
    </div>
  );
}
