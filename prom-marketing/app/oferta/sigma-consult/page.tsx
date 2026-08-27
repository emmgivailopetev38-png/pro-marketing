import MiniDemo from "./MiniDemo";
const STEPS = [
  {
    n: "01",
    title: "Казвате какво искате",
    body: "Три неща и толкова: за коя фирма е видеото, каква е темата и колко секунди да бъде. Без брифове, без формуляри.",
  },
  {
    n: "02",
    title: "Асистентът взима вашия звук",
    body: "Вашата музика и вашият глас — такива, каквито са. Не се пипат, не се заменят със синтетичен говор, не се композира нищо ново отгоре.",
  },
  {
    n: "03",
    title: "Вашите кадри влизат наравно",
    body: "Каквото сте заснели сами, се качва и се ползва редом с генерираното. Режете началото и края, влачите клиповете и ги разменяте по местата им, докато редът стане какъвто го искате.",
  },
  {
    n: "04",
    title: "Картината се сглобява под звука",
    body: "Липсващото се генерира спрямо ритъма и спрямо това, което гласът казва в конкретната секунда. Звукът води, картината следва.",
  },
  {
    n: "05",
    title: "Питате го каквото се сетите",
    body: "В същия чат: коя тема върви сега, защо това видео е тръгнало, а онова не, кой е добрият начален кадър, кога да се публикува. Отговаря на български и помни какво сте правили досега.",
    accent: true,
  },
  {
    n: "06",
    title: "Идва при вас за одобрение",
    body: "Готовото видео пристига при вас и спира там. Нищо не тръгва към никоя мрежа, докато не кажете „да“.",
    accent: true,
  },
  {
    n: "07",
    title: "След вашето „да“ — публикува се",
    body: "Facebook, Instagram и TikTok, в час, който вие сте определили. Ако кажете „не“ — видеото се преправя и се връща пак при вас.",
  },
];

const REALNI = [
  {
    id: "peg4LEjRl_Q",
    title: "Преди и след",
    note: "Суров кадър от телефон срещу готов клип със субтитри — един и същ момент. Това е разликата, която монтажът прави.",
  },
  {
    id: "mhpNb-evewI",
    title: "Разговор, който затваря",
    note: "Тридесет секунди от реален разговор — вдига, изслушва, отговаря, записва час.",
  },
  {
    id: "wGwzuqAvfwg",
    title: "Обаждане в 22:47",
    note: "По-дълъг формат. Показва цял случай от начало до край, без да отегчи.",
  },
  {
    id: "EBqI-TltIYo",
    title: "Задача, казана на глас",
    note: "Заснето в движение, с телефон. Целият блясък идва от монтажа и звука, не от техниката.",
  },
];

const AI_SCENARII = [
  {
    id: "v0GhLLbYow8",
    title: "„Тука има ли някой?“",
    note: "Изцяло генерирана сцена. Най-гледаното ни видео.",
  },
  {
    id: "HrBTiH9ACDQ",
    title: "От плажа",
    note: "Хора, обстановка и действие — нищо от това не е снимано.",
  },
  {
    id: "S2L9z3D-jGE",
    title: "Логистика",
    note: "Друг бранш, същият подход — сценарий, глас, генерирана картина.",
  },
  {
    id: "O-bJGQEDDXA",
    title: "Помощникът е свършил",
    note: "Кратка форма, направена за скрол — хваща в първата секунда.",
  },
];

const VLIZA = [
  {
    title: "Асистентът, настроен за вас",
    body: "Работи с вашата фонотека и с вашия глас. Знае темите ви, знае фирмите, за които правите видеа, и знае колко дълги ги искате.",
  },
  {
    title: "Стъпката с одобрението",
    body: "Отделен екран, на който виждате готовото видео, пускате го и решавате. Одобряваш · Върни за преправяне · Откажи.",
  },
  {
    title: "Публикуване в трите мрежи",
    body: "Facebook, Instagram и TikTok, с вертикален формат за всяка. Публикува се само одобреното.",
  },
  {
    title: "Обучение на екипа",
    body: "Шестимата ви агенти могат да го ползват, не само вие. Показваме го на живо, докато не стане ясно на всички.",
  },
  {
    title: "Поддръжка след пускането",
    body: "Ако нещо не се държи както трябва, оправяме го. Не ви оставяме с инструмент, който трябва сами да разгадавате.",
  },
];

const OT_VAS = [
  "Музикалните файлове, с които работите, и потвърждение, че правата за тях са ваши за социални мрежи.",
  "Записи на вашия глас — или готови начитки, или сесия, от която да ги вземем.",
  "Достъп до профилите във Facebook, Instagram и TikTok, когато стигнем до публикуването.",
  "Списък с темите, които се повтарят най-често при вас — оттам тръгва асистентът.",
];

function Yt({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <figure className="flex flex-col gap-3">
      <div
        className="relative w-full overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--s-line)", background: "var(--s-deep)", aspectRatio: "9 / 16" }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
        />
      </div>
      <figcaption className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold" style={{ color: "var(--s-text)" }}>
          {title}
        </span>
        <span className="text-[13.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
          {note}
        </span>
      </figcaption>
    </figure>
  );
}

export default function SigmaConsultPage() {
  return (
    <main
      className="mx-auto flex w-full max-w-[1080px] flex-col gap-20 px-5 pb-28 pt-14 sm:px-8 sm:pt-20"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Заглавна ─────────────────────────── */}
      <header className="flex flex-col gap-7">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ background: "rgba(224,164,88,0.12)", color: "var(--s-amber)" }}
          >
            За Сигма Консулт
          </span>
          <span className="text-[13px]" style={{ color: "var(--s-text-3)" }}>
            Подготвено за Таня Велкова · обновено 27 август 2026
          </span>
        </div>

        <h1
          className="text-[2rem] font-bold leading-[1.12] sm:text-[3.1rem]"
          style={{ fontFamily: "var(--font-display)", textWrap: "balance" }}
        >
          Вашата музика.
          <br />
          Вашият глас.
          <br />
          <span style={{ color: "var(--s-amber)" }}>Видеото — наша работа.</span>
        </h1>

        <p className="max-w-[62ch] text-[17px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
          По телефона казахте три неща: че снимате все едно и също, че плащате на хора да публикуват,
          но в процеса им няма дълбочина, и че нищо не бива да излиза навън, преди вие да сте го видели.
          Тази страница е отговорът и на трите.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4"
            style={{ borderColor: "var(--s-line)", background: "var(--s-line)" }}>
          {[
            { n: "17", e: "години", d: "на пазара" },
            { n: "6", e: "агента", d: "ще го ползват" },
            { n: "1759", e: "клиента", d: "имат нужда да чуят" },
            { n: "57", e: "вида", d: "застраховки" },
          ].map((x) => (
            <div key={x.e} className="flex flex-col gap-0.5 p-4 sm:p-5" style={{ background: "var(--s-card)" }}>
              <span
                className="text-[1.7rem] font-bold leading-none tabular-nums sm:text-[2rem]"
                style={{ fontFamily: "var(--font-display)", color: "var(--s-amber)" }}
              >
                {x.n}
              </span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--s-text)" }}>
                {x.e}
              </span>
              <span className="text-[13px]" style={{ color: "var(--s-text-3)" }}>
                {x.d}
              </span>
            </div>
          ))}
        </dl>

        <div
          className="rounded-2xl border p-6 sm:p-7"
          style={{ borderColor: "var(--s-line)", background: "var(--s-card)" }}
        >
          <div
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--s-amber)" }}
          >
            Как ви разбрах
          </div>
          <ul className="flex flex-col gap-3 text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
            <li>
              <strong style={{ color: "var(--s-text)" }}>Музиката е ваша</strong> и остава ваша — не се
              заменя със стокова.
            </li>
            <li>
              <strong style={{ color: "var(--s-text)" }}>Гласът е вашият</strong>, не синтетичен говорител.
            </li>
            <li>
              <strong style={{ color: "var(--s-text)" }}>Задавате тема, фирма и дължина</strong> — асистентът
              се съобразява и с трите.
            </li>
            <li>
              <strong style={{ color: "var(--s-text)" }}>Дълбочината липсва, не хората.</strong> Затова
              асистентът не само прави видеа — той обяснява защо едно е тръгнало, а друго не, и предлага
              каква да е следващата тема. Питате го в чата, на български.
            </li>
            <li>
              <strong style={{ color: "var(--s-text)" }}>Нищо не се публикува без вашето одобрение.</strong>{" "}
              Това не е настройка, която може да се изключи — то е част от начина, по който работи.
            </li>
          </ul>
        </div>
      </header>

      {/* ── Видеото за лизинг ────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Ето едно ваше видео
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
            Направено след разговора ни, по темата, която сама повдигнахте — Каско при лизинг. Двайсет и три секунди. Хората в него говорят на български. Нито един кадър не е сниман: няма оператор, няма
            студио, няма актьори.
          </p>
        </div>

        <div className="grid gap-7 sm:grid-cols-[minmax(0,300px)_1fr] sm:items-start">
          <figure className="flex flex-col items-center gap-3">
            <div
              className="relative rounded-[2.2rem] p-3 shadow-2xl"
              style={{
                background: "linear-gradient(160deg, #2a3240, #12171f)",
                border: "1px solid rgba(233,216,190,0.16)",
                boxShadow: "0 30px 60px -20px rgba(0,0,0,.85)",
              }}
            >
              <span
                className="absolute left-1/2 top-4 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full"
                style={{ background: "rgba(0,0,0,.55)" }}
              />
              <div
                className="overflow-hidden rounded-[1.75rem]"
                style={{ background: "#000", aspectRatio: "9 / 16", width: "min(268px, 68vw)" }}
              >
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster="/videa/sigma-kasko-lizing.jpg"
                  className="h-full w-full object-cover"
                >
                  <source src="/videa/sigma-kasko-lizing.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
            <figcaption className="text-center text-[13px]" style={{ color: "var(--s-text-3)" }}>
              Каско при лизинг · 23 секунди · вертикално
            </figcaption>
          </figure>

          <div className="flex flex-col gap-5">
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: "var(--s-line)", background: "var(--s-card)" }}
            >
              <div
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--s-amber)" }}
              >
                Защо точно тази тема
              </div>
              <p className="text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
                Човек взима колата, подписва и застраховката, която лизинговата компания му е подала — без да
                знае, че има право да избере сам. Това е момент, в който брокерът е от полза, а клиентът дори
                не подозира, че има избор. Точно такива теми правят видеата, които хората доизгледват.
              </p>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: "var(--s-line)", background: "var(--s-card)" }}
            >
              <div
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--s-amber)" }}
              >
                Какво още не е вътре
              </div>
              <ul className="flex flex-col gap-2 text-[15px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
                <li>
                  <strong style={{ color: "var(--s-text)" }}>Вашият глас.</strong> Тук говорят генерирани
                  хора. С вашия глас отгоре видеото става друго — и точно така ще работи при вас.
                </li>
                <li>
                  <strong style={{ color: "var(--s-text)" }}>Вашата музика.</strong> Тази е композирана от
                  нула, за да няма авторски права. Вашата пътека я заменя веднага.
                </li>
                <li>
                  <strong style={{ color: "var(--s-text)" }}>Вашето лице.</strong> Жената във видеото е
                  генерирана. Не сме пипали ваша снимка — за това се иска вашето разрешение, писмено.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Мини демо ────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Пипнете го сега
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
            Това долу не е снимка на екран — то работи. Изберете продукт и дължина, вижте какъв сценарий
            излиза, одобрете го и гледайте какво се получава. Същите четири стъпки ще правите и наистина.
          </p>
        </div>

        <MiniDemo />

        <p className="max-w-[62ch] text-[14px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
          Единствената разлика с истинската система: тук сценарият и отговорите са подготвени предварително,
          за да е бързо. При вас се съчиняват в момента, върху вашите теми и вашите числа.
        </p>
      </section>

      {/* ── Как работи ───────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Как ще работи
          </h2>
          <p className="text-[15.5px]" style={{ color: "var(--s-text-3)" }}>
            Седем стъпки. Пета и шеста са тези, на които държите.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="flex gap-5 rounded-xl border p-5 sm:p-6"
              style={{
                borderColor: s.accent ? "var(--s-amber-dim)" : "var(--s-line)",
                background: s.accent ? "rgba(224,164,88,0.06)" : "var(--s-card)",
              }}
            >
              <span
                className="shrink-0 pt-1 text-[15px] font-semibold tabular-nums"
                style={{ fontFamily: "var(--font-mono)", color: s.accent ? "var(--s-amber)" : "var(--s-text-3)" }}
              >
                {s.n}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[17px] font-semibold" style={{ color: "var(--s-text)" }}>
                  {s.title}
                </h3>
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── AI видеа за реален клиент ────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Генерирано видео за реален клиент
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
            Alineé Fragrances — работещ клиент, за когото правим точно това, което искате. Долу вляво е
            изцяло генерирано видео: нито един кадър не е сниман. Долу вдясно е реален заснет материал,
            минал през същия монтаж. Пуснете ги едно след друго.
          </p>
        </div>

        <div className="grid gap-7 sm:grid-cols-2">
          <figure className="flex flex-col gap-3">
            <video
              controls
              playsInline
              preload="none"
              poster="/videa/alinee-ai-videa.jpg"
              className="w-full rounded-xl border"
              style={{ borderColor: "var(--s-line)", background: "var(--s-deep)", aspectRatio: "9 / 16" }}
            >
              <source src="/videa/alinee-ai-videa.mp4" type="video/mp4" />
            </video>
            <figcaption className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold" style={{ color: "var(--s-amber)" }}>
                Изцяло генерирано · нула снимачни дни
              </span>
              <span className="text-[13.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
                Хора, локации, продуктови кадри — всичко е направено на компютър по сценарий. Точно този
                тип видео ще прави асистентът за вас, само че върху вашия звук.
              </span>
            </figcaption>
          </figure>

          <figure className="flex flex-col gap-3">
            <video
              controls
              playsInline
              preload="none"
              poster="/videa/alinee-realni-hora.jpg"
              className="w-full rounded-xl border"
              style={{ borderColor: "var(--s-line)", background: "var(--s-deep)", aspectRatio: "9 / 16" }}
            >
              <source src="/videa/alinee-realni-hora.mp4" type="video/mp4" />
            </video>
            <figcaption className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold" style={{ color: "var(--s-text)" }}>
                Реален материал · същият монтаж
              </span>
              <span className="text-[13.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
                Заснето с телефон от самия клиент. Субтитрите, ритъмът, звукът и крайният кадър с марката
                са добавени от нас.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Реални видеа ─────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Наши видеа с реален материал
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
            Тези са снимани с телефон и монтирани от нас. Първото показва най-ясно какво прави обработката —
            същият кадър преди и след.
          </p>
        </div>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {REALNI.map((v) => (
            <Yt key={v.id} {...v} />
          ))}
        </div>
      </section>

      {/* ── AI сценарии ──────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Кратки видеа, генерирани по сценарий
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
            Единайсет секунди, направени за скрол. Различни браншове, един и същ подход — сценарий, глас,
            генерирана картина.
          </p>
        </div>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {AI_SCENARII.map((v) => (
            <Yt key={v.id} {...v} />
          ))}
        </div>
      </section>

      {/* ── Какво влиза ──────────────────────── */}
      <section className="flex flex-col gap-8">
        <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
          Какво влиза
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {VLIZA.map((v) => (
            <div
              key={v.title}
              className="flex flex-col gap-2 rounded-xl border p-5"
              style={{ borderColor: "var(--s-line)", background: "var(--s-card)" }}
            >
              <h3 className="text-[16px] font-semibold" style={{ color: "var(--s-text)" }}>
                {v.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── От вас ───────────────────────────── */}
      <section className="flex flex-col gap-6">
        <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
          Какво ни трябва от вас
        </h2>
        <ul className="flex flex-col gap-3">
          {OT_VAS.map((t) => (
            <li
              key={t}
              className="flex gap-3 text-[15.5px] leading-relaxed"
              style={{ color: "var(--s-text-2)" }}
            >
              <span style={{ color: "var(--s-amber)" }}>—</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="max-w-[62ch] text-[14.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
          Колкото по-рано дойдат тези четири неща, толкова по-рано тръгва асистентът. Първите три са
          същинските — темите можем да ги съберем и заедно.
        </p>
      </section>

      {/* ── Цени и договор ───────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.6rem] font-bold sm:text-[2.1rem]" style={{ fontFamily: "var(--font-display)" }}>
            Колко струва
          </h2>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
            По телефона минахме през числата бързо. Ето ги подредени, за да са пред очите ви.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--s-line)", background: "var(--s-card)" }}
        >
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--s-line-soft)" }}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 p-6">
              <div className="flex flex-col gap-1">
                <div className="text-[16px] font-semibold" style={{ color: "var(--s-text)" }}>
                  Изработка на платформата
                </div>
                <div className="text-[14px]" style={{ color: "var(--s-text-3)" }}>
                  Еднократно — 400 € при подпис, 400 € при приемане
                </div>
              </div>
              <div
                className="text-[24px] font-bold tabular-nums"
                style={{ fontFamily: "var(--font-mono)", color: "var(--s-text)" }}
              >
                800 €
              </div>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3 p-6">
              <div className="flex flex-col gap-1">
                <div className="text-[16px] font-semibold" style={{ color: "var(--s-text)" }}>
                  След това — на месец
                </div>
                <div className="text-[14px] leading-relaxed" style={{ color: "var(--s-text-3)" }}>
                  50 € поддръжка + 100 € за работата на системата, с до 10 готови видеа месечно.
                  <br />
                  Първият месец е безплатен. Цената е фиксирана 12 месеца.
                </div>
              </div>
              <div
                className="text-[24px] font-bold tabular-nums"
                style={{ fontFamily: "var(--font-mono)", color: "var(--s-amber)" }}
              >
                150 €
              </div>
            </div>

            <div className="flex flex-col gap-3 p-6">
              <div className="flex flex-col gap-1">
                <div className="text-[16px] font-semibold" style={{ color: "var(--s-text)" }}>
                  Ако десет не стигат
                </div>
                <div className="text-[14px]" style={{ color: "var(--s-text-3)" }}>
                  Обемът се вдига с пакет, не на парче. Сменя се от месец за месец.
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                {[
                  { n: "Основен", v: "до 10 видеа", c: "150 €", aktiven: true },
                  { n: "Разширен", v: "до 20 видеа", c: "270 €" },
                  { n: "Голям", v: "до 30 видеа", c: "350 €" },
                ].map((p) => (
                  <div
                    key={p.n}
                    className="flex-1 rounded-xl border p-4"
                    style={{
                      borderColor: p.aktiven ? "var(--s-amber-dim)" : "var(--s-line)",
                      background: p.aktiven ? "rgba(224,164,88,0.06)" : "var(--s-deep)",
                    }}
                  >
                    <div
                      className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: p.aktiven ? "var(--s-amber)" : "var(--s-text-3)" }}
                    >
                      {p.n}
                    </div>
                    <div
                      className="mt-1.5 text-[20px] font-bold tabular-nums"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--s-text)" }}
                    >
                      {p.c}
                    </div>
                    <div className="text-[13.5px]" style={{ color: "var(--s-text-2)" }}>
                      {p.v} на месец
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6 sm:p-7"
          style={{ borderColor: "var(--s-amber-dim)", background: "rgba(224,164,88,0.06)" }}
        >
          <div
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--s-amber)" }}
          >
            Клаузата, на която държа
          </div>
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
            Цените на AI услугите се менят бързо — и в двете посоки. В договора е записано, че се преглеждат
            на всеки шест месеца, а <strong style={{ color: "var(--s-text)" }}>поевтинеят ли, намалявам сам</strong>,
            без да ме питате. Не виждам причина това да е само в моя полза. Ако някога поскъпнат съществено и
            не приемете новата цена, прекратявате с месец предизвестие и без неустойка.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="max-w-[62ch] text-[15.5px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
            Примерният договор е готов — с всичко горе вътре, плюс кой какво отговаря за музиката, какво става
            при поправки и защо одобрението е записано като задължение, а не като любезност. Прочетете го на
            спокойствие. Ако нещо не ви пасва, променяме го.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="/oferta/sigma-consult/dogovor.pdf"
              className="rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--s-amber)", color: "#1a1206" }}
            >
              Примерният договор (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* ── Следваща стъпка ──────────────────── */}
      <section
        className="flex flex-col gap-5 rounded-2xl border p-7 sm:p-9"
        style={{ borderColor: "var(--s-amber-dim)", background: "rgba(224,164,88,0.06)" }}
      >
        <h2 className="text-[1.5rem] font-bold sm:text-[1.9rem]" style={{ fontFamily: "var(--font-display)" }}>
          Вторник, 10:00
        </h2>
        <p className="max-w-[62ch] text-[16px] leading-relaxed" style={{ color: "var(--s-text-2)" }}>
          Разбрахме се да се чуем във вторник, 1 септември, от 10:00 ч. Дотогава разгледайте видеото и
          договора на спокойствие. На срещата ще минем през него ред по ред и ще пуснем едно видео заедно,
          на живо — да видите как се прави, преди да сте се обвързали с каквото и да било.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="tel:+359889778888"
            className="rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--s-amber)", color: "#1a1206" }}
          >
            Обади се
          </a>
          <a
            href="https://www.promarketing.pw"
            className="rounded-lg border px-5 py-3 text-[15px] font-semibold transition-colors"
            style={{ borderColor: "var(--s-line)", color: "var(--s-text)" }}
          >
            promarketing.pw
          </a>
        </div>
      </section>

      <footer className="flex flex-col gap-1.5 border-t pt-7" style={{ borderColor: "var(--s-line-soft)" }}>
        <p className="text-[13.5px]" style={{ color: "var(--s-text-3)" }}>
          Ивайло Петев · Pro Marketing LTD · promarketing.pw
        </p>
        <p className="text-[13px]" style={{ color: "var(--s-text-3)" }}>
          Страницата е лична и не се индексира от търсачките.
        </p>
      </footer>
    </main>
  );
}
