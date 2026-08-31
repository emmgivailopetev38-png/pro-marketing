/**
 * Лична страница за адвокат Иван Антонов (среща 31.08.2026, 13:00).
 *
 * Той сам си записа часа през cal.com и написа какво търси: „AI секретар, който
 * приема обаждания и записва час за консултация." Страницата отговаря точно на
 * това изречение и на нищо друго — не е каталог на услугите ни.
 *
 * ⚠️ НЯМА телефон и НЯМА цени в страницата — нарочно. Номерът Ивайло го дава
 * лично, а цената се казва на глас, след като обхватът е избран. Ако някой ги
 * върне тук, връща и двете най-силни карти от разговора.
 */

const STAPKI = [
  {
    n: "01",
    title: "Вдига на второто позвъняване",
    body: "В седем сутринта, в неделя, докато сте в залата. Няма звънене без отговор и няма съобщение „ще Ви върнем обаждането“.",
  },
  {
    n: "02",
    title: "Казва кой е",
    body: "„Аз съм асистентът на кантората.“ В първите секунди, всеки път. Така изисква законът от август 2026 — и точно това кара човека отсреща да говори спокойно.",
  },
  {
    n: "03",
    title: "Изслушва за какво става дума",
    body: "Пита с какво може да е полезен и записва отговора с думите на човека. Не тълкува, не подрежда, не решава дали случаят е за Вас.",
  },
  {
    n: "04",
    title: "Предлага два свободни часа",
    body: "Гледа Вашия календар — истинския, не отделен списък. Ако сте заети до четвъртък, предлага четвъртък.",
  },
  {
    n: "05",
    title: "Записва часа",
    body: "Влиза в календара Ви и в картона на човека. Ако е дал имейл, потвърждението заминава при него.",
    accent: true,
  },
  {
    n: "06",
    title: "Обобщава при Вас",
    body: "Веднага след разговора: кой се е обадил, на какъв телефон, за какво, и за кога е записан. Едно съобщение, четири реда.",
    accent: true,
  },
];

const NE_PRAVI = [
  {
    title: "Не дава правен съвет",
    body: "Нито дума за срокове, за шансове по делото или как да се процедира. На такъв въпрос отговаря едно и също: „Това адвокат Антонов ще Ви каже на консултацията.“",
  },
  {
    title: "Не казва цени",
    body: "Хонорарът е Ваш разговор с клиента. Секретарят не назовава суми и не се пазари.",
  },
  {
    title: "Не поема ангажимент от Ваше име",
    body: "Не обещава поемане на случай, не потвърждава представителство, не приема документи.",
  },
  {
    title: "Не се представя за човек",
    body: "Ако го попитат, отговаря право: автоматичен асистент е. Никой не остава с грешно впечатление, че е говорил с Вас.",
  },
  {
    title: "Не изпраща нищо на трети лица",
    body: "Без имейли до насрещни страни, без препращане на данни. Единственото, което тръгва навън, е потвърждението за часа към самия обаждащ се.",
  },
];

const TAINA = [
  {
    title: "Няма достъп до нито едно досие",
    body: "Секретарят е отделен агент и не е свързан с папките Ви, с пощата Ви, нито с клиентската Ви база. Той вижда едно нещо: кои часове са свободни. Това не е настройка, а начинът, по който е построен.",
  },
  {
    title: "Записът може да се изключи",
    body: "По подразбиране разговорът се пази, за да можете да го чуете. Ако предпочитате — изключваме записа и остават само име, телефон и записан час.",
  },
  {
    title: "Акаунтите са Ваши",
    body: "Телефонният номер и агентът се вписват на кантората, не на нас. Ако утре решите да спрете, спирате Вие — не чакате нас.",
  },
  {
    title: "Договор за обработка на лични данни",
    body: "Подписваме DPA преди пускането, с изброени доставчици и срокове на съхранение. Предполагам, че ще го прочетете по-внимателно от нас.",
  },
];

const NIVA = [
  {
    name: "След работно време",
    lead: "Покрива само часовете, в които и без това не вдигате.",
    items: [
      "Вечер, нощ, събота и неделя",
      "Записване на час в календара Ви",
      "Обобщение при Вас след всяко обаждане",
      "До 150 минути разговори месечно",
    ],
  },
  {
    name: "Приемна",
    lead: "Никой не чува свободен сигнал, по кое и да е време.",
    accent: true,
    items: [
      "Двадесет и четири часа, седем дни",
      "Картон на всеки обаждащ се: за какво, кога, какво е обещано",
      "Напомняне, ако някой не се е върнал",
      "Табло с обажданията и записаните часове",
      "До 300 минути разговори месечно",
    ],
  },
  {
    name: "Кантората на автопилот",
    lead: "Секретарят и звъни, не само вдига.",
    items: [
      "Всичко от Приемна",
      "Изходящи: потвърждаване на часове и напомняния",
      "Връзка с деловодството и с документите Ви",
      "Обучение на екипа и приоритетна поддръжка",
    ],
  },
];

const PARVITE_DNI = [
  {
    d: "Ден 1",
    t: "Слушам Вас",
    b: "Час и половина. Какво питат хората, когато звъннат. Кои случаи поемате и кои не. Как искате да звучи кантората по телефона.",
  },
  {
    d: "Ден 2 – 5",
    t: "Строим секретаря",
    b: "Гласът, езикът, границите, свързването с календара Ви. В края на петия ден Вие го чувате и казвате какво да се промени.",
  },
  {
    d: "Ден 6 – 9",
    t: "Пренасочваме телефона",
    b: "Първо само след работно време. Вие слушате записите и коригирате. Никой клиент не е опитно поле.",
  },
  {
    d: "Ден 10 – 14",
    t: "Пълен ден",
    b: "Секретарят поема и работното време. Оттук нататък е поддръжка, а не проект.",
  },
];

export default function AdvokatAntonovPage() {
  return (
    <main className="mx-auto flex w-full max-w-[980px] flex-col gap-24 px-5 py-16 sm:gap-32 sm:px-8 sm:py-24">
      {/* ── Начало ─────────────────────────── */}
      <header className="flex flex-col gap-9">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--a-brass)" }}
        >
          Лично за адвокат Иван Антонов · 31 август 2026
        </div>

        <h1
          className="text-[2.3rem] font-bold leading-[1.08] sm:text-[3.6rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Кантората Ви вдига телефона
          <br />
          <span style={{ color: "var(--a-brass)" }}>и в 21:40 в събота.</span>
        </h1>

        <p className="max-w-[64ch] text-[17px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Когато си запазихте часа, написахте с една ясна фраза какво търсите. Тази страница е отговорът
          на нея — не каталог, не общо представяне. Само това нещо, построено, и телефонът, на който
          можете да го чуете, преди да сме си стиснали ръцете.
        </p>

        <blockquote
          className="rounded-2xl border-l-2 px-6 py-5 text-[17px] italic leading-relaxed sm:text-[19px]"
          style={{
            borderColor: "var(--a-brass)",
            background: "var(--a-card-2)",
            color: "var(--a-text)",
          }}
        >
          „AI секретар, който приема обаждания и записва час за консултация.“
          <span className="mt-3 block text-[13px] not-italic" style={{ color: "var(--a-text-3)" }}>
            Вашата бележка към заявката, 29 август 2026
          </span>
        </blockquote>

      </header>

      {/* ── Защо при адвокат ───────────────── */}
      <section className="flex flex-col gap-8">
        <h2
          className="text-[1.7rem] font-bold sm:text-[2.3rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          При адвокат пропуснатото обаждане не е пропуснато обаждане
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--a-line)", background: "var(--a-card)" }}
          >
            <p className="text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
              Човекът, който Ви търси, рядко е спокоен. Починал е близък и има наследство. Дошло е писмо
              с срок. Ударили са му колата и застрахователят мълчи. Съседът е вдигнал стена там, където
              не е негово.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
              Такъв човек не оставя съобщение и не чака. Има отворени още три номера и набира следващия.
            </p>
          </div>

          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--a-line)", background: "var(--a-card)" }}
          >
            <p className="text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
              А Вие сте в залата. Или при друг клиент — и точно защото сте при него, не бива да вдигате.
              Часовете, в които не можете да отговорите, са същите часове, в които сте най-полезен.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: "var(--a-text)" }}>
              <strong>Затова не се губи обаждане.</strong> Губи се случай — и той отива при колега,
              чийто телефон е вдигнал някой.
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6 sm:p-7"
          style={{ borderColor: "var(--a-line)", background: "var(--a-card-2)" }}
        >
          <div
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--a-brass)" }}
          >
            Едно наблюдение
          </div>
          <p className="text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
            Вие вече приемате записвания онлайн — през платформа, в списък с други адвокати. Значи не
            трябва да Ви убеждавам, че запазеният час върши работа; Вие сте го решили преди мен.
            Разликата е чия е вратата. Там сте гост и се редите между колеги. Тук вратата е Вашият номер,
            Вашият календар и Вашето име — и никой не Ви показва на човека, който вече е избрал да звънне
            точно на Вас.
          </p>
        </div>
      </section>

      {/* ── Как работи ─────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2
            className="text-[1.7rem] font-bold sm:text-[2.3rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Какво се случва между звъненето и записания час
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-3)" }}>
            Шест стъпки, около деветдесет секунди. Клиентът затваря със записан час, Вие получавате
            обобщението.
          </p>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2">
          {STAPKI.map((s) => (
            <li
              key={s.n}
              className="flex flex-col gap-2 rounded-2xl border p-6"
              style={{
                borderColor: s.accent ? "var(--a-brass-dim)" : "var(--a-line)",
                background: "var(--a-card)",
              }}
            >
              <span
                className="text-[12px] font-semibold tracking-[0.18em]"
                style={{ color: "var(--a-brass)" }}
              >
                {s.n}
              </span>
              <span className="text-[17px] font-semibold" style={{ color: "var(--a-text)" }}>
                {s.title}
              </span>
              <span className="text-[15px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
                {s.body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Границите ──────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2
            className="text-[1.7rem] font-bold sm:text-[2.3rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Какво секретарят няма право да прави
          </h2>
          <p className="max-w-[64ch] text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-3)" }}>
            Списъкът отдолу е по-важен от списъка с възможностите. Отговорността по всяка казана дума е
            Ваша, не наша — затова границите са заковани в самия агент, а не оставени на добра воля.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {NE_PRAVI.map((x) => (
            <li
              key={x.title}
              className="flex flex-col gap-1 rounded-2xl border p-5 sm:flex-row sm:gap-6 sm:p-6"
              style={{ borderColor: "var(--a-line-soft)", background: "var(--a-card-2)" }}
            >
              <span
                className="shrink-0 text-[16px] font-semibold sm:w-[38%]"
                style={{ color: "var(--a-text)" }}
              >
                {x.title}
              </span>
              <span className="text-[15px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
                {x.body}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Тайна и данни ──────────────────── */}
      <section className="flex flex-col gap-8">
        <h2
          className="text-[1.7rem] font-bold sm:text-[2.3rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Адвокатска тайна и лични данни
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {TAINA.map((x) => (
            <div
              key={x.title}
              className="flex flex-col gap-2 rounded-2xl border p-6"
              style={{ borderColor: "var(--a-line)", background: "var(--a-card)" }}
            >
              <span className="text-[16.5px] font-semibold" style={{ color: "var(--a-text)" }}>
                {x.title}
              </span>
              <span className="text-[15px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
                {x.body}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Демонстрация ───────────────────── */}
      <section
        className="flex flex-col gap-6 rounded-3xl border p-7 sm:p-10"
        style={{ borderColor: "var(--a-brass-dim)", background: "var(--a-card)" }}
      >
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--a-brass)" }}
        >
          Проверката, която струва деветдесет секунди
        </div>
        <h2
          className="text-[1.7rem] font-bold sm:text-[2.2rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Не ми вярвайте. Чуйте го.
        </h2>
        <p className="max-w-[62ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Има номер, на който секретарят вдига точно сега. Дръжте се като човек, който Ви търси за
          пръв път. Опитайте се да го подлъжете да Ви даде правен съвет — най-интересното е как
          отказва. После му поискайте час.
        </p>
        <p className="max-w-[62ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Номера Ви го давам лично — за да го наберете, когато Ви е удобно, а не докато четете.
        </p>
      </section>

      {/* ── Нива ───────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2
            className="text-[1.7rem] font-bold sm:text-[2.3rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Три начина да го направим
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--a-text-3)" }}>
            Три обхвата. Кой е правилният, зависи от едно нещо — колко от телефона искате да поемем.
            Минаваме го заедно и Ви казвам числото за Вашия случай, а не ценоразпис от сайта.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {NIVA.map((n) => (
            <div
              key={n.name}
              className="flex flex-col gap-4 rounded-2xl border p-6"
              style={{
                borderColor: n.accent ? "var(--a-brass)" : "var(--a-line)",
                background: n.accent ? "var(--a-card)" : "var(--a-card-2)",
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-semibold" style={{ color: "var(--a-text)" }}>
                  {n.name}
                </span>
                <span className="text-[14px] leading-relaxed" style={{ color: "var(--a-text-3)" }}>
                  {n.lead}
                </span>
              </div>

              <ul className="flex flex-col gap-2 text-[14.5px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
                {n.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span style={{ color: "var(--a-brass-dim)" }}>—</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Първите две седмици ────────────── */}
      <section className="flex flex-col gap-8">
        <h2
          className="text-[1.7rem] font-bold sm:text-[2.3rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Първите две седмици
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARVITE_DNI.map((p) => (
            <div
              key={p.d}
              className="flex flex-col gap-2 rounded-2xl border p-5"
              style={{ borderColor: "var(--a-line-soft)", background: "var(--a-card-2)" }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--a-brass)" }}
              >
                {p.d}
              </span>
              <span className="text-[16px] font-semibold" style={{ color: "var(--a-text)" }}>
                {p.t}
              </span>
              <span className="text-[14.5px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
                {p.b}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Следваща стъпка ────────────────── */}
      <section
        className="flex flex-col gap-6 rounded-3xl border p-7 sm:p-10"
        style={{ borderColor: "var(--a-line)", background: "var(--a-card-2)" }}
      >
        <h2
          className="text-[1.7rem] font-bold sm:text-[2.2rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Следващата стъпка
        </h2>
        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Ако това, което чухте, Ви върши работа — започваме от разговора за Вашите случаи:
          какво питат хората, когато Ви търсят, и къде минава границата, отвъд която секретарят мълчи и
          Ви подава човека. Оттам до пуснат телефон са две седмици.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="mailto:office@promarketing.pw?subject=AI%20секретар%20за%20кантората"
            className="rounded-xl px-7 py-4 text-center text-[17px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--a-brass)", color: "#0a0e15" }}
          >
            Пишете ни
          </a>
        </div>
        <p className="text-[13.5px]" style={{ color: "var(--a-text-3)" }}>
          Ивайло Петев · Pro Marketing · Русе
        </p>
      </section>
    </main>
  );
}
