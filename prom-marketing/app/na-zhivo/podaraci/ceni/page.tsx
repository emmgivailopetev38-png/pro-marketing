import type { Metadata } from "next";
import { CENI, PODARACI_BASE, PODARACI_ORIGIN } from "@/lib/uebinar/podaraci";
import { CopyButton } from "@/components/uebinar/podaraci/CopyButton";
import { GiftFoot, GiftHero, GiftNext, GiftTop } from "@/components/uebinar/podaraci/GiftShell";
import { Kalkulator } from "@/components/uebinar/podaraci/Kalkulator";
import { PrintButton } from "@/components/uebinar/podaraci/PrintButton";

export const metadata: Metadata = {
  title: "Колко да искаш — цените за сайт и поддръжка",
  alternates: { canonical: `${PODARACI_ORIGIN}${PODARACI_BASE}/ceni` },
};

/** Подарък №3 — наръчникът „Колко да искаш“. */
export default function Page() {
  return (
    <>
      <GiftTop id="ceni" />
      <GiftHero
        id="ceni"
        title="Колко да искаш"
        em="за сайт и поддръжка"
        sub="Цените на пазара днес, три готови пакета, калкулатор и как да кажеш цената спокойно — без да се извиняваш."
      >
        <div className="pd-actions pd-noprint">
          <a className="pd-ghost" href="#kalkulator">
            Към калкулатора <span aria-hidden>↓</span>
          </a>
          <PrintButton />
        </div>
      </GiftHero>

      <main id="top" className="pd-doc">
        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>1 · Пазарът</small>
            {CENI.pazar.title}
          </h2>
          <p className="pd-p">
            Това плащат собствениците днес. Твоята цена е в средата — повече от „направи си сам“, по-достъпно от студио.
          </p>
          <div className="pd-pazar">
            {CENI.pazar.redove.map((r) => (
              <div className="pd-pazar-row" key={r.koi}>
                <span>{r.koi}</span>
                <b>{r.cena}</b>
              </div>
            ))}
          </div>
          <p className="pd-src">
            Източник:{" "}
            <a href={CENI.pazar.izvor.url} target="_blank" rel="noopener noreferrer">
              {CENI.pazar.izvor.ime}
            </a>
            , към {CENI.kam}. {CENI.pazar.domein}
          </p>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>2 · Пакетите</small>Три готови пакета
          </h2>
          <p className="pd-p">Винаги давай три варианта — хората избират между тях, а не между „да“ и „не“. Средният е този, който препоръчваш.</p>
          <div className="pd-paketi">
            {CENI.paketi.map((p) => (
              <article key={p.ime} className={`pd-paket${p.prepor ? " pd-paket-top" : ""}`}>
                {p.prepor ? <span className="pd-ribbon">Препоръчвам</span> : null}
                <h3>{p.ime}</h3>
                <p className="pd-paket-za">{p.za}</p>
                <p className="pd-paket-cena">{p.cena}</p>
                <p className="pd-paket-mes">+ {p.mesechno} поддръжка</p>
                <ul>
                  {p.vliza.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="pd-src">Цените на пакетите са препоръка в средата на пазара. Нагласи ги според града и клиента.</p>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>3 · Поддръжката</small>Какво влиза в месечната такса
          </h2>
          <p className="pd-p">Поддръжката превръща един клиент в доход всеки месец. Кажи ясно какво получава човекът:</p>
          <ul className="pd-ticks">
            {CENI.podrazhka.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="pd-sec" id="kalkulator">
          <h2 className="pd-h2">
            <small>4 · Калкулатор</small>Сметни сам
          </h2>
          <p className="pd-p">Мести плъзгачите с твоите числа — колко клиента, колко за сайта и колко на месец.</p>
          <Kalkulator {...CENI.kalkulator} />
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>5 · Правилата</small>Как да кажеш цената, без да се притесняваш
          </h2>
          <ol className="pd-rules">
            {CENI.pravila.map((r) => (
              <li key={r.t}>
                <b>{r.t}</b>
                <span>{r.d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="pd-sec">
          <h2 className="pd-h2">
            <small>6 · Примерът</small>Как звучи в съобщение
          </h2>
          <p className="pd-p">Пращаш го, когато собственикът каже, че сайтът му харесва. Смени цените с твоите.</p>
          <div className="pd-bubble-wrap">
            <p className="pd-bubble">{CENI.primer}</p>
            <CopyButton text={CENI.primer} />
          </div>
          <GiftNext id="ceni" />
        </section>
      </main>

      <GiftFoot />
    </>
  );
}
