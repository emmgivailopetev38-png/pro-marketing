import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Cyrillic-capable font from /public/fonts.
const FONT_HOST =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://promarketing.pw");

Font.register({
  family: "NotoSans",
  fonts: [
    { src: `${FONT_HOST}/fonts/NotoSans-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_HOST}/fonts/NotoSans-Bold.ttf`, fontWeight: 700 },
  ],
});

const COLORS = {
  bg: "#07080f",
  panel: "#0d1221",
  cyan: "#00d4ff",
  violet: "#818cf8",
  textPrimary: "#e8f4ff",
  textSecondary: "#7da8cc",
  textTertiary: "#3d6080",
  border: "rgba(0, 212, 255, 0.18)",
};

const SERVICES = [
  { title: "AI чат ботове", body: "24/7 отговори: Instagram DM, Messenger, Viber, WhatsApp, сайт. Booking за хотели, качествени leads за имотни." },
  { title: "AI генератор на съдържание", body: "30+ публикации/месец в брандовия глас. Одобрение преди публикуване." },
  { title: "Lead capture + CRM", body: "Свързване с Salesforce, HubSpot, Pipedrive или custom CRM." },
  { title: "Мулти-езикова комуникация", body: "BG · EN · DE · RU. Един агент работи на всички езици." },
  { title: "Отговори на ревюта", body: "TripAdvisor, Booking.com, Google Maps. AI пише, ти одобряваш." },
  { title: "Финансова автоматизация", body: "Фактуриране, разпознаване на разходи, седмични финансови отчети." },
];

const STEPS = [
  { n: "01", title: "Discovery call", body: "30 мин. Обсъждаме клиента и обхвата. White-label или явно — ти избираш.", tag: "Безплатно" },
  { n: "02", title: "Оферта по scope", body: "Фиксирана цена за проекта в рамките на 2 работни дни. Без скрити такси.", tag: "2 раб. дни" },
  { n: "03", title: "Изпълнение + handover", body: "Изграждаме, тестваме, пускаме. Playbook + видео обучение + достъп.", tag: "30–60 дни" },
];

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.textPrimary,
    fontFamily: "NotoSans",
    paddingTop: 32,
    paddingHorizontal: 32,
    paddingBottom: 24,
    fontSize: 9,
  },
  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  brandAccent: { color: COLORS.cyan },
  headerMeta: {
    fontSize: 6.5,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // Section eyebrow / titles
  eyebrow: {
    fontSize: 6.5,
    color: COLORS.violet,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  hero: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.textPrimary,
    lineHeight: 1.15,
    marginBottom: 10,
  },
  heroAccent: { color: COLORS.cyan },
  lead: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  // Service grid (2 columns x 3 rows)
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardWrap: {
    width: "50%",
    padding: 3,
  },
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: 3,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.cyan,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  cardBody: {
    fontSize: 7.5,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },
  // Process row (3 columns)
  processRow: {
    flexDirection: "row",
  },
  processCol: {
    flex: 1,
    padding: 3,
  },
  processInner: {
    backgroundColor: COLORS.panel,
    borderRadius: 3,
    padding: 10,
  },
  processNum: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.cyan,
    marginBottom: 4,
  },
  processTag: {
    fontSize: 6,
    color: COLORS.violet,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  processTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  processBody: {
    fontSize: 7,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerName: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  footerContact: {
    fontSize: 7.5,
    color: COLORS.textSecondary,
  },
  footerCta: {
    backgroundColor: COLORS.cyan,
    color: COLORS.bg,
    fontSize: 8.5,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
});

export function PartneriDocument() {
  return (
    <Document
      title="ProMarketing — Партньорска програма"
      author="ProMarketing LTD"
      subject="White-label AI автоматизация за маркетинг агенции"
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            Pro<Text style={styles.brandAccent}>Marketing</Text> LTD
          </Text>
          <Text style={styles.headerMeta}>Партньорска програма · 2026</Text>
        </View>

        {/* HERO */}
        <Text style={styles.eyebrow}>01 · Партньорска програма</Text>
        <Text style={styles.hero}>
          Ние сме твоят <Text style={styles.heroAccent}>execution екип</Text> за AI автоматизация.
        </Text>
        <Text style={styles.lead}>
          За маркетинг агенции, които обслужват хотели и имотни агенции. Ти продаваш AI автоматизация на твоите клиенти — ние я изграждаме под твоя бранд или явно като ProMarketing. Срок: 30–60 дни. Без месечни абонаменти за теб, без скрити такси.
        </Text>

        <View style={styles.divider} />

        {/* SERVICES */}
        <Text style={styles.eyebrow}>02 · Какво изпълняваме за теб</Text>
        <Text style={styles.sectionTitle}>Шест направления — един партньор</Text>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <View key={s.title} style={styles.cardWrap}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* PROCESS */}
        <Text style={styles.eyebrow}>03 · Как работим заедно</Text>
        <Text style={styles.sectionTitle}>Три стъпки до handover</Text>
        <View style={styles.processRow}>
          {STEPS.map((s) => (
            <View key={s.n} style={styles.processCol}>
              <View style={styles.processInner}>
                <Text style={styles.processNum}>{s.n}</Text>
                <Text style={styles.processTag}>{s.tag}</Text>
                <Text style={styles.processTitle}>{s.title}</Text>
                <Text style={styles.processBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerName}>Ивайло Петев · ProMarketing LTD</Text>
            <Text style={styles.footerContact}>+359 877 399 963 · ivailo@promarketing.pw</Text>
            <Text style={styles.footerContact}>promarketing.pw/partneri</Text>
          </View>
          <Text style={styles.footerCta}>Запази discovery call</Text>
        </View>
      </Page>
    </Document>
  );
}
