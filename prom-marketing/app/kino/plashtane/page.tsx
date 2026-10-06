import type { Metadata } from "next";
import Link from "next/link";
import { KINO } from "@/lib/kino/config";
import { resolveViewer, firstParam } from "@/lib/kino/viewer";
import { hallState, hasKinoInvite, serverNow } from "@/lib/kino/server";
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
   /kino/plashtane?t=… — поканата без залата: линкът, който Ивайло или
   Димитър пращат след разговора, и „доплащането“ след капарото (капарото
   се приспада само). След като филмът свали (нд 23:59) плащането е само за
   платилите капаро и хората след разговор — решава CRM-ът (hasKinoInvite);
   за останалите страницата предлага час за разговор.
   ===================================================================== */
export default async function PlashtanePage({ searchParams }: Props) {
  const viewer = await resolveViewer(firstParam((await searchParams).t));
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
  const st = await hallState(viewer.contactId);
  const closed =
    !st.bought && !isCartOpen(serverNow(), { depositPaid: st.depositPaid > 0 }) && !(await hasKinoInvite(viewer.contactId));
  if (closed) {
    const when = premiereLabels();
    return (
      <div className="kino">
        <KinoTop right={<span className="k-pill">Лична страница</span>} />
        <section className="k-section" style={{ borderTop: 0 }}>
          <div className="k-wrap k-narrow">
            <span className="k-kicker">{viewer.named ? `Здравей, ${viewer.name.split(/\s+/)[0]}` : "Здравей"}</span>
            <h1 className="k-h2">Записването в потока затвори заедно с филма</h1>
            <p className="k-lead">
              „{KINO.title}“ беше на екран до {when.replayUntilDay}, {when.replayUntilTime}. Да поговорим ли какво следва за твоя
              бизнес? Избери час — {KINO.cal.minutes} минути.
            </p>
            <CallPanel token={viewer.token} name={viewer.name} email={viewer.contact?.email ?? null} />
          </div>
        </section>
        <KinoFooter />
      </div>
    );
  }
  return (
    <div className="kino">
      <KinoTop right={<span className="k-pill">Лична страница</span>} />
      <section className="k-hero" style={{ paddingTop: 8 }}>
        <div className="k-wrap">
          <span className="k-kicker">{viewer.named ? `Здравей, ${viewer.name.split(/\s+/)[0]}` : "Здравей"}</span>
          <h1 className="k-h2">Да продължим заедно</h1>
          <PaymentOffer
            token={viewer.token}
            depositPaid={st.depositPaid}
            bought={st.bought}
            name={viewer.name}
            email={viewer.contact?.email ?? null}
            hours={st.hours}
          />
        </div>
      </section>
      <KinoFooter />
    </div>
  );
}
