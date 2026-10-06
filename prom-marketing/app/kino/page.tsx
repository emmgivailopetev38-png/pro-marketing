import Image from "next/image";
import { KINO } from "@/lib/kino/config";
import { kinoTimeline, premiereLabels } from "@/lib/kino/time";
import { PosterArt } from "@/components/kino/PosterArt";
import { TrailerScreen } from "@/components/kino/TrailerScreen";
import { Countdown } from "@/components/kino/Countdown";
import { RegisterForm } from "@/components/kino/RegisterForm";
import { ViewBeacon } from "@/components/kino/ViewBeacon";
import { MobileTicketCta } from "@/components/kino/MobileTicketCta";
import { KinoTop, KinoFooter } from "@/components/kino/KinoChrome";

/* =====================================================================
   /kino — афишът на „ВЪЛНАТА“. Една цел: безплатен билет.
   Честно от първия ред: филмът е направен изцяло с AI (и гласът), а накрая
   Ивайло показва как да продължиш с него. Без фалшиви броячи, без обещания
   за доходи. Броячът е истински — до началото на премиерата.
   Статична страница: всичко идва от lib/kino/config.ts.
   ===================================================================== */

const when = premiereLabels();
const tl = kinoTimeline();
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

const SEE = [
  {
    n: "01",
    title: "Какво вече се случва — тук и сега",
    body: "Баба от Троян, която говори с телефона си. Ресторант, в който някой вдига в 23:00. Оферта, готова за 30 секунди. Без футурология — неща, които вече вървят в България.",
  },
  {
    n: "02",
    title: "Какво идва — и защо е по-близо, отколкото си мислиш",
    body: "Къде сме спрямо Европа (числата са с източник на екрана) и защо вълната този път не чака никого.",
  },
  {
    n: "03",
    title: "Какво можеш да направиш още тази вечер",
    body: "Конкретна първа крачка за твоя бизнес — дори никога повече да не чуеш за мен.",
  },
];

const FOR = [
  "Собственици и управители на малък и среден бизнес.",
  "Човекът, през когото минава всичко — телефонът, офертите, клиентите.",
  "Ако вече ползваш ChatGPT, но си ударил стена.",
  "Ако искаш да започнеш с AI и не знаеш откъде.",
];

const NOT_FOR = [
  "Ако търсиш някой да го направи вместо теб, без да участваш — за това има отделен разговор и накрая ще ти кажа как.",
  "Ако нямаш бизнес и не мислиш да имаш — филмът е за собственици.",
  "Ако чакаш тайна формула за лесни пари — такава тук няма.",
];

const FAQ = [
  {
    q: "Безплатно ли е?",
    a: "Да. Билетът е безплатен и филмът е цял — не е реклама с трейлър. В края ще ти покажа как можеш да продължиш с мен: платено, ако решиш. Изборът е изцяло твой.",
  },
  { q: "Колко трае?", a: "Около 40 минути филм. След премиерата влизам на живо за въпросите ти — до 15 минути." },
  {
    q: "Ще има ли запис?",
    a: `Филмът е на екран до ${when.replayUntilDay}, ${when.replayUntilTime}. После сваля — това е истинският срок, не номер.`,
  },
  { q: "AI ли е филмът?", a: "Да, изцяло — и гласът. Как — ще видиш." },
  { q: "Ако закъснея?", a: "Влизаш в текущата минута — като в истинско кино. Началото те чака в повторението." },
  { q: "Трябва ли да инсталирам нещо?", a: "Не. Гледаш в браузъра — от телефона или от компютъра. Линкът е в билета ти." },
];

export default function KinoAfishPage() {
  return (
    <div className="kino">
      <KinoTop />

      {/* ── АФИШЪТ ── */}
      <section className="k-hero" aria-labelledby="k-title">
        <div className="k-wrap k-hero-grid">
          <div>
            <span className="k-kicker">Онлайн премиера · вход свободен</span>
            <h1 id="k-title" className="k-title">
              {KINO.title}
            </h1>
            <span className="k-wave" aria-hidden="true" />
            <p className="k-sub">{KINO.subtitle}</p>
            <p className="k-tagline">{KINO.tagline}</p>

            <div className="k-date">
              <strong>
                {cap(when.day)} · {when.time}
              </strong>
              <span className="k-pill">онлайн</span>
              <span className="k-pill">~40 мин филм + на живо</span>
            </div>

            <Countdown
              targetMs={tl.premiereMs}
              after={
                <p className="k-pill k-pill--live" style={{ marginTop: 22 }}>
                  <span className="k-dot" /> Премиерата върви — залата е отворена за хората с билет
                </p>
              }
            />

            <div className="k-cta-row">
              <a href="#bilet" className="k-btn k-btn--primary">
                🎟️ Вземи безплатен билет
              </a>
              <a href="#kakvo" className="k-btn">
                Какво ще видиш
              </a>
            </div>

            <p className="k-ai-note">
              <span aria-hidden="true">🎞️</span>
              <span>
                <b>Честно, от началото:</b> целият филм е направен с изкуствен интелект — картината, музиката и дори гласът,
                който разказва (AI клонинг на моя глас). Как — ще ти покажа накрая.
              </span>
            </p>
          </div>

          <div className="k-poster-wrap">
            <TrailerScreen source={KINO.trailer}>
              <PosterArt id="hero-poster" className="k-poster" />
            </TrailerScreen>
            <p className="k-poster-caption">Роботът вече си взе пуканки. Мястото до него е свободно.</p>
          </div>
        </div>
      </section>

      {/* ── БИЛЕТНАТА КАСА ── */}
      <section id="bilet" className="k-section" aria-labelledby="k-bilet">
        <div className="k-wrap">
          <div className="k-boxoffice">
            <div className="k-hero-grid" style={{ alignItems: "start" }}>
              <div>
                <span className="k-kicker">Билетна каса</span>
                <h2 id="k-bilet" className="k-h2">
                  Вземи си безплатен билет
                </h2>
                <p className="k-lead">Мястото ти в залата — с личен линк, календар и напомняне в деня. Отнема 20 секунди.</p>
                <ul className="k-list k-perks">
                  <li>Билетът идва на имейла ти веднага — с линка към залата.</li>
                  <li>В деня на премиерата ти напомняме, за да не се разминем.</li>
                  <li>Гледаш от телефона или от компютъра. Без инсталиране.</li>
                </ul>
              </div>
              <RegisterForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── КАКВО ЩЕ ВИДИШ ── */}
      <section id="kakvo" className="k-section" aria-labelledby="k-kakvo">
        <div className="k-wrap">
          <span className="k-kicker">В залата</span>
          <h2 id="k-kakvo" className="k-h2">
            Какво ще видиш
          </h2>
          <p className="k-lead">Без технически думи. Без програмиране. На човешки, български език. И да — пуканките са позволени.</p>
          <div className="k-cards k-cards--3">
            {SEE.map((s) => (
              <article className="k-card" key={s.n}>
                <span className="k-card-n">{s.n}</span>
                <h3 className="k-h3" style={{ marginTop: 8 }}>
                  {s.title}
                </h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── ЗА КОГО Е ── */}
      <section className="k-section" aria-labelledby="k-zakogo">
        <div className="k-wrap">
          <span className="k-kicker">Честно</span>
          <h2 id="k-zakogo" className="k-h2">
            За кого е този филм — и за кого не е
          </h2>
          <div className="k-cards k-cards--2">
            <div className="k-card k-card--glow">
              <h3 className="k-h3">За теб е, ако си…</h3>
              <ul className="k-list">
                {FOR.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="k-card">
              <h3 className="k-h3">Не е за теб, ако…</h3>
              <ul className="k-list k-list--no">
                {NOT_FOR.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── КОЙ Е ИВАЙЛО ── ⚠ текстът е по собствените му думи от сценария (гл. 2) — потвърждава кое остава */}
      <section className="k-section" aria-labelledby="k-ivailo">
        <div className="k-wrap k-host">
          <div className="k-host-photo">
            <Image src={KINO.host.photo} alt={KINO.host.name} fill sizes="(min-width: 820px) 340px, 90vw" />
          </div>
          <div>
            <span className="k-kicker">Режисьор</span>
            <h2 id="k-ivailo" className="k-h2">
              Кой е Ивайло
            </h2>
            <p className="k-lead">
              Завърших финанси в Свищов. Не съм програмист. Научих рекламите, като харчех собствените си пари, а после
              започнах да питам изкуствения интелект — първо за дреболии, после за всичко.
            </p>
            <p className="k-lead">
              Днес фирмата ми работи с AI служители: вдигат телефона, пишат оферти, пускат реклами, правят отчети. На
              български. Този филм го направих сам — с тях.
            </p>
            <p className="k-quote">„Аз на компютъра почти нищо не пиша. Само говоря.“</p>
            {KINO.host.screens.length > 0 && (
              <div className="k-cards k-cards--3" style={{ marginTop: 22 }}>
                {KINO.host.screens.map((sc) => (
                  <div key={sc.src} className="k-screen" style={{ aspectRatio: "16 / 10" }}>
                    <Image src={sc.src} alt={sc.alt} fill sizes="(min-width: 820px) 240px, 90vw" style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ПРОЖЕКЦИИТЕ ── */}
      <section className="k-section" aria-labelledby="k-projekcii">
        <div className="k-wrap">
          <span className="k-kicker">Програмата</span>
          <h2 id="k-projekcii" className="k-h2">
            Прожекциите
          </h2>
          <div className="k-cards k-cards--2">
            <article className="k-card k-card--glow">
              <span className="k-pill k-pill--live">
                <span className="k-dot" /> Премиера · на живо
              </span>
              <h3 className="k-h3" style={{ marginTop: 14 }}>
                {cap(when.day)} · {when.time}
              </h3>
              <p>
                Всички гледаме една и съща минута — като в истинско кино. Залата отваря в {when.doorsTime}. След филма влизам
                на живо за въпросите ти.
              </p>
            </article>
            <article className="k-card">
              <span className="k-pill">Повторение</span>
              <h3 className="k-h3" style={{ marginTop: 14 }}>
                До {when.replayUntilDay}, {when.replayUntilTime}
              </h3>
              <p>Ако не успееш вечерта — гледаш, когато ти е удобно. После филмът сваля. Истински срок, не номер.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── ОФЕРТАТА, ОБЯВЕНА ПРЕДВАРИТЕЛНО ── ⚠ ЧЕРНОВА — чака Ивайло */}
      <section className="k-section" aria-labelledby="k-prodalzhenie">
        <div className="k-wrap k-narrow">
          <span className="k-kicker">Без изненади</span>
          <h2 id="k-prodalzhenie" className="k-h2">
            Накрая ще ти покажа как да продължиш с мен
          </h2>
          <p className="k-lead">
            Филмът е безплатен и е цял. С надписите ще ти покажа програмата, в която правим това заедно — с живи срещи,
            {KINO.seats ? ` за ${KINO.seats} души` : ""}. Платена е и ще ти кажа цената открито. Ако не е за теб — просто
            затваряш екрана. Без натиск.
          </p>
          <p className="k-lead k-muted" style={{ fontSize: "0.92rem" }}>
            Записването в потока е отворено, докато филмът е на екран — до {when.replayUntilDay}, {when.replayUntilTime}. Цената е
            крайна, с ДДС.
          </p>
        </div>
      </section>

      {/* ── ЧЗВ ── */}
      <section className="k-section" aria-labelledby="k-faq">
        <div className="k-wrap k-narrow">
          <span className="k-kicker">Въпроси</span>
          <h2 id="k-faq" className="k-h2">
            Често питат
          </h2>
          <div className="k-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПОСЛЕДЕН ПРИЗИВ ── */}
      <section className="k-section" aria-labelledby="k-final" style={{ textAlign: "center" }}>
        <div className="k-wrap k-narrow">
          <h2 id="k-final" className="k-h2">
            Ще се видим в залата.
          </h2>
          <p className="k-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>
            {cap(when.day)}, {when.time}. Вземи си пуканки — останалото е наша работа.
          </p>
          <div className="k-cta-row" style={{ justifyContent: "center" }}>
            <a href="#bilet" className="k-btn k-btn--primary">
              🎟️ Вземи безплатен билет
            </a>
          </div>
        </div>
      </section>

      <KinoFooter />
      <MobileTicketCta />
      <ViewBeacon content="afish" />
    </div>
  );
}
