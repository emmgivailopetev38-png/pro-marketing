import DemoZapisvane from "./DemoZapisvane";

/**
 * Лична страница за Даниела Колева — Център Сибила, Варна.
 * Среща 01.09.2026, 67 минути. Тя отложи решението за около два месеца.
 *
 * Затова страницата НЕ е нова продажба и не притиска. Тя е подаръкът, който
 * ѝ беше обещан на срещата: да види собствената си система, преди да плати
 * за нея. Числата от офертата стоят долу, защото тя сама каза, че ще
 * преглежда финансите си — без тях няма какво да смята.
 *
 * Всички услуги, цени, работно време, адресът и отзивите са ИСТИНСКИТЕ ѝ,
 * свалени от профила ѝ в Studio24 на 01.09.2026.
 */

const ZAGUBI = [
  {
    n: "01",
    title: "166 отзива, които не са ваши",
    body: "4.8 от 166 души. Двайсет години работа стоят там. В деня, в който напуснете платформата, те остават при нея — не при вас. Никой не може да ги пренесе, защото не са ваши.",
  },
  {
    n: "02",
    title: "Видимостта ви я решава чужд алгоритъм",
    body: "Вие сама казахте, че след промяна в алгоритъма са ви свалили видимостта. Не сте направили нищо различно — просто са преместили правилата. Утре пак могат.",
  },
  {
    n: "03",
    title: "Клиентите ви са в чужд списък",
    body: "Кой е идвал, кога, за какво и кога му е време пак — това е най-ценното, което имате. Днес то живее при някой друг и вие го гледате през прозорче.",
  },
];

const POLZI = [
  ["Записване на вашия домейн", "Клиентът влиза в сайта на Център Сибила, а не в каталог, където до вас стоят още четирийсет салона."],
  ["Напомняния, които тръгват сами", "Ден преди часа. Оттук идва спирането на неявяванията — не от строгост, а от навреме."],
  ["Картон на всеки клиент", "Какво е правил, кога, с какво, кога му е време пак. При терапевтичния педикюр това е и медицинска история, не само сметка."],
  ["Телефонен агент", "Вдига, когато вие сте с клиент. Записва час и ви оставя четири реда: кой, за какво, кога."],
  ["Вашите отзиви — при вас", "След всеки час системата пита клиента как е минало и събира отзивите на ваша страница. Този път те остават ваши."],
  ["Справки с един въпрос", "„Колко терапевтични педикюра направих този месец“ — питате на глас, отговорът идва веднага."],
];

export default function SibilaPage() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "56px 22px 90px" }}>
      {/* ── шапка ─────────────────────────────────────────────── */}
      <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#b0724f", margin: "0 0 14px", fontWeight: 600 }}>
        Подарък за Даниела · Център Сибила
      </p>
      <h1
        style={{
          fontFamily: "var(--font-editorial), serif",
          fontSize: "clamp(34px, 6vw, 54px)",
          lineHeight: 1.1,
          margin: "0 0 20px",
          color: "#2c211c",
          fontWeight: 500,
        }}
      >
        Обещах ви да го видите, преди да решите.
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5e4b42", margin: "0 0 14px", maxWidth: 640 }}>
        Това не е оферта и не е нищо, което трябва да правите сега. Вие казахте, че ще се върнете
        към темата след около два месеца, и това е напълно нормално — графикът ви е пълен.
      </p>
      <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5e4b42", margin: "0 0 40px", maxWidth: 640 }}>
        Дотогава исках просто да имате пред очите си как изглежда системата, когато е <b>ваша</b>.
        Долу е жива — пипнете я.
      </p>

      {/* ── живото демо ───────────────────────────────────────── */}
      <DemoZapisvane />

      <p style={{ fontSize: 13.5, color: "#9b8579", margin: "14px 0 56px", lineHeight: 1.6 }}>
        Услугите, цените, времетраенето и работното време горе са вашите истински — свалих ги от
        профила ви, за да не гледате измислен пример.
      </p>

      {/* ── какво ви струва чуждата платформа ─────────────────── */}
      <h2
        style={{
          fontFamily: "var(--font-editorial), serif",
          fontSize: "clamp(26px, 4vw, 36px)",
          margin: "0 0 10px",
          color: "#2c211c",
          fontWeight: 500,
        }}
      >
        Трите неща, които наемът ви струва
      </h2>
      <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "#5e4b42", margin: "0 0 26px", maxWidth: 640 }}>
        Вие вече сте решили да напуснете платформата. Това са причините, заради които решението е
        правилно — и заради които всеки месец отлагане струва малко повече.
      </p>
      <div style={{ display: "grid", gap: 14, marginBottom: 52 }}>
        {ZAGUBI.map((z) => (
          <div
            key={z.n}
            style={{
              display: "flex",
              gap: 18,
              padding: "20px 22px",
              borderRadius: 16,
              border: "1px solid var(--color-border-default)",
              background: "#fff",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-editorial), serif",
                fontSize: 30,
                color: "#c69a86",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {z.n}
            </span>
            <span>
              <span style={{ display: "block", fontWeight: 700, fontSize: 18, color: "#2c211c", marginBottom: 6 }}>
                {z.title}
              </span>
              <span style={{ fontSize: 16, lineHeight: 1.62, color: "#5e4b42" }}>{z.body}</span>
            </span>
          </div>
        ))}
      </div>

      {/* ── находката ─────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(176,114,79,0.45)",
          background: "#fdf3ec",
          padding: "22px 24px",
          marginBottom: 52,
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#8c4a3f", fontSize: 17 }}>
          Между другото — проверете си курсовете
        </p>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "#5e4b42" }}>
          В профила ви обучението за 2 часа излиза <b>1023 €</b>, за 4 часа — 2045 €, и така нагоре.
          Прилича на грешка при превалутирането, а не на вашата цена. Ако е така, всеки, който е
          отворил тази страница, е видял четирицифрено число и е затворил. Струва си да се погледне,
          независимо какво ще решите за останалото.
        </p>
      </div>

      {/* ── какво влиза ───────────────────────────────────────── */}
      <h2
        style={{
          fontFamily: "var(--font-editorial), serif",
          fontSize: "clamp(26px, 4vw, 36px)",
          margin: "0 0 24px",
          color: "#2c211c",
          fontWeight: 500,
        }}
      >
        Какво получавате
      </h2>
      <div style={{ display: "grid", gap: 12, marginBottom: 52 }}>
        {POLZI.map(([zag, txt]) => (
          <div
            key={zag}
            style={{
              padding: "17px 20px",
              borderRadius: 14,
              background: "#fff",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <span style={{ display: "block", fontWeight: 700, color: "#2c211c", fontSize: 16.5, marginBottom: 4 }}>
              {zag}
            </span>
            <span style={{ fontSize: 15.5, lineHeight: 1.6, color: "#5e4b42" }}>{txt}</span>
          </div>
        ))}
      </div>

      {/* ── числата ───────────────────────────────────────────── */}
      <h2
        style={{
          fontFamily: "var(--font-editorial), serif",
          fontSize: "clamp(26px, 4vw, 36px)",
          margin: "0 0 10px",
          color: "#2c211c",
          fontWeight: 500,
        }}
      >
        Числата, за да имате какво да сметнете
      </h2>
      <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "#5e4b42", margin: "0 0 22px", maxWidth: 640 }}>
        Оставям ги, защото вие сама казахте, че ще преглеждате финансите си. Това са същите числа
        от разговора — нищо не се е променило и няма да се променя, докато решавате.
      </p>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--color-border-bright)",
          background: "#fff",
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        {[
          ["Изграждане на системата + първи месец реклами", "3 000 €", true],
          ["Поддръжка и хостинг след това", "100 € / месец", false],
          ["Управление на рекламите след това", "300 € / месец", false],
          ["Само реклама, без системата", "300 € еднократно", false],
        ].map(([ime, cena, glavno]) => (
          <div
            key={ime as string}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              padding: "16px 20px",
              borderTop: "1px solid var(--color-border-default)",
              background: glavno ? "#faf1ea" : "#fff",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 16, color: "#2c211c", fontWeight: glavno ? 700 : 500 }}>{ime}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#8c4a3f", whiteSpace: "nowrap" }}>{cena}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "#9b8579", margin: "0 0 52px" }}>
        Рекламният бюджет остава изцяло ваш и се плаща директно на Meta — около 10–20 € на ден за
        салона. Ние го управляваме, но парите минават през вашата карта, не през нас.
      </p>

      {/* ── краят ─────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 18,
          background: "linear-gradient(120deg, #8c4a3f, #b0724f)",
          color: "#fdfaf7",
          padding: "30px 28px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-editorial), serif",
            fontSize: "clamp(22px, 3.4vw, 30px)",
            margin: "0 0 14px",
            lineHeight: 1.3,
          }}
        >
          Няма срок и няма да ви търся всяка седмица.
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.65, margin: "0 0 12px", opacity: 0.94 }}>
          Разбрахме се да се чуем след около два месеца, когато графикът ви се освободи, и точно
          това ще направя. Дотогава страницата стои тук — отваряйте я, когато ви е удобно.
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.65, margin: "0 0 12px", opacity: 0.94 }}>
          Ако през това време ви хрумне въпрос или искате да видите нещо конкретно от вашия салон
          вътре — просто ми пишете. Няма да ви струва нищо и не ви ангажира с нищо.
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
          Ивайло Петев · Pro Marketing LTD · +359 877 399 963
        </p>
      </div>
    </main>
  );
}
