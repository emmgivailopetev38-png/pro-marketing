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
  amber: "#ffb800",
  orange: "#ff8a3c",
  border: "#E2E8F0",
  panel: "#FFF8E7",
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
  topBar: { height: 8, backgroundColor: C.amber },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brand: { fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: 0.6 },
  brandAccent: { color: C.amber },
  meta: {
    fontSize: 7,
    color: C.inkSoft,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  eyebrow: {
    fontSize: 7,
    color: C.orange,
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
  h1Accent: { color: C.amber },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: C.panel,
    borderLeftWidth: 3,
    borderLeftColor: C.amber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 9,
    color: C.ink,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  lead: { fontSize: 10, color: C.inkSoft, lineHeight: 1.55, marginBottom: 14 },
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
  modulesGrid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  moduleWrap: {
    width: "50%",
    padding: 3,
  },
  moduleCard: {
    backgroundColor: C.panel,
    borderRadius: 4,
    padding: 9,
    borderLeftWidth: 3,
    borderLeftColor: C.amber,
  },
  moduleNum: {
    fontSize: 7,
    color: C.orange,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  moduleTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 3,
  },
  moduleBody: { fontSize: 8, color: C.inkSoft, lineHeight: 1.4 },
  bulletRow: {
    flexDirection: "row",
    marginTop: 2,
    paddingLeft: 4,
  },
  bullet: { width: 8, color: C.amber, fontSize: 8 },
  bulletText: { flex: 1, fontSize: 7.5, color: C.ink, lineHeight: 1.4 },
  // Process steps
  stepRow: {
    flexDirection: "row",
    marginTop: 8,
    backgroundColor: C.panel,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.amber,
    color: C.amber,
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
    paddingTop: 4,
    marginRight: 12,
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 2 },
  stepDesc: { fontSize: 9, color: C.inkSoft, lineHeight: 1.4 },
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

const MODULES = [
  {
    n: "01",
    title: "Единен Dashboard",
    body: "Един екран — целият бизнес. Активни обекти, склад, разходи, входящи плащания, документи.",
    bullets: [
      "Преглед на текущи строителни обекти",
      "Финансово състояние live по проект",
      "Складова наличност + ниска бройка alerts",
      "Изпълнение на КСС спрямо доставено",
    ],
  },
  {
    n: "02",
    title: "Склад + Логистика",
    body: "Управление с QR кодове и AI разпознаване на доставени материали по снимка.",
    bullets: [
      "Снимка на фактура → AI чете и влиза в склада",
      "Материали изнесени към обект — с шофьор",
      "Прогноза за следваща доставка",
      "История на цени от различни доставчици",
    ],
  },
  {
    n: "03",
    title: "КСС + Документи",
    body: "Цифрова обработка на КСС таблици. Сравнение спрямо реално свършена работа.",
    bullets: [
      "Качване от Excel → извличане на позиции",
      "Маркиране 'завършено' → отчет за клиента",
      "Папка за всеки обект с пълна история",
      "Авто-генериране на актове от шаблон",
    ],
  },
  {
    n: "04",
    title: "Счетоводство · автоматизация",
    body: "Връзка между обекти и счетоводството без двойно въвеждане.",
    bullets: [
      "Фактури → разпознаване → по обект",
      "Export към Microinvest / Бизнес навигатор",
      "Месечни справки приходи/разходи по обект",
      "Telegram нотификации за просрочки",
    ],
  },
  {
    n: "05",
    title: "AI Sales — клиенти и оферти",
    body: "От запитване до подписан договор — без губене на клиенти.",
    bullets: [
      "Авто-разпознаване от Facebook, имейл, тел.",
      "AI генерира предварителна оферта",
      "Договор по шаблон, готов за подпис",
      "Tracking: запитване → договор → плащане",
    ],
  },
  {
    n: "06",
    title: "Чат бот на български",
    body: "Управлявате цялата система с разговор. Без програмиране.",
    bullets: [
      "Колко струваме на обект Витоша 24?",
      "Прати Атанас на склада в 8 утре",
      "Кой клиент не е платил 30+ дни?",
      "Направи актове за този месец",
    ],
  },
];

const PROCESS = [
  { step: "1", title: "Разговор", body: "30 минути — обсъждаме процесите, болезнените места, какво искате да отпадне." },
  { step: "2", title: "Демо", body: "Подготвям конкретно демо на dashboard-а с примерни данни от вашия бранш." },
  { step: "3", title: "Изграждане", body: "От 30 до 60 дни до пълно стартиране — според големината на проекта. Работим с екипа ви." },
  { step: "4", title: "Инсталация", body: "1-3 работни дни на място при вас. Тренинг + настройка с реалните ви данни." },
  { step: "5", title: "Поддръжка", body: "30 дни безплатна поддръжка, корекции, оптимизация. После — по договорка." },
];

export function TeodorPresentationDocument() {
  const today = new Date().toLocaleDateString("bg-BG");
  return (
    <Document title="Презентация · Теодор Лозев × ProMarketing" author="ПроМаркетинг ЕООД">
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <View style={s.brandRow}>
            <Text style={s.brand}>
              Pro<Text style={s.brandAccent}>Marketing</Text> LTD
            </Text>
            <Text style={s.meta}>Презентация · {today}</Text>
          </View>

          <Text style={s.eyebrow}>Персонална презентация</Text>
          <Text style={s.h1}>
            AI операционна система <Text style={s.h1Accent}>за Теодор Лозев</Text>
          </Text>
          <Text style={s.tag}>СТРОИТЕЛСТВО</Text>
          <Text style={s.lead}>
            Един dashboard — целият строителен бизнес. Активни обекти, склад с AI разпознаване на
            фактури, КСС цифрово, счетоводство, AI Sales и чат бот на български. Изграждаме по
            поръчка, не продаваме готов SaaS.
          </Text>

          <Text style={s.sectionTitle}>Какво изграждаме</Text>
          <View style={s.modulesGrid}>
            {MODULES.map((m) => (
              <View key={m.n} style={s.moduleWrap} wrap={false}>
                <View style={s.moduleCard}>
                  <Text style={s.moduleNum}>{m.n}</Text>
                  <Text style={s.moduleTitle}>{m.title}</Text>
                  <Text style={s.moduleBody}>{m.body}</Text>
                  {m.bullets.map((b) => (
                    <View key={b} style={s.bulletRow}>
                      <Text style={s.bullet}>▸</Text>
                      <Text style={s.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Как работим</Text>
          {PROCESS.map((p) => (
            <View key={p.step} style={s.stepRow} wrap={false}>
              <Text style={s.stepNum}>{p.step}</Text>
              <View style={s.stepBody}>
                <Text style={s.stepTitle}>{p.title}</Text>
                <Text style={s.stepDesc}>{p.body}</Text>
              </View>
            </View>
          ))}

          <Text style={s.sectionTitle}>Защо ние</Text>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Изграждаме по поръчка.</Text> Не продаваме готов SaaS. Системата се прави около вашите конкретни процеси.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Реална автоматизация.</Text> AI поема рутината — четене на фактури, генериране на документи, отговори.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Без външен софтуер.</Text> Цялата система е ваша, на вашия Cloud. Не зависите от платформа.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>На място + локално.</Text> От Русе сме. Идваме при вас за тренинг и фина настройка.
            </Text>
          </View>

          <View style={s.footer}>
            <View style={s.footerCol}>
              <Text style={s.footerBold}>„ПроМаркетинг" ЕООД</Text>
              <Text>Ивайло Петев · управител</Text>
              <Text>emmgivailopetev38@gmail.com</Text>
              <Text>+359 877 399 963</Text>
            </View>
            <View style={[s.footerCol, { textAlign: "right" }]}>
              <Text>Резервирай разговор:</Text>
              <Text>promarketing.pw/booking</Text>
              <Text>Онлайн презентация:</Text>
              <Text>promarketing.pw/oferta/teodor</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
