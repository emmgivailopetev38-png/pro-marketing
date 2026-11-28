import type { Metadata } from "next";
import { DANACI, PODARACI_BASE, PODARACI_ORIGIN } from "@/lib/uebinar/podaraci";
import { Cheklist } from "@/components/uebinar/podaraci/Cheklist";
import { GiftFoot, GiftHero, GiftNext, GiftTop } from "@/components/uebinar/podaraci/GiftShell";
import { PrintButton } from "@/components/uebinar/podaraci/PrintButton";

export const metadata: Metadata = {
  title: "Данъците от допълнителния доход — чеклист",
  alternates: { canonical: `${PODARACI_ORIGIN}${PODARACI_BASE}/danaci` },
};

/** Бонус (бивш подарък №6) — чеклистът за данъците (числата са с източник и дата). */
export default function Page() {
  return (
    <>
      <GiftTop id="danaci" />
      <GiftHero
        id="danaci"
        title="Данъците от допълнителния доход —"
        em="законно от първия клиент"
        sub="Трите начина да вземаш парите, числата за 2026 г. и стъпките една по една — с отметки, за да виждаш докъде си."
      >
        <div className="pd-actions pd-noprint">
          <PrintButton />
        </div>
      </GiftHero>

      <main id="top" className="pd-doc">
        <p className="pd-note">
          <span aria-hidden>⚠️</span>
          <span>
            <b>Това е ориентир, не консултация.</b> Числата са проверени към {DANACI.kam} по източниците най-долу. Преди първия
            клиент — 30 минути със счетоводител.
          </span>
        </p>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>1 · Числата</small>Шест числа за 2026 г.
          </h2>
          <div className="pd-nums">
            {DANACI.chisla.map((c) => (
              <div className="pd-num" key={c.n}>
                <b>{c.n}</b>
                <span>{c.t}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>2 · Начините</small>Три начина да вземаш парите законно
          </h2>
          <div className="pd-paths">
            {DANACI.pateki.map((p, i) => (
              <article className={`pd-path${"prepor" in p && p.prepor ? " pd-path-top" : ""}`} key={p.ime}>
                {"prepor" in p && p.prepor ? <span className="pd-ribbon">Най-гъвкав</span> : null}
                <p className="pd-path-koga">
                  {i + 1} · {p.koga}
                </p>
                <h3>{p.ime}</h3>
                <p>{p.kak}</p>
                <p className="plus">{p.plus}</p>
                <p className="minus">{p.minus}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>3 · Стъпките</small>Една по една — отмятай
          </h2>
          <p className="pd-p">Отметките се пазят в този браузър — връщаш се и виждаш докъде си.</p>
          <Cheklist stapki={DANACI.stapki} />
          <p className="pd-note">
            <span aria-hidden>💼</span>
            <span>
              <b>Ако работиш и на трудов договор.</b> {DANACI.trudov}
            </span>
          </p>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>4 · Източниците</small>Откъде са числата
          </h2>
          <ul className="pd-sources">
            {DANACI.izvori.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.ime}
                </a>
              </li>
            ))}
          </ul>
          <p className="pd-src">Проверено към {DANACI.kam}. Законите се менят — преди да действаш, провери със счетоводител.</p>
          <GiftNext id="danaci" />
        </section>
      </main>

      <GiftFoot />
    </>
  );
}
