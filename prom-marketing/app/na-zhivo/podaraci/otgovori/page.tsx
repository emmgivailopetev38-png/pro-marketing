import type { Metadata } from "next";
import { OTGOVORI, OTGOVORI_PRAVILA, PODARACI_BASE, PODARACI_ORIGIN } from "@/lib/uebinar/podaraci";
import { CopyButton } from "@/components/uebinar/podaraci/CopyButton";
import { GiftFoot, GiftHero, GiftNext, GiftTop, Tekst } from "@/components/uebinar/podaraci/GiftShell";
import { PrintButton } from "@/components/uebinar/podaraci/PrintButton";

export const metadata: Metadata = {
  title: "Какво да отговориш, когато… — 12 готови отговора",
  alternates: { canonical: `${PODARACI_ORIGIN}${PODARACI_BASE}/otgovori` },
};

/** Подарък №4 — 12 готови отговора на най-честите думи на собствениците. */
export default function Page() {
  return (
    <>
      <GiftTop id="otgovori" />
      <GiftHero
        id="otgovori"
        title="Какво да отговориш,"
        em="когато…"
        sub="12-те най-чести отговора на собствениците — и готов отговор на всеки. Копираш, сменяш думите в [скобите] и пращаш."
      >
        <div className="pd-actions pd-noprint">
          <PrintButton />
        </div>
      </GiftHero>

      <main id="top" className="pd-doc">
        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>Преди всичко</small>5 правила за всеки отговор
          </h2>
          <ul className="pd-ticks">
            {OTGOVORI_PRAVILA.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>{OTGOVORI.length} отговора</small>Когато собственикът каже…
          </h2>
          <nav className="pd-chips pd-noprint" aria-label="Бързо към отговор">
            {OTGOVORI.map((o) => (
              <a key={o.id} href={`#${o.id}`}>
                {o.vazrazhenie.replace(/[.?!]+$/, "")}
              </a>
            ))}
          </nav>
          <ol className="pd-objs">
            {OTGOVORI.map((o, i) => (
              <li key={o.id} id={o.id} className="pd-obj">
                <div className="pd-obj-q">
                  <span className="pd-obj-n" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3>„{o.vazrazhenie}“</h3>
                    <p>
                      <span className="pd-obj-lbl">Зад думите</span> {o.zad}
                    </p>
                  </div>
                </div>
                <div className="pd-bubble-wrap">
                  <p className="pd-bubble">
                    <Tekst text={o.otgovor} />
                  </p>
                  <CopyButton text={o.otgovor} />
                </div>
              </li>
            ))}
          </ol>
          <GiftNext id="otgovori" />
        </section>
      </main>

      <GiftFoot />
    </>
  );
}
