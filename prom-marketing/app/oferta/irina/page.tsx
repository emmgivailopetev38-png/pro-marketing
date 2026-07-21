import { format } from "date-fns";
import { bg } from "date-fns/locale";

const today = format(new Date(), "d MMMM yyyy", { locale: bg });

const SECTOR_FACTS = [
  { label: "Хранителни загуби", value: "5–15%", note: "бракувано заради изтекъл срок — пари на боклука" },
  { label: "Температурни зони", value: "3", note: "сухо · охладено · замразено — различен режим" },
  { label: "Проследимост", value: "LOT", note: "партиден контрол — задължителен за храни (БАБХ/HACCP)" },
  { label: "Ръчна работа", value: "часове", note: "дневно за наличности, поръчки и документи" },
];

const MODULES = [
  {
    n: "01",
    title: "Складова наличност в реално време",
    body: "Виждаш какво, къде и колко имаш — в момента. По локация, по температурна зона, по партида. Без инвентаризации „на тъмно“.",
    bullets: [
      "Наличности в реално време по склад и по зона (сухо / охладено / замразено)",
      "Партиден (LOT) запис на всяка стока — кога е приета, срок, доставчик",
      "Резервирано срещу реално свободно за продажба",
      "Баркод / QR сканиране при прием и експедиция",
      "Мин./макс. нива с авто-аларма при нисък остатък",
    ],
  },
  {
    n: "02",
    title: "Срокове на годност · FEFO + готовност за изтегляне",
    body: "За храните срокът е пари. Системата следи всяка партида и те предупреждава преди да стане късно — и вади всичко за секунди при изтегляне.",
    bullets: [
      "Алерти 30 / 14 / 7 дни преди изтичане — по партида",
      "FEFO препоръка — първо излиза стоката с най-близък срок",
      "Авто-предложение за намаление/промоция на застрашена стока",
      "Готовност за изтегляне (recall) — коя партида при кои клиенти отиде",
      "Отчет „застрашени наличности“ всяка сутрин",
    ],
  },
  {
    n: "03",
    title: "Поръчки · прием и обработка",
    body: "Поръчките влизат отвсякъде — телефон, имейл, Viber, портал — и попадат на едно място, готови за експедиция.",
    bullets: [
      "Прием от имейл / Viber / WhatsApp / телефон → една обща опашка",
      "AI разчита поръчка от свободен текст и я структурира",
      "Авто-проверка наличност + резервация на стоката",
      "Маршрутизиране към подготовка и експедиция",
      "Автоматично потвърждение към клиента",
    ],
  },
  {
    n: "04",
    title: "B2B портал · клиентите поръчват сами",
    body: "Магазини, ресторанти и дистрибутори влизат с личен профил, виждат своите цени и наличност и поръчват, без да чакат на телефона.",
    bullets: [
      "Личен login + персонална ценова листа за всеки клиент",
      "Наличност в реално време + минимални количества",
      "Повтори последна поръчка с 1 клик",
      "Статус: в подготовка → експедирано → доставено",
      "История на поръчки и фактури на едно място",
    ],
  },
  {
    n: "05",
    title: "Документи · фактури, разписки, сертификати",
    body: "Стоковите разписки, кантарните бележки, фактурите и сертификатите се генерират и архивират сами — намираш всеки за 2 секунди.",
    bullets: [
      "Авто-фактури и стокови разписки направо от поръчката",
      "Сертификати за храни / декларации за съответствие към партида",
      "Кантарни бележки, опаковъчни листи, CMR за транспорт",
      "Електронен подпис на договори с клиенти и доставчици",
      "Архив по клиент / партида / дата — търсене за секунди",
    ],
  },
  {
    n: "06",
    title: "Доставки · логистика и температура",
    body: "От склада до вратата на клиента — маршрути, проследяване и контрол на хладилната верига, без листчета и обаждания.",
    bullets: [
      "Планиране на маршрути и товарене по приоритет и зона",
      "Куриери (Speedy / Econt) + собствен транспорт на едно място",
      "Температурен лог при превоз на охладено и замразено",
      "Проследяване на доставка + известие до клиента",
      "Доказателство за доставка (подпис / снимка)",
    ],
  },
  {
    n: "07",
    title: "Доставчици · зареждане на склада",
    body: "Системата ти подсказва какво да поръчаш и кога — преди да свърши — и следи входящите доставки и качеството им.",
    bullets: [
      "Авто-предложение за поръчки по обращаемост и прогноза",
      "Проследяване на входящи доставки и срокове",
      "Контрол на входящо качество + температура при прием",
      "История на цените и условията по доставчик",
      "Алерт при забавена доставка",
    ],
  },
  {
    n: "08",
    title: "Плащания · вземания и просрочия",
    body: "Кой колко дължи, кой е просрочил, кой е на кредитен лимит — ясно, в реално време, без таблици.",
    bullets: [
      "Сверяване на банкови плащания с фактурите",
      "Кредитни лимити на клиенти + предупреждение при надвишаване",
      "Алерти за просрочени вземания + авто-напомняния",
      "Каса и наложен платеж — отчетност",
      "Справка „кой ми дължи“ с един поглед",
    ],
  },
  {
    n: "09",
    title: "Анализи · обращаемост и прогноза",
    body: "Кое се върти, кое стои, кое носи пари, кое генерира брак. AI ти показва и прогнозира — за да зареждаш умно.",
    bullets: [
      "Обращаемост на стоката — кое лежи, кое лети",
      "„Мъртви наличности“ — какво да разпродадеш",
      "Загуби от брак по причина (срок, повреда, температура)",
      "Прогноза за търсене + сезонност → колко да заредиш",
      "Седмичен отчет в имейла всеки понеделник",
    ],
  },
];

const PROCESS = [
  { step: "1", title: "Анализ + аудит", body: "Преглеждаме как движиш стоката днес — наличности, поръчки, документи, температурни режими. Може и обиколка на склада. 3–5 работни дни." },
  { step: "2", title: "План + дизайн", body: "Конкретен план за всеки модул, mockups и ясни срокове. Подписваме договор." },
  { step: "3", title: "Изграждане · Phase 1", body: "30–45 дни до стартиране на основните модули (наличности, срокове, поръчки, документи)." },
  { step: "4", title: "Тренинг + старт", body: "Срещаме се (на живо или онлайн), обучаваме екипа, прехвърляме данните и стартираме." },
  { step: "5", title: "Поддръжка + надграждане", body: "30 дни безплатна поддръжка. После Phase 2 (доставки, доставчици, плащания) и Phase 3 (анализи + AI)." },
];

const WHY = [
  { title: "Реален опит с български фирми", body: "Изграждам AI и автоматизации за български складови, търговски и хранителни фирми. Не сме теоретици — виждаме реалните проблеми на терен." },
  { title: "Твоя система, твой сървър", body: "Всичко е на твоя инфраструктура. Никога няма да зависиш от платформа, която утре фалира или вдига цените." },
  { title: "На живо или онлайн · в цяла България", body: "Където и да си — идваме на място да видим склада, или работим онлайн. Както ти е удобно." },
  { title: "Расте с теб", body: "Базов пакет днес, разширение утре. Не плащаш за функции, които още не ползваш." },
];

const TIERS = [
  {
    name: "Phase 1 · Базов",
    price: "Подлежи на преговори",
    suffix: "след среща и уточняване на нужди",
    badge: "Препоръчан старт",
    highlight: true,
    features: [
      "Складова наличност в реално време + зони (модул 01)",
      "Срокове на годност · FEFO + recall (модул 02)",
      "Прием и обработка на поръчки (модул 03)",
      "B2B портал за клиентите ти (модул 04)",
      "Документи · фактури, разписки, сертификати (модул 05)",
      "Интеграция с уебсайта / съществуващи инструменти",
      "30–45 дни срок",
      "30 дни безплатна поддръжка",
    ],
  },
  {
    name: "Phase 2 · Логистика",
    price: "Подлежи на преговори",
    suffix: "след среща и уточняване на нужди",
    features: [
      "Доставки · маршрути + температурен контрол (модул 06)",
      "Доставчици · зареждане и контрол на качеството (модул 07)",
      "Плащания · вземания и просрочия (модул 08)",
      "Цената зависи от обхвата след среща",
    ],
  },
  {
    name: "Phase 3 · Анализи & AI",
    price: "Подлежи на преговори",
    suffix: "след среща и уточняване на нужди",
    features: [
      "Анализи · обращаемост, мъртви наличности, брак (модул 09)",
      "Прогноза за търсене + сезонност",
      "AI асистент 24/7 за клиенти и екип (Viber/WhatsApp/имейл)",
      "Цената зависи от обхвата след среща",
    ],
  },
];

const RECURRING =
  "Месечна поддръжка след стартиране — подлежи на преговори след среща. Включва хостинг, AI API кредити, технически промени и реакция в рамките на 24 ч. Цената зависи от реалния обем работа след стартиране.";

export default function IrinaPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16, 185, 129, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 1) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 18% 25%, rgba(16, 185, 129, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 82% 75%, rgba(45, 212, 191, 0.14) 0%, transparent 45%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
          <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            ПРЕЗЕНТАЦИЯ · {today}
          </p>

          <p className="mb-3 font-[family-name:var(--font-editorial)] text-2xl text-[var(--color-text-secondary)]">
            за
          </p>

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.05] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>Ирина </span>
            <span
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #34d399, #2dd4bf 50%, #10b981)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              Белева
            </span>
          </h1>

          <p className="mt-6 inline-block w-fit rounded-full border border-[var(--color-border-bright)] bg-[rgba(16,185,129,0.10)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
            ❄️ Складове с храни · Партиди · Срокове · Температурни зони
          </p>

          <div className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              AI операционна система за{" "}
              <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">
                складова база за храни
              </span>{" "}
              — наличности в реално време по температурни зони, партиден контрол на сроковете, B2B портал за клиентите ти, документи и сертификати, доставки и анализи. Едно място вместо тетрадки, таблици и обаждания.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div aria-hidden className="h-px w-12" style={{ background: "var(--color-emerald-bright)" }} />
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              За Ирина Белева · „ПроМаркетинг“ ЕООД
            </p>
          </div>

          <div className="mt-20 flex flex-wrap gap-4">
            <a
              href="#design"
              className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-emerald-bright)",
                color: "var(--color-emerald-bright)",
                background: "rgba(16, 185, 129, 0.10)",
              }}
            >
              🖥️ Виж визуализацията
              <span aria-hidden>↓</span>
            </a>
            <a
              href="#price"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-emerald-bright)] hover:text-[var(--color-emerald-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              💎 Phase 1 · основни модули
            </a>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-emerald-bright)]"
            >
              9 модула
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* SECTOR CONTEXT */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-20"
        style={{ background: "rgba(16, 185, 129, 0.03)" }}
      >
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Контекст · складове с храни
          </p>
          <h2 className="mb-10 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.08]">
            Какво тежи на един <span className="text-[var(--color-emerald-bright)]">склад за храни</span>.
          </h2>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {SECTOR_FACTS.map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(11, 32, 24, 0.6)",
                }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-tertiary)]">
                  {f.label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-editorial)] text-4xl font-extrabold text-[var(--color-emerald-bright)]">
                  {f.value}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{f.note}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Склад за храни не може да работи с тетрадки и Excel — срокове по партиди, три температурни режима, проследимост за БАБХ, поръчки от десетки клиенти, доставки с хладилна верига. Всеки пропуснат срок или объркана партида е директна загуба. AI системата по-долу адресира всеки един от тези процеси.
          </p>

          <div
            className="mt-8 rounded-2xl border-2 p-6"
            style={{
              borderColor: "rgba(251, 191, 36, 0.30)",
              background: "rgba(251, 191, 36, 0.04)",
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-amber)]">
              ℹ️ Важно
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
              <span className="font-bold">Това е базова презентация</span>, съобразена със спецификата на складове с храни. Конкретните модули, обхват и цена{" "}
              <span className="font-bold text-[var(--color-amber)]">персонализираме</span> след кратка среща с теб и проучване на вашата фирма — според реалните ви процеси, екип и приоритети.
            </p>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Какво ще изградим
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            9 модула. Един общ <span className="text-[var(--color-emerald-bright)]">мозък</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Всеки модул решава конкретен процес в склада. Заедно — пълна операционна система за складова база за храни.
          </p>

          <div className="space-y-6">
            {MODULES.map((m) => (
              <div
                key={m.n}
                className="rounded-2xl border p-7"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(11, 32, 24, 0.50)",
                }}
              >
                <div className="mb-4 flex flex-wrap items-baseline gap-4">
                  <span className="rounded-full border border-[var(--color-emerald-bright)] bg-[rgba(16,185,129,0.10)] px-3 py-1 font-mono text-[11px] font-bold text-[var(--color-emerald-bright)]">
                    {m.n}
                  </span>
                  <h3 className="font-[family-name:var(--font-editorial)] text-xl font-bold leading-tight md:text-2xl">
                    {m.title}
                  </h3>
                </div>
                <p className="mb-5 text-base leading-relaxed text-[var(--color-text-secondary)]">{m.body}</p>
                <ul className="space-y-2">
                  {m.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]"
                    >
                      <span className="mt-1 text-[var(--color-emerald-bright)]">▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL MOCKUPS */}
      <section
        id="design"
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(16, 185, 129, 0.03)" }}
      >
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Как ще изглежда системата
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Реални <span className="text-[var(--color-emerald-bright)]">екрани</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Не обещания на хартия — това са реалните изгледи, които твоят екип ще използва всеки ден. (Примерни данни.)
          </p>

          {/* MOCKUP 1: Warehouse stock + temperature zones */}
          <div className="mb-20">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
                Изглед 01
              </span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">
                Складова наличност · температурни зони
              </h3>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div
                className="rounded-2xl border-2 p-6"
                style={{
                  borderColor: "var(--color-border-bright)",
                  background: "rgba(11, 32, 24, 0.85)",
                }}
              >
                <h4 className="mb-4 font-display text-base font-bold text-white">Зони · запълване</h4>
                {[
                  { zone: "🌡️ Сухо (15–25°C)", products: 3120, status: "OK", fill: 71, alerts: 4 },
                  { zone: "❄️ Охладено (0–4°C)", products: 1840, status: "OK", fill: 64, alerts: 2 },
                  { zone: "🧊 Замразено (-18°C)", products: 980, status: "LOW", fill: 26, alerts: 9 },
                ].map((w, i) => (
                  <div key={i} className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{w.zone}</span>
                      <span className="text-white/60">{w.products.toLocaleString("bg-BG")} артикула</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${w.fill}%`,
                          background:
                            w.status === "LOW"
                              ? "linear-gradient(90deg, #ef4444, #fbbf24)"
                              : "linear-gradient(90deg, #10b981, #2dd4bf)",
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/50">
                      <span>{w.fill}% заето</span>
                      {w.alerts > 0 && <span className="text-[#fbbf24]">⚠️ {w.alerts} под минимум</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-2xl border-2 p-6"
                style={{
                  borderColor: "var(--color-border-bright)",
                  background: "rgba(11, 32, 24, 0.85)",
                }}
              >
                <h4 className="mb-4 font-display text-base font-bold text-white">🔍 Намери партида</h4>
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
                  <span className="text-base">🔎</span>
                  <input
                    readOnly
                    value='"кашкавал краве · охладено"'
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                  />
                  <span className="rounded bg-[var(--color-emerald)] px-2 py-1 text-[10px] font-bold text-white">
                    3 партиди
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { lot: "LOT-2406-118", qty: "240 кг", exp: "след 9 дни", urgent: true },
                    { lot: "LOT-2406-090", qty: "510 кг", exp: "след 22 дни", urgent: false },
                    { lot: "LOT-2405-061", qty: "180 кг", exp: "след 41 дни", urgent: false },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-black/20 p-3"
                      style={{ borderColor: b.urgent ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-white/80">{b.lot}</span>
                        <span className="font-mono text-[11px] text-white">{b.qty}</span>
                      </div>
                      <p className={`mt-1 text-[10px] ${b.urgent ? "text-[#ef4444]" : "text-white/60"}`}>
                        {b.urgent && "🔥 "}Изтича {b.exp}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 2: Expiry / FEFO */}
          <div className="mb-20">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
                Изглед 02
              </span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">
                Срокове на годност · FEFO
              </h3>
            </div>
            <div
              className="rounded-2xl border-2 p-6 shadow-2xl"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "linear-gradient(135deg, rgba(11, 32, 24, 0.85), rgba(6, 20, 15, 0.95))",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                  <span className="h-3 w-3 rounded-full bg-[#fbbf24]" />
                  <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
                  <span className="ml-4 font-mono text-xs text-white/60">⏳ Контрол на сроковете</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#fbbf24]">● 6 застрашени</span>
              </div>

              <div className="space-y-2">
                {[
                  { product: "Прясно мляко 3.6% · 1л", lot: "LOT-2406-201", exp: "след 3 дни", stock: "320 бр", level: "URGENT" },
                  { product: "Кашкавал краве · 1 кг", lot: "LOT-2406-118", exp: "след 9 дни", stock: "240 кг", level: "HIGH" },
                  { product: "Замразени зеленчуци · 2.5 кг", lot: "LOT-2405-077", exp: "след 14 дни", stock: "96 бр", level: "MED" },
                  { product: "Кисело мляко 400 г", lot: "LOT-2406-150", exp: "след 6 дни", stock: "510 бр", level: "HIGH" },
                  { product: "Колбас траен · вакуум", lot: "LOT-2404-033", exp: "след 25 дни", stock: "140 бр", level: "LOW" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{e.product}</p>
                      <p className="truncate font-mono text-[10px] text-white/50">{e.lot} · {e.stock}</p>
                    </div>
                    <span className="text-xs text-white/70">{e.exp}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        background:
                          e.level === "URGENT"
                            ? "#ef4444"
                            : e.level === "HIGH"
                            ? "#fbbf24"
                            : e.level === "MED"
                            ? "#2dd4bf"
                            : "#64748b",
                        color: e.level === "HIGH" || e.level === "MED" ? "#06140f" : "white",
                      }}
                    >
                      {e.level}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-[var(--color-emerald-bright)]/30 bg-[rgba(16,185,129,0.06)] p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-emerald-bright)]">
                  🤖 AI асистент
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/80">
                  „Прясното мляко (LOT-2406-201) изтича след 3 дни — 320 бр. Предлагам -30% за магазините с днешна поръчка и приоритетна експедиция по FEFO. Да пусна ли намалението?“
                </p>
              </div>
            </div>
          </div>

          {/* MOCKUP 3: B2B portal */}
          <div className="mb-20">
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
                Изглед 03
              </span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">
                B2B портал · клиент поръчва сам
              </h3>
            </div>
            <div
              className="rounded-2xl border-2 p-6"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "rgba(11, 32, 24, 0.85)",
              }}
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Login като</p>
                  <p className="font-bold text-white">🏪 Ресторант „Балкан“ · Пловдив</p>
                </div>
                <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-[10px] font-bold uppercase text-[#22c55e]">
                  ● онлайн
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-black/30 p-4">
                  <p className="font-mono text-[10px] uppercase text-white/50">Тази поръчка</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[var(--color-emerald-bright)]">38 артикула</p>
                  <p className="text-[10px] text-white/60">~ 210 кг</p>
                </div>
                <div className="rounded-lg bg-black/30 p-4">
                  <p className="font-mono text-[10px] uppercase text-white/50">Сума</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[var(--color-amber)]">1 248 €</p>
                  <p className="text-[10px] text-white/60">Ваша цена · без ДДС</p>
                </div>
                <div className="rounded-lg bg-black/30 p-4">
                  <p className="font-mono text-[10px] uppercase text-white/50">Доставка</p>
                  <p className="mt-1 font-display text-2xl font-bold text-white">утре</p>
                  <p className="text-[10px] text-white/60">Охладено + сухо</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="font-mono text-[10px] uppercase text-white/50">Статус на поръчката</p>
                {[
                  { step: "Поръчка приета", done: true },
                  { step: "Проверена наличност + резервация", done: true },
                  { step: "Подготовка в склада", done: false, active: true },
                  { step: "Експедиция / транспорт", done: false },
                  { step: "Доставено", done: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                      style={{
                        background: s.done ? "#22c55e" : s.active ? "#10b981" : "rgba(255,255,255,0.1)",
                        color: s.done || s.active ? "white" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {s.done ? "✓" : i + 1}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: s.done ? "white" : s.active ? "var(--color-emerald-bright)" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {s.step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MOCKUP 4: Analytics */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
                Изглед 04
              </span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">
                Анализи · обращаемост и брак
              </h3>
            </div>
            <div
              className="rounded-2xl border-2 p-6"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "rgba(11, 32, 24, 0.85)",
              }}
            >
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 p-4">
                  <p className="font-mono text-[10px] uppercase text-[#22c55e]">Бързо движещи се</p>
                  <p className="mt-1 font-display text-3xl font-bold text-white">142</p>
                  <p className="text-[10px] text-white/60">артикула · 80% от оборота</p>
                </div>
                <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-4">
                  <p className="font-mono text-[10px] uppercase text-[#fbbf24]">Мъртви наличности</p>
                  <p className="mt-1 font-display text-3xl font-bold text-white">3 980 €</p>
                  <p className="text-[10px] text-white/60">лежат над 60 дни — разпродай</p>
                </div>
                <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-4">
                  <p className="font-mono text-[10px] uppercase text-[#ef4444]">Брак този месец</p>
                  <p className="mt-1 font-display text-3xl font-bold text-white">1 210 €</p>
                  <p className="text-[10px] text-white/60">68% заради изтекъл срок</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 font-display text-sm font-bold text-white">Топ движение · седмица</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Прясно мляко 3.6%", trend: "+24%" },
                      { name: "Кашкавал краве", trend: "+11%" },
                      { name: "Яйца L · 10 бр", trend: "+9%" },
                      { name: "Замразени зеленчуци", trend: "-6%" },
                      { name: "Колбас траен", trend: "-14%" },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                      >
                        <p className="text-xs text-white">{c.name}</p>
                        <span
                          className="font-mono text-[11px] font-bold"
                          style={{ color: c.trend.startsWith("+") ? "#22c55e" : "#ef4444" }}
                        >
                          {c.trend}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 font-display text-sm font-bold text-white">Прогноза за зареждане</h4>
                  <div className="rounded-lg border border-white/5 bg-black/20 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase text-white/50">AI препоръка · следваща седмица</p>
                    <div className="space-y-2">
                      {[
                        { item: "Прясно мляко 3.6%", action: "+ 600 бр", reason: "темп на продажба ↑" },
                        { item: "Яйца L", action: "+ 240 бр", reason: "сезонен ръст" },
                        { item: "Колбас траен", action: "− задръж", reason: "застой · избягвай брак" },
                      ].map((s, i) => (
                        <div key={i} className="rounded border border-white/5 bg-black/30 p-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-white">{s.item}</p>
                            <p className="font-mono text-[11px] font-bold text-[var(--color-emerald-bright)]">{s.action}</p>
                          </div>
                          <p className="text-[10px] text-white/55">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-[var(--color-emerald-bright)]/30 bg-[rgba(16,185,129,0.06)] p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-emerald-bright)]">
                  🤖 AI откри
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/80">
                  „68% от брака този месец е от изтекъл срок — основно в охладената зона. Ако пуснем FEFO авто-намаления 7 дни преди срок, прогнозата е −40% брак ≈ спестени ~480 €/месец.“
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICE */}
      <section id="price" className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Инвестиция
          </p>
          <h2 className="mb-16 text-center font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Три нива · избираш по нужда.
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className="relative flex flex-col rounded-3xl border-2 p-7"
                style={{
                  borderColor: t.highlight ? "var(--color-emerald-bright)" : "var(--color-border-default)",
                  background: t.highlight
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(45, 212, 191, 0.06))"
                    : "rgba(11, 32, 24, 0.50)",
                }}
              >
                {t.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-emerald)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    {t.badge}
                  </span>
                )}
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
                  {t.name}
                </p>
                <p className="mt-3 font-[family-name:var(--font-editorial)] text-4xl font-extrabold text-[var(--color-text-primary)]">
                  {t.price}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {t.suffix}
                </p>
                <ul className="mt-6 flex-1 space-y-2">
                  {t.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]"
                    >
                      <span className="mt-1 text-[var(--color-emerald-bright)]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="mx-auto mt-10 max-w-3xl rounded-2xl border p-6 text-center"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "rgba(251, 191, 36, 0.05)",
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-amber)]">
              Месечна поддръжка
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{RECURRING}</p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(16, 185, 129, 0.03)" }}
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Процес
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            От подпис до <span className="text-[var(--color-emerald-bright)]">стартиране</span>.
          </h2>
          <div className="space-y-4">
            {PROCESS.map((p) => (
              <div
                key={p.step}
                className="flex items-start gap-5 rounded-2xl border p-6"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(11, 32, 24, 0.50)",
                }}
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald)] font-display text-lg font-bold text-white">
                  {p.step}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-editorial)] text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Защо ние
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Защо <span className="text-[var(--color-emerald-bright)]">ProMarketing</span>.
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {WHY.map((w) => (
              <div
                key={w.title}
                className="rounded-2xl border p-6"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(11, 32, 24, 0.50)",
                }}
              >
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-xl font-bold">{w.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(6, 20, 15, 0.20))",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Следваща стъпка
          </p>
          <h2 className="mb-8 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Готова да спреш загубите <br />
            <span className="text-[var(--color-emerald-bright)]">от срокове и хаос</span>?
          </h2>
          <p className="mb-8 mx-auto max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Нека се видим — на живо или онлайн, както ти е удобно. Разглеждаме реалните процеси в склада, уточняваме обхвата и едва тогава финализираме цената и срока.
          </p>

          <div
            className="mx-auto mb-12 max-w-2xl rounded-xl border p-4"
            style={{
              borderColor: "rgba(251, 191, 36, 0.30)",
              background: "rgba(251, 191, 36, 0.05)",
            }}
          >
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
              📍 <span className="font-bold">Среща</span> — на живо в склада ти или онлайн. Виждаме процесите, говорим с екипа и правим по-точна оферта от „на сляпо“.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:emmgivailopetev38@gmail.com?subject=Складове с храни · Старт"
              className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-emerald-bright)",
                color: "var(--color-bg-void)",
                background: "var(--color-emerald-bright)",
              }}
            >
              ✉️ Отговори с „Започваме“
            </a>
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-emerald-bright)] hover:text-[var(--color-emerald-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              📞 +359 877 399 963
            </a>
          </div>

          <p className="mt-16 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            Ивайло Петев · ProMarketing ЕООД · България
          </p>
        </div>
      </section>
    </main>
  );
}
