import type { Metadata } from "next";
import Link from "next/link";
import { KINO } from "@/lib/kino/config";
import { premiereLabels } from "@/lib/kino/time";
import { premiereGoogleUrl } from "@/lib/kino/calendar";
import { resolveViewer, firstParam } from "@/lib/kino/viewer";
import { contactFromTicket } from "@/lib/kino/token";
import { KinoTop, KinoFooter } from "@/components/kino/KinoChrome";
import { WarmupQuestions } from "@/components/kino/WarmupQuestions";
import { ShareTicket } from "@/components/kino/ShareTicket";
import { ViewBeacon } from "@/components/kino/ViewBeacon";
import { KinoPlayer } from "@/components/kino/KinoPlayer";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = firstParam((await searchParams).t);
  const valid = t && contactFromTicket(t);
  return {
    title: { absolute: `Билетът ти · ${KINO.title}` },
    robots: { index: false, follow: false },
    openGraph: valid ? { images: [{ url: `/api/kino/ticket?t=${t}`, width: 1200, height: 630, alt: "Кино билет" }] } : undefined,
  };
}

/* =====================================================================
   /kino/bilet?t=… — билетът. Тук човекът:
   влиза в Кино клуба (Viber) · слага прожекцията в календара · сваля
   билета · гледа трейлърите · отговаря на 3 въпроса (→ CRM).
   ===================================================================== */
export default async function BiletPage({ searchParams }: Props) {
  const t = firstParam((await searchParams).t);
  const viewer = await resolveViewer(t);
  const when = premiereLabels();

  if (!viewer.token || !viewer.seat) {
    return (
      <div className="kino">
        <KinoTop />
        <section className="k-section" style={{ borderTop: 0 }}>
          <div className="k-wrap k-narrow" style={{ textAlign: "center" }}>
            <h1 className="k-h2">Този билет не го намираме</h1>
            <p className="k-lead" style={{ marginInline: "auto" }}>
              Отвори линка от имейла с билета — или си вземи нов, отнема 20 секунди.
            </p>
            <div className="k-cta-row" style={{ justifyContent: "center" }}>
              <Link href="/kino#bilet" className="k-btn k-btn--primary">
                🎟️ Вземи безплатен билет
              </Link>
            </div>
          </div>
        </section>
        <KinoFooter />
      </div>
    );
  }

  const token = viewer.token;
  const first = viewer.name.split(/\s+/)[0];
  const hallShort = `${KINO.site}/k/${token}`;
  const trailers = KINO.trailers.filter((x) => x.source.kind !== "none");

  return (
    <div className="kino">
      <KinoTop right={<span className="k-pill">Зала {viewer.seat.hall}</span>} />

      <section className="k-hero" style={{ paddingBottom: 40 }}>
        <div className="k-wrap k-narrow">
          <span className="k-kicker">Билетът ти е запазен</span>
          <h1 className="k-h2" style={{ marginBottom: 22 }}>
            {viewer.named ? `Ще се видим в залата, ${first}! 🍿` : "Ще се видим в залата! 🍿"}
          </h1>

          <div className="k-ticket" aria-label="Твоят кино билет">
            <div className="k-ticket-main">
              <span className="k-kicker">Онлайн премиера · билет</span>
              <p className="k-ticket-title">{KINO.title}</p>
              <span className="k-wave" aria-hidden="true" />
              <p className="k-ticket-name">
                На името на
                <strong>{viewer.name}</strong>
              </p>
              <p className="k-ticket-when">
                {when.day} · {when.time} · онлайн
              </p>
            </div>
            <div className="k-stub">
              <div className="k-stub-cell">
                <span>ЗАЛА</span>
                <strong>{viewer.seat.hall}</strong>
              </div>
              <div className="k-stub-cell">
                <span>РЕД</span>
                <strong className="k-grad-text">{viewer.seat.row}</strong>
              </div>
              <div className="k-stub-cell">
                <span>МЯСТО</span>
                <strong className="k-grad-text">{viewer.seat.seat}</strong>
              </div>
            </div>
          </div>

          <div className="k-actions-grid">
            {KINO.viberClubUrl ? (
              <a className="k-btn k-btn--viber k-btn--block" href={KINO.viberClubUrl} target="_blank" rel="noopener">
                💬 Влез в Кино клуба във Viber
              </a>
            ) : (
              // ⚠ Линкът за общността „Кино клуб · ВЪЛНАТА“ го дава Ивайло (NEXT_PUBLIC_KINO_VIBER_URL)
              <span className="k-btn k-btn--viber k-btn--block" aria-disabled="true">
                💬 Кино клубът във Viber отваря скоро — линкът идва на имейла ти
              </span>
            )}
            <p className="k-muted" style={{ margin: "-4px 0 0", fontSize: "0.86rem", textAlign: "center" }}>
              Там са трите трейлъра, кадри зад кулисите и напомнянето преди прожекцията. Пишат само организаторите.
            </p>
          </div>

          <div className="k-actions-grid k-actions-grid--2">
            <a className="k-btn" href={`/api/kino/ics?t=${token}`}>
              📅 Добави в календара
            </a>
            <a className="k-btn" href={premiereGoogleUrl(hallShort)} target="_blank" rel="noopener">
              📆 Google Календар
            </a>
          </div>

          <ShareTicket imageUrl={`/api/kino/ticket?t=${token}`} landingUrl={`${KINO.site}/kino`} />

          <div className="k-panel" style={{ marginTop: 22 }}>
            <p className="k-h3">Залата ти</p>
            <p className="k-lead" style={{ marginTop: 6 }}>
              Отваря в {when.doorsTime} в деня на премиерата. Линкът е личен — пази го (ще ти го пратим и в деня).
            </p>
            <div className="k-cta-row" style={{ marginTop: 14 }}>
              <Link className="k-btn k-btn--primary" href={`/kino/zala?t=${token}`}>
                🎬 Към залата
              </Link>
            </div>
          </div>
        </div>
      </section>

      {trailers.length > 0 && (
        <section className="k-section" aria-labelledby="k-trailers">
          <div className="k-wrap k-narrow">
            <span className="k-kicker">Трейлърите</span>
            <h2 id="k-trailers" className="k-h2">
              Докато чакаш премиерата
            </h2>
            <div className="k-cards">
              {trailers.map((tr) => (
                <article key={tr.id} id={`trailer-${tr.id.slice(1)}`} className="k-card" style={{ scrollMarginTop: 16 }}>
                  <h3 className="k-h3" style={{ marginBottom: 12 }}>
                    {tr.title}
                  </h3>
                  <div className="k-screen">
                    <KinoPlayer source={tr.source as Exclude<typeof tr.source, { kind: "none" }>} controls title={tr.title} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="k-section" aria-labelledby="k-3q">
        <div className="k-wrap k-narrow">
          <span className="k-kicker">Докато чакаш</span>
          <h2 id="k-3q" className="k-h2">
            3 въпроса към теб
          </h2>
          <p className="k-lead">Отговорите ги чета лично — по тях подготвям срещата ни.</p>
          <div style={{ marginTop: 22 }}>
            <WarmupQuestions token={token} />
          </div>
        </div>
      </section>

      <KinoFooter />
      <ViewBeacon content="bilet" token={token} />
    </div>
  );
}
