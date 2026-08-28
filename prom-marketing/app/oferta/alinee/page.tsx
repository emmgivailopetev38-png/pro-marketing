const NUMBERS = [
  {
    v: "2,71%",
    tone: "good" as const,
    l: "кликат върху рекламата — над средното за онлайн търговия",
  },
  {
    v: "2",
    tone: "bad" as const,
    l: "от всеки 100, стигнали до сайта, слагат нещо в количката",
  },
  {
    v: "8",
    tone: "bad" as const,
    l: "от 11 се отказват на самото плащане",
  },
  {
    v: "0%",
    tone: "bad" as const,
    l: "се връщат за втора поръчка",
  },
];

const FINDINGS = [
  {
    title: "Безплатната доставка е с 1,99 лв над цената на флакона",
    body: "Лентата отгоре обещава безплатна доставка над 90 лв. Флаконът е 88,01 лв. Всеки, който си купи един парфюм, плаща доставка — и вижда, че е бил на два лева от нея. Цената ѝ се появява чак след като вече е попълнил име, адрес, град и телефон.",
    proof: "€48,32 = €45,00 + €3,32 доставка · при две бутилки доставката отпада",
    cost: "тук се отказват 8 от 11 души — най-бързата печалба",
  },
  {
    title: "Meta вижда половината от посетителите",
    body: "Проследяването се включва едва след като човек приеме бисквитките. Панелът заема повече от половината телефонен екран и повечето хора минават покрай него, така че тези посещения остават невидими. Meta работи с половин информация и затова насочва рекламата към по-малко подходящи хора. Настройва се веднъж.",
    proof: "≈100 клика към сайта → 54 отчетени кацания",
    cost: "с пълни данни рекламата намира по-точните хора",
  },
  {
    title: "Страницата не отговаря на въпроса, който всеки си задава",
    body: "Никъде не пише колко милилитра е флаконът, каква е концентрацията и колко се задържа. Ревюта още няма, а страницата за връщане не се отваря. Човек дава 45 € за аромат, който не е помирисал — трябва му отговор на тези въпроси и спокойствие, че може да върне.",
    proof: "„мл“ в описанията: 0 от 8 · страница за връщане: 404 · ревюта: няма",
    cost: "97 от 100 разглеждат и си тръгват — има какво да ги задържи",
  },
  {
    title: "Всеки клиент купува веднъж и повече не се чува",
    body: "Деветдесет процента от поръчките са един флакон. Писмо след покупката не се изпраща, а изоставените колички са 34 и никоя не е потърсена. Парфюмерията живее от втората и третата поръчка — това са хора, които вече харесват аромата.",
    proof: "34 изоставени чекаута · 0% повторни клиенти за 30 дни",
    cost: "тук стои най-неизползваната възможност в магазина",
  },
];

const SEO_SCOPE = [
  {
    what: "Продуктови страници, пренаписани",
    pages: "8",
    words: "≈ 4 800",
    note: "мл, концентрация, трайност, повод — това, което хората пишат в Google",
  },
  {
    what: "Нови страници по категории",
    pages: "6",
    words: "≈ 4 200",
    note: "арабски · дървесни · сладки · за зимата · мъжки · дамски",
  },
  {
    what: "Статии, по две на месец",
    pages: "8",
    words: "≈ 8 800",
    note: "„колко трае парфюмът“, „как се пръска правилно“, „кой аромат за какъв повод“",
  },
  {
    what: "Техническо — заглавия, описания, структурирани данни",
    pages: "целият сайт",
    words: "—",
    note: "цената и наличността излизат под резултата в Google",
  },
];

const ROADMAP = [
  {
    month: "Месец 1",
    when: "септември",
    title: "Спираме течовете",
    items: [
      "Преструктурата на магазина — проследяване, мл, политики, чекаут",
      "8-те продуктови страници, пренаписани за търсене и за продажба",
      "Техническото SEO ляга наведнъж: заглавия, описания, структурирани данни",
      "Ревютата от Instagram влизат в сайта",
      "Рекламата продължава да върви, но вече над поправена фуния",
    ],
    marker: "Първите поръчки от същия трафик",
  },
  {
    month: "Месец 2",
    when: "октомври",
    title: "Вдигаме стойността на поръчката",
    items: [
      "Комплект от два флакона и комплект за опознаване — влизат в сайта и в рекламата",
      "Писмата тръгват: изоставена количка, след покупка, покана за втори аромат",
      "Първите 4 категорийни страници",
      "Две статии",
      "Динамични реклами по каталога към хора, вече гледали аромата",
    ],
    marker: "Средната поръчка тръгва нагоре",
  },
  {
    month: "Месец 3",
    when: "ноември",
    title: "Google започва да носи",
    items: [
      "Останалите категорийни страници и още две статии",
      "Първите позиции по нотки и поводи — трафик, за който не се плаща на клик",
      "Рекламата се пренасочва към това, което вече печели",
      "Сегментирани кампании към клиентската база за подаръчния сезон",
    ],
    marker: "Първи безплатни посетители от търсене",
  },
  {
    month: "Месец 4",
    when: "декември",
    title: "Сезонът, за който всичко дотук е подготовка",
    items: [
      "Декември е месецът, в който парфюмът се купува за подарък",
      "Комплектите вече са готови, ревютата са налице, доставката не изненадва",
      "Google носи хора, които не са видели нито една реклама",
      "Ремаркетинг към всички, пипали количката през есента",
    ],
    marker: "Най-силният месец в годината, посрещнат подготвен",
    peak: true,
  },
];

const TALLY = [
  ["24", "страници, написани или пренаписани"],
  ["≈ 18 000", "думи за Google"],
  ["≈ 480", "видеа за социалните мрежи"],
  ["5", "автоматични писма, които работят сами"],
  ["4", "месечни отчета с числата"],
];

const CHANGES = [
  "Рекламата се учи от всички посетители и намира по-точните хора",
  "Един флакон покрива безплатната доставка",
  "Милилитри, трайност и ревюта стоят на страницата, преди някой да е попитал",
  "Всяка изоставена количка се потърсва сама",
  "Има повод за втора и трета поръчка",
  "Google носи хора всеки ден, без плащане на клик",
  "Декември идва с готови комплекти, ревюта и позиции в Google",
];

const TIERS = [
  {
    tag: "Пакет 1",
    name: "Основа",
    once: "1 400 €",
    onceNote: "преструктура · 5 работни дни",
    monthly: "месечно остава 300 €",
    pick: false,
    items: [
      "Проследяването заработва пълноценно — Meta вижда всички посетители",
      "Милилитри, концентрация и трайност на всичките 8 аромата",
      "Страници за доставка и връщане",
      "Автоматични писма при изоставена количка",
      "Правописните грешки, включително на чекаута",
    ],
    when: "Готово до 5 септември",
  },
  {
    tag: "Препоръчвам",
    name: "Растеж",
    once: "2 900 €",
    onceNote: "пълна преструктура",
    monthly: "900 €/мес · 300 съдържание и реклами · 300 SEO · 300 оптимизация",
    pick: true,
    items: [
      "Цялата Основа",
      "SEO — от третия месец Google започва да носи хора",
      "Месечна оптимизация — сайтът се подобрява по числа, не по усет",
      "Ревюта на сайта — внасям реалните отзиви от Instagram",
      "Комплект от два флакона и комплект за опознаване",
      "Писма след покупка, за да има втора и трета поръчка",
      "Продуктовите страници пренаписани да продават, не да описват",
    ],
    when: "Готово до 20 септември",
  },
  {
    tag: "Пакет 3",
    name: "Пълна машина",
    once: "4 900 €",
    onceNote: "преструктура и надграждане",
    monthly: "1 200 €/мес · Растеж плюс реклами по каталог и кампании",
    pick: false,
    items: [
      "Целият Растеж",
      "Плащане с карта до наложения платеж",
      "Динамични реклами по каталога към хора, вече гледали аромата",
      "Сегментирани кампании към цялата клиентска база",
      "Всеки месец нов тест на страница, цена или оферта",
    ],
    when: "Първи резултати до 30 дни",
  },
];

const EXPECT = [
  ["Посетители, стигнали до количката", "4,0%", "7,6 – 9,9%"],
  ["Посетители, които поръчват", "1,09%", "2,3 – 2,9%"],
  ["Средна поръчка", "32,50 €", "цел 60 €+"],
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: "var(--a-text-3)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div
      className="flex items-baseline gap-4 border-b pb-3"
      style={{ borderColor: "var(--a-line)" }}
    >
      <Eyebrow>{n}</Eyebrow>
      <h2
        className="text-[1.45rem] font-bold leading-tight sm:text-[1.9rem]"
        style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
      >
        {title}
      </h2>
    </div>
  );
}

export default function AlineeOfferPage() {
  return (
    <main
      className="mx-auto flex w-full max-w-[1040px] flex-col gap-16 px-5 pb-28 pt-14 sm:px-8 sm:pt-20"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Заглавна ───────────────────────────────── */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ background: "rgba(223,169,74,0.12)", color: "var(--a-amber)" }}
          >
            За Alineé Fragrances
          </span>
          <span className="text-[13px]" style={{ color: "var(--a-text-3)" }}>
            Alineé Fragrances · 28 август 2026
          </span>
        </div>

        <h1
          className="text-[2.1rem] font-bold leading-[1.1] sm:text-[3.2rem]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Интересът вече го има.
          <br />
          <span style={{ color: "var(--a-amber)" }}>Остава пътят до количката.</span>
        </h1>

        <p
          className="max-w-[58ch] text-[1.05rem] leading-relaxed sm:text-[1.15rem]"
          style={{ color: "var(--a-text-2)" }}
        >
          Прегледахме рекламния акаунт, магазина и поръчките. Рекламата работи — 2,71% от хората
          кликат, което е над средното. Спъването е след клика: от сто души, стигнали до сайта,
          двама слагат нещо в количката. Ето къде се губят и какво предлагаме.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="#paketi"
            className="rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--a-amber)", color: "#0d0a07" }}
          >
            Виж пакетите
          </a>
          <a
            href="/oferta/alinee/analiz-i-oferta.pdf"
            download="Alinee-analiz-i-oferta.pdf"
            className="rounded-lg border px-5 py-3 text-[15px] font-semibold transition-colors"
            style={{ borderColor: "var(--a-line)", color: "var(--a-text)" }}
          >
            Свали анализа (PDF)
          </a>
        </div>
      </header>

      {/* ── Числата ────────────────────────────────── */}
      <section
        className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4"
        style={{ borderColor: "var(--a-line)", background: "var(--a-line-soft)" }}
      >
        {NUMBERS.map((n) => (
          <div
            key={n.l}
            className="flex flex-col gap-2 p-6"
            style={{ background: "var(--a-deep)" }}
          >
            <span
              className="text-[2.4rem] font-bold leading-none"
              style={{
                fontFamily: "var(--font-display)",
                color: n.tone === "good" ? "var(--a-green)" : "var(--a-alert)",
              }}
            >
              {n.v}
            </span>
            <span className="text-[13.5px] leading-snug" style={{ color: "var(--a-text-3)" }}>
              {n.l}
            </span>
          </div>
        ))}
      </section>

      {/* ── Цената на изчакването ──────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="01" title="Колко има за печелене" />

        <div
          className="rounded-xl border p-7 sm:p-9"
          style={{ borderColor: "var(--a-line)", background: "var(--a-card)" }}
        >
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex flex-col gap-1">
              <Eyebrow>Сега</Eyebrow>
              <span
                className="text-[2.6rem] font-bold leading-none"
                style={{ fontFamily: "var(--font-display)", color: "var(--a-alert)" }}
              >
                11
              </span>
              <span className="text-[13.5px]" style={{ color: "var(--a-text-3)" }}>
                поръчки на 1000 посетители
              </span>
            </div>

            <div
              className="hidden h-16 w-px sm:block"
              style={{ background: "var(--a-line)" }}
              aria-hidden
            />

            <div className="flex flex-col gap-1">
              <Eyebrow>Магазинът вече го е правил</Eyebrow>
              <span
                className="text-[2.6rem] font-bold leading-none"
                style={{ fontFamily: "var(--font-display)", color: "var(--a-green)" }}
              >
                23
              </span>
              <span className="text-[13.5px]" style={{ color: "var(--a-text-3)" }}>
                поръчки на същите 1000 посетители
              </span>
            </div>

          </div>

          <p
            className="mt-7 max-w-[64ch] text-[15.5px] leading-relaxed"
            style={{ color: "var(--a-text-2)" }}
          >
            Магазинът е правил 2,3% поръчки, когато рекламата е била насочена към купувачи. В
            момента прави 1,09%. Това не е прогноза и не е обещание — двете числа са на един и същи
            магазин. Разликата се прибира от същия трафик, без да се харчи и лев повече за реклама.
          </p>
        </div>
      </section>

      {/* ── Находките ──────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="02" title="Къде се губят хората по пътя" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Разгледахме магазина от телефон, минахме през чекаута, сверихме какво отчита Meta и какво
          пишат поръчките. Четири неща обясняват почти цялата разлика — и четирите се оправят.
        </p>

        <div className="flex flex-col gap-4">
          {FINDINGS.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border p-6 sm:p-7"
              style={{ borderColor: "var(--a-line)", background: "var(--a-deep)" }}
            >
              <h3
                className="text-[1.15rem] font-bold leading-snug sm:text-[1.28rem]"
                style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
              >
                {f.title}
              </h3>
              <p
                className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed"
                style={{ color: "var(--a-text-2)" }}
              >
                {f.body}
              </p>
              <p
                className="mt-4 text-[12.5px] leading-relaxed"
                style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
              >
                {f.proof}
              </p>
              <span
                className="mt-4 inline-block rounded px-3 py-1.5 text-[12px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(224,138,108,0.11)",
                  color: "var(--a-alert)",
                }}
              >
                {f.cost}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* ── Безплатното ────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="03" title="Две от тях поемаме веднага" />

        <div
          className="rounded-xl border-l-[3px] border-y border-r p-7"
          style={{
            borderLeftColor: "var(--a-green)",
            borderTopColor: "var(--a-line)",
            borderRightColor: "var(--a-line)",
            borderBottomColor: "var(--a-line)",
            background: "var(--a-card)",
          }}
        >
          <h3
            className="text-[1.2rem] font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
          >
            Прагът и панелът
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {[
              "Свалям прага за безплатна доставка, за да покрива един флакон.",
              "Настройвам прозорчето за отстъпката да не пада върху човека още с влизането.",
            ].map((t) => (
              <li
                key={t}
                className="relative pl-5 text-[15.5px] leading-relaxed"
                style={{ color: "var(--a-text-2)" }}
              >
                <span className="absolute left-0" style={{ color: "var(--a-green)" }}>
                  —
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p
            className="mt-5 max-w-[64ch] text-[15.5px] leading-relaxed"
            style={{ color: "var(--a-text-2)" }}
          >
            Отнемат петнадесет минути и не искат нито дизайнер, нито програмист. Рекламите вече
            вървят, а тези две настройки решават колко от тях се връща обратно — затова ги поемаме
            за наша сметка, каквото и да е решението за останалото. Нужен е само достъп до
            настройките на темата.
          </p>
        </div>
      </section>

      {/* ── Google ─────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="04" title="Google още не носи посетители" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Днес целият трафик на магазина е платен. Това има едно неприятно свойство — спре ли
          рекламата, спира и всичко останало. Видяхме го черно на бяло: през юли от Facebook са
          дошли <strong style={{ color: "var(--a-text)" }}>8 900 посещения</strong>, през август{" "}
          <strong style={{ color: "var(--a-text)" }}>61</strong>. От Google в момента не идва нито
          една поръчка.
        </p>

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Парфюмерията е категория, в която хората търсят сами и всеки ден — „трайни арабски
          парфюми“, „парфюм с нотки на уд“, „подходящ за зимата“. Тези хора вече искат да купят.
          Разликата е, че за тях не се плаща на клик.
        </p>

        <div
          className="rounded-xl border-l-[3px] border-y border-r p-7"
          style={{
            borderLeftColor: "var(--a-amber)",
            borderTopColor: "var(--a-line)",
            borderRightColor: "var(--a-line)",
            borderBottomColor: "var(--a-line)",
            background: "var(--a-card)",
          }}
        >
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--a-amber)" }}
          >
            Платеният трафик е наем · търсенето е собственост
          </p>
          <h3
            className="mt-3 text-[1.2rem] font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
          >
            SEO · 300 € на месец
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {[
              "Заглавия и описания на 8-те аромата, написани за това, което хората наистина търсят",
              "Цената и наличността да излизат направо в Google, под резултата",
              "Отделни страници по категории вместо един общ списък с продукти",
              "Две статии месечно по реални търсения, които водят към конкретен аромат",
              "Месечен отчет с позициите и с трафика, който вече не се плаща",
            ].map((t) => (
              <li
                key={t}
                className="relative pl-5 text-[15.5px] leading-relaxed"
                style={{ color: "var(--a-text-2)" }}
              >
                <span className="absolute left-0" style={{ color: "var(--a-amber)" }}>
                  —
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p
            className="mt-5 max-w-[64ch] text-[15.5px] leading-relaxed"
            style={{ color: "var(--a-text-2)" }}
          >
            Честно за сроковете:{" "}
            <strong style={{ color: "var(--a-text)" }}>SEO не е бързо.</strong> Първите движения се
            виждат към третия месец, същинското — към шестия. Затова е добре да тръгне сега, докато
            рекламата носи продажбите, а не след половин година, когато вече ще е нужно.
          </p>
        </div>

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          SEO-то върви в двойка с второ нещо на същата цена —{" "}
          <strong style={{ color: "var(--a-text)" }}>месечната оптимизация на магазина</strong>.
          Едното води хората, другото ги превръща в поръчки. Смисъл има само заедно: трафик към
          сайт, който не продава, е похарчен трафик, а перфектен сайт без хора в него е витрина в
          задънена улица.
        </p>
      </section>

      {/* ── SEO в числа ────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="05" title="SEO-то в числа, за четири месеца" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          За да не е „ще правим SEO“ — ето точно колко страници и колко думи влизат в сайта, и за
          какво са написани.
        </p>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--a-line)" }}>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr style={{ background: "var(--a-card)" }}>
                {["Какво", "Страници", "Думи", "За какво са"].map((h) => (
                  <th
                    key={h}
                    className="border-b px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: "var(--a-line)",
                      color: "var(--a-text-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: "var(--a-deep)" }}>
              {SEO_SCOPE.map((r) => (
                <tr key={r.what}>
                  <td
                    className="px-5 py-4 text-[15px]"
                    style={{ borderBottom: "1px solid var(--a-line-soft)", color: "var(--a-text)" }}
                  >
                    {r.what}
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-4 text-[15px]"
                    style={{
                      borderBottom: "1px solid var(--a-line-soft)",
                      color: "var(--a-amber)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {r.pages}
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-4 text-[15px]"
                    style={{
                      borderBottom: "1px solid var(--a-line-soft)",
                      color: "var(--a-amber)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {r.words}
                  </td>
                  <td
                    className="px-5 py-4 text-[13.5px] leading-snug"
                    style={{
                      borderBottom: "1px solid var(--a-line-soft)",
                      color: "var(--a-text-3)",
                    }}
                  >
                    {r.note}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "var(--a-card)" }}>
                <td className="px-5 py-4 text-[15px] font-semibold" style={{ color: "var(--a-text)" }}>
                  Общо
                </td>
                <td
                  className="whitespace-nowrap px-5 py-4 text-[16px] font-semibold"
                  style={{ color: "var(--a-green)", fontFamily: "var(--font-mono)" }}
                >
                  24
                </td>
                <td
                  className="whitespace-nowrap px-5 py-4 text-[16px] font-semibold"
                  style={{ color: "var(--a-green)", fontFamily: "var(--font-mono)" }}
                >
                  ≈ 18 000
                </td>
                <td className="px-5 py-4 text-[13.5px]" style={{ color: "var(--a-text-3)" }}>
                  всичко върху магазина, нищо под наем
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      {/* ── Планът месец по месец ──────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="06" title="Планът, месец по месец" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Четири месеца, всеки с една задача. Не се прави всичко наведнъж — прави се това, което
          подготвя следващото.
        </p>

        <div className="flex flex-col gap-4">
          {ROADMAP.map((m) => (
            <article
              key={m.month}
              className="rounded-xl border p-6 sm:p-7"
              style={{
                borderColor: m.peak ? "var(--a-amber)" : "var(--a-line)",
                background: m.peak ? "var(--a-card)" : "var(--a-deep)",
              }}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span
                  className="rounded px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                  style={
                    m.peak
                      ? {
                          background: "var(--a-amber)",
                          color: "#0d0a07",
                          fontFamily: "var(--font-mono)",
                        }
                      : {
                          border: "1px solid var(--a-line)",
                          color: "var(--a-text-3)",
                          fontFamily: "var(--font-mono)",
                        }
                  }
                >
                  {m.month}
                </span>
                <span
                  className="text-[12.5px]"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
                >
                  {m.when}
                </span>
              </div>

              <h3
                className="mt-3 text-[1.2rem] font-bold leading-snug sm:text-[1.35rem]"
                style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
              >
                {m.title}
              </h3>

              <ul className="mt-4 flex flex-col gap-2.5">
                {m.items.map((it) => (
                  <li
                    key={it}
                    className="relative pl-5 text-[15px] leading-relaxed"
                    style={{ color: "var(--a-text-2)" }}
                  >
                    <span className="absolute left-0" style={{ color: "var(--a-amber-dim)" }}>
                      —
                    </span>
                    {it}
                  </li>
                ))}
              </ul>

              <span
                className="mt-5 inline-block rounded px-3 py-1.5 text-[12.5px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: m.peak ? "rgba(223,169,74,0.14)" : "rgba(134,179,146,0.11)",
                  color: m.peak ? "var(--a-amber)" : "var(--a-green)",
                }}
              >
                {m.marker}
              </span>
            </article>
          ))}
        </div>

        <div
          className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-5"
          style={{ borderColor: "var(--a-line)", background: "var(--a-line-soft)" }}
        >
          {TALLY.map(([v, l]) => (
            <div
              key={l}
              className="flex flex-col gap-1.5 p-5"
              style={{ background: "var(--a-deep)" }}
            >
              <span
                className="text-[1.5rem] font-bold leading-none"
                style={{ fontFamily: "var(--font-display)", color: "var(--a-amber)" }}
              >
                {v}
              </span>
              <span className="text-[12.5px] leading-snug" style={{ color: "var(--a-text-3)" }}>
                {l}
              </span>
            </div>
          ))}
        </div>

        <p
          className="text-[13.5px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
        >
          Обемите са за пакет Растеж, за четири месеца.
        </p>
      </section>

      {/* ── Какво се променя ──────────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="07" title="Какво се променя" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Ето как изглежда магазинът в края на четирите месеца.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CHANGES.map((c, i) => {
            const last = i === CHANGES.length - 1;
            return (
              <div
                key={c}
                className="flex items-start gap-3 rounded-xl border p-5"
                style={{
                  borderColor: last ? "var(--a-amber)" : "var(--a-line)",
                  background: last ? "var(--a-card)" : "var(--a-deep)",
                }}
              >
                <span
                  className="mt-0.5 shrink-0 text-[15px]"
                  style={{ color: last ? "var(--a-amber)" : "var(--a-green)" }}
                  aria-hidden
                >
                  ✓
                </span>
                <span
                  className="text-[15.5px] leading-snug"
                  style={{
                    color: last ? "var(--a-amber)" : "var(--a-text)",
                    fontWeight: last ? 600 : 400,
                  }}
                >
                  {c}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Пакетите ───────────────────────────────── */}
      <section id="paketi" className="flex flex-col gap-6 scroll-mt-8">
        <SectionHead n="08" title="Трите пакета" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Всеки пакет стъпва на едно и също:{" "}
          <strong style={{ color: "var(--a-text)" }}>първоначална преструктура на магазина</strong>,
          която се плаща веднъж, и месечно, което го поддържа жив. Разликата е докъде стига
          преструктурата и колко крака има месечното.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="flex h-full flex-col gap-4 rounded-xl border p-6"
              style={{
                borderColor: t.pick ? "var(--a-amber)" : "var(--a-line)",
                borderWidth: t.pick ? 1.5 : 1,
                background: t.pick ? "var(--a-card)" : "var(--a-deep)",
              }}
            >
              <span
                className="self-start rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={
                  t.pick
                    ? { background: "var(--a-amber)", color: "#0d0a07", fontFamily: "var(--font-mono)" }
                    : {
                        border: "1px solid var(--a-line)",
                        color: "var(--a-text-3)",
                        fontFamily: "var(--font-mono)",
                      }
                }
              >
                {t.tag}
              </span>

              <h3
                className="text-[1.6rem] font-bold leading-none"
                style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
              >
                {t.name}
              </h3>

              <div
                className="flex flex-col gap-1 border-b pb-4"
                style={{ borderColor: "var(--a-line-soft)" }}
              >
                <span
                  className="text-[1.6rem] font-bold leading-none"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--a-text)" }}
                >
                  {t.once}
                </span>
                <span
                  className="text-[12.5px]"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
                >
                  {t.onceNote}
                </span>
                <span
                  className="mt-1 text-[12.5px] leading-snug"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: t.pick ? "var(--a-amber)" : "var(--a-text-3)",
                  }}
                >
                  {t.monthly}
                </span>
              </div>

              <ul className="flex flex-col gap-2.5">
                {t.items.map((it) => {
                  const inherited = /^(Цялата|Целият)\b/.test(it);
                  return (
                  <li
                    key={it}
                    className="relative pl-[18px] text-[14.5px] leading-snug"
                    style={{
                      color: inherited ? "var(--a-text-3)" : "var(--a-text-2)",
                      fontStyle: inherited ? "italic" : "normal",
                    }}
                  >
                    <span className="absolute left-0" style={{ color: "var(--a-amber-dim)" }}>
                      —
                    </span>
                    {it}
                  </li>
                  );
                })}
              </ul>

              <span
                className="mt-auto pt-3 text-[11.5px]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
              >
                {t.when}
              </span>
            </div>
          ))}
        </div>

        <p
          className="text-[13.5px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
        >
          Цените са без ДДС. Месечното е с ангажимент 6 месеца.
        </p>
      </section>

      {/* ── Очакванията ────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <SectionHead n="09" title="Какво очакваме — по числата на магазина" />

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Не обещаваме проценти от нашата глава. Магазинът вече е постигал по-добро от сегашното,
          когато рекламата е била насочена към купувачи. Целта е да се върне там и да се задържи.
        </p>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--a-line)" }}>
          <table className="w-full min-w-[460px] border-collapse">
            <thead>
              <tr style={{ background: "var(--a-card)" }}>
                {["Показател", "Сега", "Магазинът вече е правил"].map((h) => (
                  <th
                    key={h}
                    className="border-b px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: "var(--a-line)",
                      color: "var(--a-text-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: "var(--a-deep)" }}>
              {EXPECT.map(([k, now, was], i) => (
                <tr key={k}>
                  <td
                    className="px-5 py-3.5 text-[15px]"
                    style={{
                      borderBottom:
                        i === EXPECT.length - 1 ? "none" : "1px solid var(--a-line-soft)",
                      color: "var(--a-text-2)",
                    }}
                  >
                    {k}
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-3.5 text-[15px]"
                    style={{
                      borderBottom:
                        i === EXPECT.length - 1 ? "none" : "1px solid var(--a-line-soft)",
                      color: "var(--a-alert)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {now}
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-3.5 text-[15px]"
                    style={{
                      borderBottom:
                        i === EXPECT.length - 1 ? "none" : "1px solid var(--a-line-soft)",
                      color: "var(--a-green)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {was}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="max-w-[64ch] text-[16px] leading-relaxed" style={{ color: "var(--a-text-2)" }}>
          Средната поръчка е числото с най-голям ефект. Днес почти всяка поръчка е един флакон;
          комплектите и предложението за втори аромат работят точно върху него.
        </p>
      </section>

      {/* ── Финал ──────────────────────────────────── */}
      <section
        className="rounded-2xl border p-8 sm:p-10"
        style={{ borderColor: "var(--a-amber-dim)", background: "var(--a-card)" }}
      >
        <h3
          className="text-[1.7rem] font-bold leading-tight sm:text-[2.1rem]"
          style={{ fontFamily: "var(--font-display)", color: "var(--a-text)" }}
        >
          Следваща стъпка
        </h3>
        <p
          className="mt-4 max-w-[56ch] text-[16px] leading-relaxed"
          style={{ color: "var(--a-text-2)" }}
        >
          Ако някой от пакетите върши работа, кажете и започваме в понеделник. А ако е по-удобно
          първо да минем през числата заедно — двадесет минути на телефона стигат, за да се види
          откъде идва всяка цифра тук.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="tel:+359877399963"
            className="rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--a-amber)", color: "#0d0a07" }}
          >
            +359 877 399 963
          </a>
          <a
            href="mailto:emmgivailopetev38@gmail.com?subject=Alineé · оферта"
            className="rounded-lg border px-5 py-3 text-[15px] font-semibold"
            style={{ borderColor: "var(--a-line)", color: "var(--a-text)" }}
          >
            emmgivailopetev38@gmail.com
          </a>
          <a
            href="/oferta/alinee/analiz-i-oferta.pdf"
            download="Alinee-analiz-i-oferta.pdf"
            className="rounded-lg border px-5 py-3 text-[15px] font-semibold"
            style={{ borderColor: "var(--a-line)", color: "var(--a-text)" }}
          >
            Свали анализа (PDF)
          </a>
        </div>

        <p
          className="mt-8 border-t pt-5 text-[14px]"
          style={{ borderColor: "var(--a-line-soft)", color: "var(--a-text-3)" }}
        >
          Ивайло Петев · Pro Marketing LTD
        </p>
      </section>

      <footer
        className="flex flex-wrap gap-x-7 gap-y-1.5 text-[12.5px]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--a-text-3)" }}
      >
        <span>Числата са от рекламния акаунт и от Shopify за 29.07 – 27.08.2026</span>
        <span>Цените са без ДДС</span>
      </footer>
    </main>
  );
}
