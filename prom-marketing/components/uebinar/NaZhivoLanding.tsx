/* ---------------------------------------------------------------------------
   NaZhivoLanding — страницата за записване за обучението на живо „Допълнителен доход
   с AI“ (ivailopetev.com). Текстът е в lib/uebinar/na-zhivo.ts.

   Редът на секциите е от срещата със Стефчо (21.11.2026) и примерната страница,
   която той показа: лента с датата → внимание (аудиторията) → заглавие →
   подзаглавие → „без“ частта като текст → бутон → тайните → бонуси →
   доказателство → кой е водещият → въпроси → последна секция.
   Бутоните са яркочервени и са навсякъде. Без видео на страницата.
   25.11.2026 вечер · дизайнът по „Дизайн правила“ на Стефчо: червено САМО по бутоните,
   една гама (топли неутрални: почти черно, топло сиво, бяло), без емоджита пред редове
   и в заглавия, без цветни ленти, сенки и светене, без тирета в текста.
   25.11.2026 20:24 · Стефчо: „много монотонна цветово… в зелената цветова гама… да се
   чете по-лесно… визуално като се раздели“ → секциите се редуват: светло зелено (главна
   част) · бяло (тайните) · тъмно зелено (подаръци) · светло зелено (доказателство) ·
   бяло (авторитет) · светло зелено (въпроси) · тъмно зелено (последна секция).
   Сървърен компонент; единственият клиентски остров е формата (ZapisForm).
--------------------------------------------------------------------------- */
import Image from "next/image";
import Link from "next/link";
import { NA_ZHIVO as c, calendarUrl } from "@/lib/uebinar/na-zhivo";
import { OTZIVI } from "@/lib/site/otzivi";
import { ZapisForm } from "./ZapisForm";
import { UebinarSledene } from "./UebinarSledene";
import { ZAGLAVIE_B, type Varianta } from "@/lib/uebinar/ab";
import { UEBINAR_LINKOVE } from "@/lib/uebinar/linkove";
import { UEBINAR_ORIGIN, UEBINAR_PIXEL_ID } from "@/lib/uebinar/domen";

function Cta({ place }: { place: string }) {
  return (
    <button type="button" className="nz-btn" data-zapis={place}>
      {c.cta}
    </button>
  );
}

function DateLine() {
  return (
    <p className="nz-dateline">
      {c.dateLabel}, {c.topBar}
    </p>
  );
}


/** `varianta` — A/B тестът (lib/uebinar/ab.ts): Б е без подзаглавие и със заглавието на Стефчо. */
export function NaZhivoLanding({ varianta = "A" }: { varianta?: Varianta }) {
  const zaglavie = varianta === "B" ? ZAGLAVIE_B : c.headline;
  return (
    <div className="nz">
      <div className="nz-top" role="note">
        <strong>{c.dateLabel}</strong> <span className="nz-top-rest">· {c.topBar}</span>
      </div>

      <main>
        {/* 1 · Главна част */}
        <section className="nz-hero">
          <div className="nz-wrap nz-center">
            <p className="nz-pill">
              Безплатно онлайн обучение <strong>„{c.name}“</strong> с {c.host}
            </p>

            <p className="nz-vnimanie">
              <strong>ВНИМАНИЕ:</strong> {c.vnimanie}
            </p>

            <h1 className="nz-h1">
              {zaglavie.before}
              <mark>{zaglavie.mark}</mark>
              {zaglavie.after}
              {/* Страхът да не изпуснеш — последният ред на заглавието (Стефчо, 24.11.2026) */}
              <span className="nz-fomo">{c.fomo}</span>
            </h1>

            {varianta === "A" ? <p className="nz-sub">{c.sub}</p> : null}

            {/* „Без“ частта — един ред със запетаи (Стефчо, 25.11.2026 18:43) */}
            <p className="nz-bez">{c.bez}</p>

            <Cta place="hero" />
            <p className="nz-under">Безплатно · на живо · {c.dayShort}</p>
          </div>
        </section>

        {/* 2 · Какво ще научиш — тайните („По време на обучението ще ти разкрия“) */}
        <section className="nz-sec">
          <div className="nz-wrap nz-two">
            <div className="nz-photo">
              <Image
                src="/images/ivailo/IMG_7318.jpeg"
                alt={`${c.host}, водещ на обучението`}
                width={896}
                height={1152}
                sizes="(min-width: 900px) 380px, 86vw"
                priority={false}
              />
            </div>
            <div>
              <p className="nz-intro">{c.tainiIntro}</p>
              <h2 className="nz-h2">{c.tainiTitle}</h2>
              <ol className="nz-taini">
                {c.taini.map((t) => (
                  <li key={t.n}>
                    <span className="nz-taina-n">{t.n}</span>
                    <p>
                      <strong>{t.title}</strong>
                      {t.body}
                    </p>
                  </li>
                ))}
              </ol>
              <Cta place="taini" />
            </div>
          </div>
        </section>

        {/* 3 · Бонуси за останалите до края */}
        <section className="nz-sec nz-dark">
          <div className="nz-wrap nz-center">
            <p className="nz-eyebrow">{c.bonusi.eyebrow}</p>
            <h2 className="nz-h2">
              {c.bonusi.title}
              {c.bonusi.stoinost ? <span className="nz-stoinost"> {c.bonusi.stoinost}</span> : null}
            </h2>
            <p className="nz-lead">{c.bonusi.sub}</p>

            <ul className="nz-gifts">
              {c.bonusi.items.map((g) => (
                <li key={g.kind}>
                  <div>
                    <p className="nz-gift-kind">{g.kind}</p>
                    <p className="nz-gift-name">{g.name}</p>
                    <p className="nz-gift-body">{g.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="nz-total">
              {c.bonusi.total}
            </p>
            <DateLine />
            <Cta place="bonusi" />
          </div>
        </section>

        {/* 4 · Доказателство */}
        <section className="nz-sec nz-soft">
          <div className="nz-wrap nz-center">
            <p className="nz-kicker">{c.dokazatelstvo.kicker}</p>
            <h2 className="nz-h2">{c.dokazatelstvo.title}</h2>
            <p className="nz-lead">{c.dokazatelstvo.note}</p>

            {c.dokazatelstvo.video.some((v) => v.na) && (
              <>
                <h3 className="nz-votz-title">{c.dokazatelstvo.videoTitle}</h3>
                <div className="nz-votzivi">
                  {c.dokazatelstvo.video
                    .filter((v) => v.na)
                    .map((v) => (
                      <figure key={v.id}>
                        <p className="nz-otz-kontekst">{v.kontekst}</p>
                        <video controls preload="none" playsInline poster={v.poster} src={v.src} />
                        <figcaption>
                          <strong>{v.koi}</strong>
                          <span>{v.usluga}</span>
                        </figcaption>
                      </figure>
                    ))}
                </div>
              </>
            )}

            <div className="nz-otzivi">
              {(c.dokazatelstvo.otziviIds as readonly string[])
                .map((id) => OTZIVI.find((o) => o.id === id))
                .filter((o): o is (typeof OTZIVI)[number] => Boolean(o))
                .map((o) => (
                <figure key={o.id}>
                  <p className="nz-otz-kontekst">{(c.dokazatelstvo.kontekst as Record<string, string>)[o.id]}</p>
                  <Image
                    src={o.snimka.src}
                    alt={`Съобщение от клиент: „${o.text}“`}
                    width={o.snimka.width}
                    height={o.snimka.height}
                    loading="lazy"
                    sizes="(min-width: 900px) 460px, 92vw"
                  />
                  <figcaption>
                    <strong>{o.etiket}</strong>
                    <span>
                      {o.kanal} · {o.data}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <Cta place="dokazatelstvo" />
          </div>
        </section>

        {/* 5 · Авторитет */}
        <section className="nz-sec">
          <div className="nz-wrap nz-two nz-two-rev">
            <div>
              <h2 className="nz-h2">
                {c.avtoritet.title} <span className="nz-h2-tail">{c.avtoritet.titleTail}</span>
              </h2>
              <p className="nz-bio">{c.avtoritet.intro}</p>
              <ul className="nz-trofei">
                {c.avtoritet.tochki.map((t) => (
                  <li key={t.b}>
                    <p>
                      <strong>{t.b}</strong> {t.t}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="nz-kam">Числата са към {c.avtoritet.kam} г.</p>
              <DateLine />
              <Cta place="avtoritet" />
            </div>
            <div className="nz-photo nz-photo-sm">
              <Image
                src="/images/ivailo/IMG_7315.jpeg"
                alt={c.host}
                width={896}
                height={1152}
                loading="lazy"
                sizes="(min-width: 900px) 320px, 70vw"
              />
            </div>
          </div>
        </section>

        {/* 6 · Често задавани въпроси */}
        <section className="nz-sec nz-soft">
          <div className="nz-wrap nz-narrow">
            <h2 className="nz-h2 nz-center">Често задавани въпроси</h2>
            <div className="nz-faq">
              {c.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · Последна секция */}
        <section className="nz-sec nz-dark nz-final">
          <div className="nz-wrap nz-center">
            <h2 className="nz-h2">{c.final.title}</h2>
            <p className="nz-lead">{c.final.sub}</p>
            <DateLine />
            <Cta place="final" />
          </div>
        </section>
      </main>

      <footer className="nz-foot">
        <div className="nz-wrap nz-center">
          <p>{c.disclaimer}</p>
          <p>
            <Link href="/privacy">Поверителност</Link> · <Link href="/terms">Условия</Link> · ПроМаркетинг ЕООД
          </p>
          <p className="nz-sign">🌐 petevai.com · promarketing.pw</p>
        </div>
      </footer>

      <div className="nz-sticky">
        <Cta place="sticky" />
      </div>

      <ZapisForm
        slug={c.slug}
        title={c.form.title}
        dateLabel={c.dateLabel}
        button={c.form.button}
        consent={c.form.consent}
        doneTitle={c.form.doneTitle}
        doneBody={c.form.doneBody}
        calendarLabel={c.form.calendar}
        calendarHref={calendarUrl()}
        viberHref={UEBINAR_LINKOVE.viberKanal ? `${UEBINAR_ORIGIN}/viber` : null}
        varianta={varianta}
      />
      <UebinarSledene stranica="lending" varianta={varianta} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${UEBINAR_PIXEL_ID}&ev=PageView&noscript=1`} alt="" />
      </noscript>
    </div>
  );
}
