import type { Metadata } from "next";
import { KINO } from "@/lib/kino/config";
import { kinoTimeline, resolveSimTime, premiereLabels } from "@/lib/kino/time";
import { resolveViewer, canPreview, firstParam } from "@/lib/kino/viewer";
import { hallState, serverNow } from "@/lib/kino/server";
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
   ?sim=… (само с админ бисквитката на Ивайло или локално) пренася залата в
   друг момент — фоайе, премиера, поканата, бонусът, повторението, свалено.
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

  const state = viewer.contactId ? await hallState(viewer.contactId) : { offerSeen: false, bonusUnlocked: false, depositPaid: 0, bought: false };

  return (
    <div className="kino kino--hall">
      <Hall
        top={<KinoTop right={<span className="k-pill">Зала 1</span>} />}
        token={viewer.token}
        name={viewer.name || "Ивайло (преглед)"}
        seat={viewer.seat}
        initialNow={simMs ?? serverNow()}
        simMs={simMs}
        offerSeen={state.offerSeen}
        bonusUnlocked={state.bonusUnlocked}
        depositPaid={state.depositPaid}
        bought={state.bought}
        email={viewer.contact?.email ?? null}
        preview={preview}
      />
      <KinoFooter />
      {viewer.token && !preview && <ViewBeacon content="zala" token={viewer.token} />}
    </div>
  );
}
