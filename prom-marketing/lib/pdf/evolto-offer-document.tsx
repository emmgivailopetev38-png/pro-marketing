import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const FONT_HOST =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: `${FONT_HOST}/fonts/NotoSans-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_HOST}/fonts/NotoSans-Bold.ttf`, fontWeight: 700 },
  ],
});

const C = {
  bg: "#FFFFFF",
  ink: "#0a1429",
  inkSoft: "#475569",
  gold: "#FFB800",
  blue: "#3B82F6",
  border: "#E2E8F0",
  panel: "#F8FAFC",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.ink,
    fontFamily: "NotoSans",
    paddingTop: 0,
    paddingBottom: 30,
    paddingHorizontal: 0,
    fontSize: 10,
  },
  topBar: { height: 8, backgroundColor: C.gold },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brand: { fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: 0.6 },
  brandAccent: { color: C.gold },
  meta: {
    fontSize: 7,
    color: C.inkSoft,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  eyebrow: {
    fontSize: 7,
    color: C.blue,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h1: {
    fontSize: 28,
    fontWeight: 700,
    color: C.ink,
    lineHeight: 1.15,
    marginBottom: 12,
  },
  h1Accent: { color: C.gold },
  lead: { fontSize: 10, color: C.inkSoft, lineHeight: 1.55, marginBottom: 14 },
  parties: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 14,
  },
  partyCard: {
    flex: 1,
    backgroundColor: C.panel,
    borderRadius: 4,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
  },
  partyLabel: {
    fontSize: 7,
    color: C.inkSoft,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  partyName: { fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 3 },
  partyDetail: { fontSize: 8.5, color: C.inkSoft, lineHeight: 1.5 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: C.ink,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  para: { fontSize: 9.5, color: C.ink, lineHeight: 1.5, marginBottom: 4 },
  // Modules grid
  modulesGrid: {
    marginTop: 6,
  },
  moduleCard: {
    backgroundColor: C.panel,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
  },
  moduleTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 4,
  },
  moduleBody: { fontSize: 9, color: C.inkSoft, lineHeight: 1.5 },
  bulletRow: {
    flexDirection: "row",
    marginTop: 3,
    paddingLeft: 8,
  },
  bullet: { width: 10, color: C.gold, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 8.5, color: C.ink, lineHeight: 1.45 },
  // Pricing box
  priceBox: {
    flexDirection: "row",
    backgroundColor: C.panel,
    borderRadius: 6,
    padding: 16,
    marginTop: 14,
    gap: 16,
  },
  priceLeft: { flex: 1 },
  priceLabel: {
    fontSize: 7.5,
    color: C.inkSoft,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 700,
    color: C.gold,
    lineHeight: 1,
  },
  priceMeta: { fontSize: 8.5, color: C.inkSoft, marginTop: 4 },
  priceRight: {
    flex: 1,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  // Footer
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCol: { flex: 1, fontSize: 8, color: C.inkSoft, lineHeight: 1.5 },
  footerBold: { fontWeight: 700, color: C.ink },
});

const SCOPE = [
  {
    title: "Sales AI CRM",
    body: "Лична CRM система с AI агент за оценка на lead-ове, генериране на оферти, договори и проследяване на статуса до подписан клиент.",
    bullets: [
      "Auto-преглед на нови lead-ове + scoring по приоритет",
      "Авто-генериране на оферта (PDF + digital линк) от КСС таблици и компоненти по марка",
      "Авто-генериране на договор по утвърден шаблон, готов за подпис",
      "Live tracking на проекта: заявка → оферта → договор → доставка → монтаж → активиране",
      "Google Drive интеграция: автоматична папка за всеки клиент с документи, снимки, даташийтове",
    ],
  },
  {
    title: "Project & финансово проследяване",
    body: "Цялостен контрол върху приходи и разходи по проект — никаква таблица в Excel не може да направи това.",
    bullets: [
      "Качване на фактури и снимки в папката на клиента, авто-обработка от AI",
      "Проследяване на плащания и просрочия по централа",
      "Изчисление на печалба = приходи − реалните разходи (компоненти, монтаж, превоз)",
      `Telegram бот за известия в движение (напр. „Плащане получено · 12 400 €")`,
    ],
  },
  {
    title: "Content AI Engine",
    body: "Маркетинг съдържание в бранд гайда на Evolto и Solar Technology — без външна агенция.",
    bullets: [
      "1 пост/ден в социалните мрежи в брандовия глас",
      "Banner варианти за Facebook, Instagram, LinkedIn кампании",
      "Reels от обектни видеа (time-lapse от монтажи)",
      "Анализ на Google Trends + YouTube за актуални теми (фотоволтаици, ROI, финансиране)",
      "Auto-планиране на постове с твое одобрение",
    ],
  },
  {
    title: "Reklami · ежедневен анализ + репорт",
    body: "Активни кампании във Facebook/Google се отслеждават всеки ден.",
    bullets: [
      "Анализ на CTR, CPM, conversion rate, ангажимент",
      "Дневен репорт по имейл с препоръки за оптимизация",
      "Авто-пауза на underperforming реклами",
    ],
  },
  {
    title: "Чат бот контрол",
    body: "Управляваш цялата система с разговор на български.",
    bullets: [
      `"Колко kW сме инсталирали тази седмица?" → отговор + графика`,
      `"Прати follow-up на всички lead-ове, които не са отговорили 5+ дни"`,
      `"Направи пост за нов проект 42 kW в Пловдив"`,
      `"Запази 30 мин с Михаил Петров в петък 14:00"`,
    ],
  },
  {
    title: "Cloud + Hermes инфраструктура",
    body: "Изграждаме хостинг и автоматизация на собствен Cloud за Evolto + персонализиран Hermes агент за изпълнение на дълготрайни задачи (бавни анализи, отчети, follow-up).",
    bullets: [
      "Cloud setup (Vercel + Supabase или собствен сървър — по решение)",
      "Hermes background agent за асинхронни задачи",
      "Свързване на корпоративен имейл + социални мрежи на място",
    ],
  },
];

export function EvoltoOfferDocument() {
  return (
    <Document title="Оферта · Evolto × ProMarketing" author="ПроМаркетинг ЕООД">
      {/* Page 1 */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <View style={s.brandRow}>
            <Text style={s.brand}>
              Pro<Text style={s.brandAccent}>Marketing</Text> LTD
            </Text>
            <Text style={s.meta}>Оферта · {new Date().toLocaleDateString("bg-BG")}</Text>
          </View>

          <Text style={s.eyebrow}>Персонализирана оферта</Text>
          <Text style={s.h1}>
            AI операционна <Text style={s.h1Accent}>система за Evolto</Text>
          </Text>
          <Text style={s.lead}>
            Този документ описва обхвата на проекта „Sales AI CRM + Content AI Engine + Cloud
            инфраструктура" за Evolto. Изграждаме персонализирана автоматизация, която замества
            ръчните процеси по оферти, договори, проследяване на клиенти, маркетинг съдържание и
            анализ на реклами. Цел: да върнем времето на собственика за стратегически решения.
          </Text>

          <View style={s.parties}>
            <View style={s.partyCard}>
              <Text style={s.partyLabel}>Изпълнител</Text>
              <Text style={s.partyName}>„ПроМаркетинг" ЕООД</Text>
              <Text style={s.partyDetail}>
                ЕИК / ДДС № BG207223552{"\n"}
                Гр. Русе, ул. Цар Асен I-ви № 31{"\n"}
                МОЛ: Ивайло Петров Петев{"\n"}
                ivailo@promarketing.pw{"\n"}
                +359 877 399 963
              </Text>
            </View>
            <View style={s.partyCard}>
              <Text style={s.partyLabel}>Възложител</Text>
              <Text style={s.partyName}>Evolto</Text>
              <Text style={s.partyDetail}>
                Васил Бедров — собственик{"\n"}
                ЛИП Родопи, ул. Околовръстен{"\n"}
                път, 4109 Пловдив, България{"\n"}
                info@evolto.bg{"\n"}
                +359 894 255 855
              </Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>Обхват на проекта</Text>
          <View style={s.modulesGrid}>
            {SCOPE.slice(0, 3).map((m) => (
              <View key={m.title} style={s.moduleCard}>
                <Text style={s.moduleTitle}>{m.title}</Text>
                <Text style={s.moduleBody}>{m.body}</Text>
                {m.bullets.map((b) => (
                  <View key={b} style={s.bulletRow}>
                    <Text style={s.bullet}>▸</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <View style={s.brandRow}>
            <Text style={s.brand}>
              Pro<Text style={s.brandAccent}>Marketing</Text> LTD
            </Text>
            <Text style={s.meta}>Оферта · Evolto · стр. 2</Text>
          </View>

          <Text style={s.sectionTitle}>Обхват (продължение)</Text>
          <View style={s.modulesGrid}>
            {SCOPE.slice(3).map((m) => (
              <View key={m.title} style={s.moduleCard}>
                <Text style={s.moduleTitle}>{m.title}</Text>
                <Text style={s.moduleBody}>{m.body}</Text>
                {m.bullets.map((b) => (
                  <View key={b} style={s.bulletRow}>
                    <Text style={s.bullet}>▸</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Стойност и условия</Text>
          <View style={s.priceBox}>
            <View style={s.priceLeft}>
              <Text style={s.priceLabel}>Цена за изграждане</Text>
              <Text style={s.priceValue}>2 000 €</Text>
              <Text style={s.priceMeta}>без ДДС · еднократно</Text>
            </View>
            <View style={s.priceRight}>
              <Text style={s.priceLabel}>Схема на плащане</Text>
              <Text style={[s.para, { marginTop: 4 }]}>
                50% (1 000 € без ДДС) — авансово при подписване{"\n"}
                50% (1 000 € без ДДС) — след сетъп и инсталация
              </Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>Срокове</Text>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>▸</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Срок за изграждане:</Text> 10 работни дни, считани
              от датата на първото авансово плащане.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>▸</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Инсталация на място:</Text> 1 работен ден в офиса
              на Възложителя (Пловдив) — настройка на корпоративен имейл, свързване на социалните
              мрежи, инсталация на Cloud + Hermes.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>▸</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Допълнителна настройка:</Text> при необходимост от
              fine-tuning след инсталация — до 30 дни допълнителни онлайн срещи, без
              допълнително заплащане.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>▸</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Поддръжка:</Text> 30 дни безплатен саппорт след
              инсталация — въпроси, отговори и съдействие за оптимизация.
            </Text>
          </View>

          <Text style={s.sectionTitle}>Какво включва цената</Text>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              Изграждане и тестване на всички шест направления (CRM, Project, Content, Реклами,
              Чат бот, Cloud + Hermes).
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              Имплементация на брандовия гайд на Evolto + Solar Technology в съдържанието.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              Документация + видео обучение на екипа за работа със системата.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              Клауза за конфиденциалност (NDA) върху всички данни на Evolto.
            </Text>
          </View>

          <Text style={s.sectionTitle}>Какво НЕ включва</Text>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>−</Text>
            <Text style={s.bulletText}>
              Месечни абонаменти за инфраструктура (Cloud, AI API кредити, Telegram бот hosting).
              Тези разходи се поемат директно от Възложителя и се прогнозират на разговор.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>−</Text>
            <Text style={s.bulletText}>
              Платени реклами в Meta и Google (бюджетите остават при Възложителя).
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>−</Text>
            <Text style={s.bulletText}>
              Хардуер (компютри, рутери, NAS) — ако се изисква локален setup.
            </Text>
          </View>

          <View style={s.footer}>
            <View style={s.footerCol}>
              <Text style={s.footerBold}>„ПроМаркетинг" ЕООД</Text>
              <Text>Ивайло Петров Петев · управител</Text>
              <Text>ivailo@promarketing.pw</Text>
              <Text>+359 877 399 963</Text>
            </View>
            <View style={[s.footerCol, { textAlign: "right" }]}>
              <Text>Валидност на офертата: 21 дни</Text>
              <Text>promarketing.pw/oferta/evolto</Text>
              <Text>Подробна онлайн презентация ↗</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
