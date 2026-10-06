import type { Metadata } from "next";
import { firstCohort } from "@/lib/kino/cohorts";
import { KINO, KINO_TEST_VIDEO } from "@/lib/kino/config";
import { kinoTimeline, resolveSimTime, premiereLabels } from "@/lib/kino/time";
import { resolveViewer, canPreview, firstParam, previewAs } from "@/lib/kino/viewer";
import { hallState, serverNow, EMPTY_HALL_STATE, hasKinoInvite, cohortFor } from "@/lib/kino/server";
import { isKinoDemoEnv } from "@/lib/kino/token";
import { Hall } from "@/components/kino/Hall";
import { KinoTop, KinoFooter } from "@/components/kino/KinoChrome";
import { RegisterForm } from "@/components/kino/RegisterForm";
import { ViewBeacon } from "@/components/kino/ViewBeacon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Залата · ${KINO.title}` },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/* =====================================================================
   /kino/zala?t=… — залата. Без билет: „вземи безплатен билет и влизаш“.
   ?sim=… (само с админ бисквитката на Ивайло или в прегледа) пренася залата
   в друг момент — фоайе, вратите, филмът, числото, поканата, въпросите,
   подаръкът, след филма, последните часове, затворено. ?live=<линк> показва
   бутона „НА ЖИВО“ в прегледа, без да пипа Режисьорската кабина.
   ===================================================================== */
export default async function ZalaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const t = firstParam(sp.t);
  const viewer = await resolveViewer(t);
  const allowPreview = await canPreview();
  const simMs = allowPreview ? resolveSimTime(firstParam(sp.sim), kinoTimeline()) : null;
  const preview = simMs != null;
  const when = premiereLabels();

  if (!viewer.token && !preview) {
    return (
      <div className="kino">
        <KinoTop />
        <section className="k-section" style={{ borderTop: 0 }}>
          <div className="k-wrap k-narrow">
            <span className="k-kicker">Зала 1</span>
            <h1 className="k-h2">Тази зала е за хората с билет</h1>
            <p className="k-lead">
              Билетът е безплатен — отнема 20 секунди и влизаш веднага. Имаш вече? Отвори линка от имейла с билета.
            </p>
            <div className="k-boxoffice" style={{ marginTop: 22 }}>
              <p className="k-h3">
                {KINO.title} · {when.day} · {when.time}
              </p>
              <RegisterForm submitLabel="Вземи билет и влез" compact goTo="zala" />
            </div>
          </div>
        </section>
        <KinoFooter />
      </div>
    );
  }

  const as = preview ? previewAs(firstParam(sp.as)) : null;
  const real = viewer.contactId ? await hallState(viewer.contactId) : EMPTY_HALL_STATE;
  const state =
    as === "deposit"
      ? { ...real, depositPaid: KINO.prices.deposit, depositCohort: firstCohort().id, entered: true }
      : as === "bought"
        ? { ...real, bought: true, entered: true }
        : real;
  const nowMs = simMs ?? serverNow();
  // След затварянето плащат само платилите капаро и поканените след разговор.
  const invited =
    as === "invited" ||
    (viewer.contactId && nowMs >= Date.parse(KINO.screening.closeISO) ? await hasKinoInvite(viewer.contactId) : false);
  const cohort = await cohortFor(nowMs, state.depositCohort);
  const simLive = preview ? (firstParam(sp.live) ?? null) : null;
  // Филмът от конфигурацията. Докато не е качен — в прегледа (локално / Vercel
  // preview) пробата с тийзъра; в продукцията никога.
  const video = KINO.video.kind === "none" && isKinoDemoEnv() && KINO_TEST_VIDEO ? KINO_TEST_VIDEO : KINO.video;

  return (
    <div className="kino kino--hall">
      <Hall
        top={<KinoTop right={<span className="k-pill">Зала 1</span>} />}
        token={viewer.token}
        name={viewer.name || "Ивайло (преглед)"}
        seat={viewer.seat}
        initialNow={nowMs}
        simMs={simMs}
        entered={state.entered}
        bonusUnlocked={state.bonusUnlocked}
        invited={invited}
        cohort={cohort}
        simLive={simLive}
        depositPaid={state.depositPaid}
        bought={state.bought}
        email={viewer.contact?.email ?? null}
        preview={preview}
        video={video}
        hours={state.hours}
        bonusUrl={state.bonusUnlocked || preview ? KINO.bonus.url : null}
      />
      <KinoFooter />
      {viewer.token && !preview && <ViewBeacon content="zala" token={viewer.token} />}
    </div>
  );
}
