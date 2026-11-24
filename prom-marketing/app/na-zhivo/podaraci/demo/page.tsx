import type { Metadata } from "next";
import { DEMO, PODARACI_BASE, PODARACI_ORIGIN, vgradi } from "@/lib/uebinar/podaraci";
import { GiftFoot, GiftHero, GiftNext, GiftTop } from "@/components/uebinar/podaraci/GiftShell";

export const metadata: Metadata = {
  title: "Видео демонстрация: виж как го правя",
  alternates: { canonical: `${PODARACI_ORIGIN}${PODARACI_BASE}/demo` },
};

/**
 * Подарък №2 — видео демонстрацията (вторият подарък по Стефчо). Видеото го
 * записва Ивайло; линкът се слага в DEMO.videoUrl (lib/uebinar/podaraci.ts).
 * Докато го няма, страницата казва кога идва и какво ще има в него.
 */
export default function Page() {
  const v = vgradi(DEMO.videoUrl);
  return (
    <>
      <GiftTop id="demo" />
      <GiftHero
        id="demo"
        title="Виж как го правя —"
        em="целият път, на запис"
        sub="От фирмата без сайт до изпратеното съобщение, стъпка по стъпка на моя екран. Обучението няма запис, а това видео остава за теб."
      />

      <main id="top" className="pd-doc">
        <section className="pd-sec">
          {v ? (
            <div className="pd-video">
              {v.vid === "iframe" ? (
                <iframe
                  src={v.src}
                  title="Видео демонстрация: виж как го правя"
                  loading="lazy"
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={v.src} controls playsInline preload="metadata" />
              )}
            </div>
          ) : (
            <div className="pd-soon">
              <div className="pd-soon-ico" aria-hidden>
                🎬
              </div>
              <b>Видеото идва след обучението</b>
              <p>{DEMO.kogaIdva}</p>
            </div>
          )}
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>Във видеото</small>Четирите стъпки, една по една
          </h2>
          <ol className="pd-steps">
            {DEMO.stapki.map((s) => (
              <li key={s.t}>
                <b>{s.t}</b>
                <span>{s.d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>За да има полза</small>Как да го гледаш
          </h2>
          <ul className="pd-ticks">
            {DEMO.kak.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <GiftNext id="demo" />
        </section>
      </main>

      <GiftFoot />
    </>
  );
}
