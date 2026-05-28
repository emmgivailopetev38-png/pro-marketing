import { format } from "date-fns";
import { bg } from "date-fns/locale";

const today = format(new Date(), "d MMMM yyyy", { locale: bg });

const MODULES = [
  {
    n: "01",
    title: "QR сканиране · мигновено разпознаване",
    body: "Техникът сканира QR на пожарогасител с телефона си. AI разпознава марка, модел, сериен номер за 2 секунди.",
    bullets: [
      "15 марки в България (Спарк, Полуш, Огнеборец...) — всеки със собствени серийни номера",
      "Всеки сериен номер (напр. Спарк 0036, 0028) се съхранява в базата",
      "Сканираш → излизат всички детайли за пожарогасителя в системата",
      "QR кодовете се генерират от системата · отпечатваш и слагаш",
    ],
  },
  {
    n: "02",
    title: "AI Vision · резервен план без QR",
    body: "QR кодът се размие или мръсен? AI разпознава пожарогасителя от снимка.",
    bullets: [
      "Техникът снима пожарогасителя през Telegram",
      "AI разпознава марка по визуален облик и текст",
      "Ако не може · техникът пише в чата '0036 Спарк' → системата го въвежда",
      "Voice → text · диктува сериен номер на български",
    ],
  },
  {
    n: "03",
    title: "Автоматично генериране на протокол",
    body: "В момента, в който сканирате — автоматично се генерира протокол (PDF/Word). Готов за подпис.",
    bullets: [
      "Шаблонът ви се преобразува в дигитален формат",
      "Авто-попълване: марка, сериен, дата, тип обслужване",
      "Готов PDF за разпечатване или подпис на телефон",
      "Word версия за корекции при специални случаи",
      "Архив на всички протоколи в системата (по клиент, обект, дата)",
    ],
  },
  {
    n: "04",
    title: "Tracking на 3 вида обслужване",
    body: "Системата следи кога всеки пожарогасител подлежи на обслужване — не пропускате срок.",
    bullets: [
      "Техническо обслужване · всеки 2 години → авто-известие 30 дни преди",
      "Презареждане · при нужда → tracking на дата на последно",
      "Хидростатично изпитване · всеки 10 години → +10г живот",
      "Календар view: кои пожарогасители са за обслужване този месец",
      "Авто-известие до клиента (имейл/SMS) преди срок",
    ],
  },
  {
    n: "05",
    title: "Управление на обекти и клиенти",
    body: "Всеки клиент има карта с обектите си, пожарогасителите на всеки обект и пълна история.",
    bullets: [
      "Карта на клиент → списък обекти → пожарогасители на обект",
      "История на всички обслужвания и протоколи",
      "Следваща дата за обслужване — по обект и по пожарогасител",
      "Бърз достъп от телефон при посещение",
    ],
  },
  {
    n: "06",
    title: "Връзка с уебсайт · поръчки и заявки",
    body: "Поръчките от уебсайта влизат директно в системата. Без двойно въвеждане.",
    bullets: [
      "Form на сайта → автоматично нов клиент/обект в системата",
      "Заявки за обслужване → разпределяне на техник",
      "Известие в Telegram за нова поръчка",
      "Status update на клиента (автоматично имейл/SMS)",
    ],
  },
  {
    n: "07",
    title: "Многоезичен AI чат · за чуждестранни клиенти",
    body: "Експанзия към Румъния и Гърция? AI асистент на сайта говори с клиентите на техния език.",
    bullets: [
      "Български (основно)",
      "Румънски · за пазар Румъния",
      "Гръцки · за пазар Гърция",
      "Английски · за международни клиенти",
      "Чат-бот на уебсайта · разпознава езика на посетителя автоматично",
      "*Доплащане за multilingual — отделна Phase 2",
    ],
  },
];

const PROCESS = [
  { step: "1", title: "Анализ на текущия протокол", body: "Изпращате ми примерен ваш протокол → анализирам формата и алгоритъма за дати." },
  { step: "2", title: "План + демо", body: "Подготвям конкретен план + демо с примерни пожарогасители." },
  { step: "3", title: "Изграждане", body: "30-45 дни до пълно стартиране — основна система + QR + протоколи + tracking." },
  { step: "4", title: "Старт + тренинг", body: "Стартиране на системата с реалните ви данни и онлайн тренинг на екипа." },
  { step: "5", title: "Поддръжка", body: "30 дни безплатна + постоянна оптимизация." },
];

const WHY = [
  { title: "Изграждаме по поръчка", body: "Не продаваме готов SaaS. Системата се прави около вашите конкретни процеси за пожарогасители." },
  { title: "Повече обем без повече хора", body: "Без автоматизация ще ви трябват повече хора с ръст на бизнеса. С AI — същият екип, повече обекти, същият контрол." },
  { title: "Локален екип", body: "От Пловдив сме. Лична комуникация, лично присъствие при разговор и тренинг." },
  { title: "Готови за разширение", body: "Когато сте готови за Румъния и Гърция — multilingual AI се добавя върху същата система." },
];

export default function Antoan09Page() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220, 38, 38, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 1) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 25%, rgba(220, 38, 38, 0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(249, 115, 22, 0.10) 0%, transparent 45%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
          <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            ПРЕЗЕНТАЦИЯ · {today}
          </p>

          <p className="mb-3 font-[family-name:var(--font-editorial)] text-2xl text-[var(--color-text-secondary)]">
            за
          </p>

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.05] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>Antoan </span>
            <span
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #ef4444, #dc2626 50%, #b91c1c)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              09 EOOD
            </span>
          </h1>

          <p className="mt-6 inline-block w-fit rounded-full border border-[var(--color-border-bright)] bg-[rgba(220,38,38,0.08)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-red-bright)]">
            🧯 Пожарогасители · Сервиз + Продажба
          </p>

          <div className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              AI система за управление на пожарогасители — <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">QR сканиране, автоматични протоколи, проследяване на 3 вида обслужване и проследяване по обект</span>. Повече обем без увеличаване на хора.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div aria-hidden className="h-px w-12" style={{ background: "var(--color-red-bright)" }} />
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              За Валентин Вълков · „ПроМаркетинг" ЕООД
            </p>
          </div>

          <div className="mt-20 flex flex-wrap gap-4">
            <a
              href="#design"
              className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-red-bright)",
                color: "var(--color-red-bright)",
                background: "rgba(220, 38, 38, 0.08)",
              }}
            >
              🎨 Виж дизайна
              <span aria-hidden>↓</span>
            </a>
            <a
              href="#price"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-red-bright)] hover:text-[var(--color-red-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              💎 Цена
            </a>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-red-bright)]"
            >
              7 модула
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* VISUAL DESIGN MOCKUPS */}
      <section id="design" className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(220, 38, 38, 0.02)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            Как ще изглежда системата ви
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Дизайн на <span className="text-[var(--color-red-bright)]">приложението</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Не обещаваме на хартия. Това са реалните екрани, които вашите техници ще използват от телефона си — на терен, в реално време.
          </p>

          {/* MOCKUP 1: QR Scanner */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">Изглед 01</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">QR Scanner · мигновено разпознаване</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Техникът отваря телефона, сканира QR на пожарогасителя → излизат всички детайли + бутон за нов протокол.
            </p>

            <div className="flex flex-wrap items-start justify-center gap-6">
              {/* Phone 1 - Scanner */}
              <div className="w-[220px] overflow-hidden rounded-2xl border-4 border-[var(--color-border-bright)] bg-[#0a0408] shadow-2xl">
                <div className="bg-black px-2 py-1 text-center">
                  <span className="inline-block h-1 w-12 rounded-full bg-white/20" />
                </div>
                <div className="p-3">
                  <p className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/50">📷 СКАНИРАЙ QR</p>
                  <div className="relative aspect-square rounded-lg bg-gradient-to-br from-red-900/40 to-orange-900/30">
                    {/* QR placeholder */}
                    <div className="absolute inset-8 grid grid-cols-5 grid-rows-5 gap-0.5 opacity-90">
                      {[1,0,1,0,1,1,1,0,1,1,1,0,1,1,0,0,1,1,0,1,1,0,1,0,1].map((b, i) => (
                        <div key={i} className="rounded-sm" style={{ background: b ? "white" : "transparent" }} />
                      ))}
                    </div>
                    {/* Corner brackets */}
                    <div className="absolute inset-2 border-2 border-[var(--color-red-bright)]" style={{ borderImage: "linear-gradient(45deg, transparent 25%, var(--color-red-bright) 25%, var(--color-red-bright) 75%, transparent 75%) 1" }} />
                  </div>
                  <p className="mt-2 text-center text-[9px] text-white/60">Насочи към QR на пожарогасител</p>
                </div>
              </div>

              {/* Phone 2 - Detail */}
              <div className="w-[220px] overflow-hidden rounded-2xl border-4 border-[var(--color-border-bright)] bg-[#0a0408] shadow-2xl">
                <div className="bg-black px-2 py-1 text-center">
                  <span className="inline-block h-1 w-12 rounded-full bg-white/20" />
                </div>
                <div className="p-3">
                  <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-white/50">🧯 ПОЖАРОГАСИТЕЛ</p>
                  <p className="text-base font-bold text-white">Спарк · 6kg</p>
                  <p className="text-[10px] text-white/60">Сериен № 0036 · ID-8421</p>
                  <div className="my-2 h-px bg-white/10" />
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-white/40">Обект:</span><span className="text-white">Складове Дунав</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Клиент:</span><span className="text-white">ЕТ Орлов</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Последно:</span><span className="text-white">18.05.2024</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Следващо:</span><span className="text-[var(--color-red-bright)] font-bold">18.05.2026 · 🟡 8 дни</span></div>
                  </div>
                  <button className="mt-2 w-full rounded bg-[var(--color-red)] py-1.5 text-[10px] font-bold text-white">📋 Нов протокол</button>
                </div>
              </div>

              {/* Phone 3 - Protocol */}
              <div className="w-[220px] overflow-hidden rounded-2xl border-4 border-[var(--color-border-bright)] bg-[#0a0408] shadow-2xl">
                <div className="bg-black px-2 py-1 text-center">
                  <span className="inline-block h-1 w-12 rounded-full bg-white/20" />
                </div>
                <div className="p-3">
                  <p className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/50">📄 ПРОТОКОЛ #4827</p>
                  <div className="space-y-1 rounded bg-white/5 p-2 text-[9px]">
                    <p className="text-white font-bold">Antoan 09 EOOD</p>
                    <p className="text-white/60">Сервизен протокол</p>
                    <div className="my-1 h-px bg-white/10" />
                    <p className="text-white/80">🧯 Спарк 6kg · №0036</p>
                    <p className="text-white/80">📅 27.05.2026</p>
                    <p className="text-white/80">✓ Техническо обслужване</p>
                    <p className="text-white/80">✓ Презареждане</p>
                    <p className="text-white/50">Следваща дата: 27.05.2028</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <button className="w-full rounded bg-[var(--color-red)] py-1 text-[9px] font-bold text-white">📥 PDF</button>
                    <button className="w-full rounded border border-white/20 py-1 text-[9px] text-white/80">✍️ Подпис</button>
                    <button className="w-full rounded border border-white/20 py-1 text-[9px] text-white/80">📧 Изпрати</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 2: Telegram AI */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">Изглед 02</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Telegram · резервен план без QR</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Ако QR кодът е размит или нечетлив — техникът прави снимка през Telegram. AI разпознава марката и серийния номер автоматично.
            </p>

            <div className="mx-auto max-w-md rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0a0408] p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="rounded bg-[#0088cc] px-1.5 py-0.5 text-[9px] font-bold text-white">Telegram</span>
                <span className="text-[10px] text-white/60">Antoan 09 AI Bot</span>
                <span className="ml-auto text-[10px] text-[#22c55e]">● онлайн</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-end">
                  <div className="rounded-lg rounded-br-sm bg-[#0088cc]/20 px-3 py-2 max-w-[80%]">
                    <div className="mb-1 flex h-16 items-center justify-center rounded bg-gradient-to-br from-orange-900/40 to-red-900/40">
                      <span className="text-2xl">📷</span>
                    </div>
                    <p className="text-[10px] text-white/80">снимка на пожарогасител</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="rounded-lg rounded-bl-sm bg-white/5 px-3 py-2 text-[10px] text-white max-w-[85%]">
                    <p className="font-bold text-[var(--color-red-bright)]">🤖 AI разпозна:</p>
                    <ul className="mt-1 space-y-0.5 text-white/80">
                      <li>• Марка: <strong className="text-white">Спарк</strong></li>
                      <li>• Модел: <strong className="text-white">6kg прахов</strong></li>
                      <li>• Сериен №: <strong className="text-white">0036</strong></li>
                      <li>• Confidence: 96%</li>
                    </ul>
                    <p className="mt-2 text-[9px] text-white/60">Това ли е пожарогасителят?</p>
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <button className="rounded bg-[#22c55e]/20 px-3 py-1 text-[10px] text-[#22c55e]">✓ Да, генерирай протокол</button>
                </div>
                <div className="flex">
                  <div className="rounded-lg rounded-bl-sm bg-white/5 px-3 py-2 text-[10px] text-white">
                    ✅ Протокол #4827 готов · <a className="text-[var(--color-red-bright)]">отвори PDF →</a>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded border border-[var(--color-red)]/30 bg-[var(--color-red)]/5 p-2">
                <p className="text-[9px] text-[var(--color-red-bright)]">💡 Ако AI не разпознае:</p>
                <p className="mt-1 text-[10px] text-white/70">Просто напиши „Спарк 0036" в чата → системата го въвежда.</p>
              </div>
            </div>
          </div>

          {/* MOCKUP 3 + 4: Side by side */}
          <div className="mb-20 grid gap-6 lg:grid-cols-2">
            {/* Calendar */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">Изглед 03</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Календар на обслужванията</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Виждаш кои пожарогасители са „за обслужване" този месец — не пропускаш срок.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0a0408] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">📅 МАЙ 2026</p>
                  <p className="text-[10px] text-[var(--color-red-bright)]">⚠️ 23 за обслужване</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "Техническо · 2г", count: 14, color: "#facc15" },
                    { type: "Презареждане", count: 6, color: "#f97316" },
                    { type: "Хидростатично · 10г", count: 3, color: "#dc2626" },
                  ].map((c) => (
                    <div key={c.type} className="rounded border border-white/10 bg-white/5 p-2 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-white/50">{c.type}</p>
                      <p className="mt-1 text-2xl font-bold" style={{ color: c.color }}>{c.count}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/50">🔴 ТАЗИ СЕДМИЦА</p>
                  <div className="space-y-1.5">
                    {[
                      { obj: "Складове Дунав · ЕТ Орлов", count: 4, due: "Утре" },
                      { obj: "Хотел Ризорт · Бургас", count: 12, due: "Сря 29.05" },
                      { obj: "Бензиностанция Шел · София", count: 7, due: "Пет 31.05" },
                    ].map((s) => (
                      <div key={s.obj} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-1.5">
                        <div>
                          <p className="text-[10px] font-medium text-white">{s.obj}</p>
                          <p className="text-[9px] text-white/50">{s.count} пожарогасителя</p>
                        </div>
                        <span className="rounded bg-[var(--color-red)]/20 px-2 py-0.5 text-[9px] text-[var(--color-red-bright)]">{s.due}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Object Detail */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">Изглед 04</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Карта на обект</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Един обект → всички пожарогасители на него → пълна история на обслужвания.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0a0408] p-4 shadow-2xl">
                <div className="mb-3">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/50">🏭 ОБЕКТ</p>
                  <p className="text-base font-bold text-white">Складове Дунав</p>
                  <p className="text-[10px] text-white/50">ЕТ Орлов · ул. Капитан Райчо 12, Русе</p>
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Общо", value: "24" },
                    { label: "За обслужв.", value: "4", color: "#facc15" },
                    { label: "ОК", value: "20", color: "#22c55e" },
                  ].map((s) => (
                    <div key={s.label} className="rounded border border-white/10 bg-white/5 p-2 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-white/50">{s.label}</p>
                      <p className="mt-1 text-xl font-bold" style={{ color: s.color ?? "white" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-white/50">🧯 ПОЖАРОГАСИТЕЛИ</p>
                <div className="space-y-1">
                  {[
                    { id: "0036", brand: "Спарк 6kg", status: "🟡 За 8 дни" },
                    { id: "0028", brand: "Спарк 12kg", status: "🟢 ОК · 14м" },
                    { id: "P-441", brand: "Полуш 6kg", status: "🟡 За 8 дни" },
                    { id: "P-442", brand: "Полуш 6kg", status: "🟢 ОК · 18м" },
                  ].map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-1.5">
                      <div>
                        <p className="text-[10px] font-medium text-white">{p.brand} · №{p.id}</p>
                      </div>
                      <span className="text-[9px] text-white/70">{p.status}</span>
                    </div>
                  ))}
                  <p className="text-center text-[9px] text-white/40">... и още 20</p>
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 5: Dashboard */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">Изглед 05</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Dashboard · всичко на едно място</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Влизаш сутрин и виждаш ден на работа за 5 секунди. Колко за обслужване, кои клиенти трябва да се обадиш, нови поръчки от уебсайта.
            </p>

            <div className="overflow-hidden rounded-lg border-2 border-[var(--color-border-bright)] bg-[#1a0a14] shadow-2xl">
              <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] bg-black/40 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500/60" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <span className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-3 flex-1 rounded bg-white/5 px-3 py-1 text-xs font-mono text-white/60">
                  antoan09.bg/dashboard
                </span>
                <span className="rounded-full bg-[var(--color-red)]/20 px-3 py-1 text-[10px] font-mono text-[var(--color-red-bright)]">
                  🧯 Управител
                </span>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">27 МАЙ 2026 · СРЯДА</p>
                  <h4 className="mt-1 font-display text-2xl font-bold text-white">Добро утро, управител</h4>
                </div>
                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: "ОБСЛУЖЕНИ ДНЕС", value: "47", hint: "по 3 техника", color: "#22c55e" },
                    { label: "ЗА ОБСЛУЖВАНЕ", value: "23", hint: "тази седмица", color: "#facc15" },
                    { label: "ПРОСРОЧЕНИ", value: "2", hint: "спешно!", color: "#dc2626" },
                    { label: "НОВИ ПОРЪЧКИ", value: "5", hint: "от уебсайта", color: "#f97316" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-md border border-white/10 bg-white/5 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="mt-0.5 text-[10px] text-white/60">{s.hint}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/60">📈 ОБСЛУЖЕНИ · ПОСЛЕДНИ 4 СЕДМИЦИ</p>
                    <div className="flex h-32 items-end justify-around gap-1">
                      {[280, 305, 320, 287].map((h, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-[var(--color-red)] to-[var(--color-red-bright)]"
                            style={{ height: `${(h / 350) * 100}%`, opacity: 0.7 + (i / 8) }}
                          />
                          <span className="text-[9px] text-white/50">{h}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-[9px] text-white/40">Ръст на обема с пълна автоматизация</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/60">👥 ТЕХНИЦИ ДНЕС</p>
                    <div className="space-y-2">
                      {[
                        { name: "Петър", obj: "Складове Дунав", count: 18, status: "🟢" },
                        { name: "Иван", obj: "Бензиностанция Шел", count: 14, status: "🟡" },
                        { name: "Георги", obj: "Хотел Ризорт Бургас", count: 15, status: "🟢" },
                      ].map((t) => (
                        <div key={t.name} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-1.5">
                          <div>
                            <p className="text-[10px] font-medium text-white">{t.status} {t.name}</p>
                            <p className="text-[9px] text-white/50">{t.obj}</p>
                          </div>
                          <span className="text-[10px] font-bold text-[var(--color-red-bright)]">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Design philosophy footer */}
          <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-red-bright)]">Дизайн философия</p>
            <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl font-bold leading-tight">
              <span className="text-[var(--color-red-bright)]">2 секунди</span> от QR до протокол.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Сканираш QR → излизат данните → натискаш бутон → готов е протоколът. Никакво писане. Никакви листчета по офиса.
            </p>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            7 модула · едно цяло
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Целият <span className="text-[var(--color-red-bright)]">процес</span> в едно приложение.
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div
                key={m.n}
                className="relative overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-7 transition-colors hover:border-[var(--color-border-bright)]"
              >
                <div className="mb-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-red)]">
                  {m.n}
                </div>
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-xl font-bold leading-tight">
                  {m.title}
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {m.body}
                </p>
                <ul className="space-y-2">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-xs leading-relaxed text-[var(--color-text-primary)]">
                      <span aria-hidden className="text-[var(--color-red-bright)]">▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICE */}
      <section id="price" className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(220, 38, 38, 0.03)" }}>
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <p className="mb-4 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            Цена · еднократно
          </p>
          <h2 className="mb-12 text-center font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Пълна <span className="text-[var(--color-red-bright)]">система</span>.
          </h2>

          <div
            className="relative rounded-lg border-2 bg-[var(--color-bg-deep)] p-10 text-center"
            style={{ borderColor: "var(--color-red-bright)", boxShadow: "0 0 60px rgba(220, 38, 38, 0.15)" }}
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-red-bright)]">
              ПЪЛНА СИСТЕМА
            </p>
            <div className="my-6 flex items-baseline justify-center gap-3">
              <span
                className="font-[family-name:var(--font-editorial)] text-7xl font-extrabold"
                style={{ color: "var(--color-red-bright)" }}
              >
                1 800 €
              </span>
              <span className="text-sm text-[var(--color-text-tertiary)]">без ДДС</span>
            </div>
            <p className="text-base text-[var(--color-text-secondary)]">⏱ 30-45 дни до пълно стартиране</p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left md:grid-cols-2">
              {[
                "QR сканиране + AI Vision",
                "Авто-генериране на протоколи (PDF/Word)",
                "Tracking · 3 вида обслужване",
                "Календар + auto-известия",
                "Управление на обекти и клиенти",
                "Връзка с уебсайт за поръчки",
                "Telegram интеграция",
                "30 дни безплатна поддръжка",
              ].map((f) => (
                <div key={f} className="flex gap-2 text-sm">
                  <span aria-hidden style={{ color: "var(--color-red-bright)" }}>✓</span>
                  <span className="text-[var(--color-text-primary)]">{f}</span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs text-[var(--color-text-tertiary)]">
              Плащане: 50% при подписване · 50% при стартиране · ДДС се добавя при фактуриране
            </p>

            <div className="mt-6 rounded-lg border border-dashed border-[var(--color-orange)]/30 bg-[var(--color-orange)]/5 p-4">
              <p className="text-xs text-[var(--color-orange)] font-bold">+ ОПЦИЯ ЗА ПО-НАТАТЪК</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Многоезичен AI чат за чуждестранни клиенти (BG/RO/EL/EN) + детайлно проследяване и анализ по обект (история, графики, прогнози) — отделна Phase 2, договаряме като дойде време.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(220, 38, 38, 0.02)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            Защо ние
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Не сме <span className="text-[var(--color-red-bright)]">SaaS</span> компания.
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className="border-l-2 border-[var(--color-red)] pl-6">
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-2xl font-bold">{w.title}</h3>
                <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            Как работим
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            От разговор до <span className="text-[var(--color-red-bright)]">стартиране</span>.
          </h2>
          <div className="space-y-6">
            {PROCESS.map((p) => (
              <div key={p.step} className="flex flex-col gap-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-6 md:flex-row md:items-center md:gap-8 md:p-8">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-red)] font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-red-bright)]">
                  {p.step}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-[family-name:var(--font-editorial)] text-2xl font-bold">{p.title}</h3>
                  <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
          <p className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-red-bright)]">
            Следваща стъпка
          </p>
          <h2 className="mb-8 font-[family-name:var(--font-editorial)] text-[clamp(40px,7vw,84px)] font-extrabold leading-[0.95]">
            Готови сме за <span className="text-[var(--color-red-bright)]">разговор</span>.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Изпратете ми примерен ваш протокол → анализирам формата → правим демо с вашите реални данни.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-3 rounded-full bg-[var(--color-red)] px-10 py-5 text-base font-bold uppercase tracking-[0.2em] text-white transition-transform hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
            >
              📞 +359 877 399 963
              <span aria-hidden>→</span>
            </a>
          </div>

          <div className="mt-20 border-t border-[var(--color-border-default)] pt-10 text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              „ПроМаркетинг" ЕООД · Ивайло Петев — управител
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
              ivailopetev38@gmail.com · promarketing.pw
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
