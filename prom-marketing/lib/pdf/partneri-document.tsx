import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register a Cyrillic-capable font served from /public. We use absolute URLs
// because @react-pdf/renderer's font loader expects URLs, not fs paths.
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
  { title: "AI чат ботове", body: "24/7 отговори на Instagram DM, Messenger, Viber, WhatsApp и сайт. Booking за хотели · qualified leads за имотни." },
  { title: "AI генератор на съдържание", body: "30+ публикации/месец в брандовия глас на клиента. Одобрение преди публикуване." },
  { title: "Lead capture + CRM", body: "Свързване на форми и реклами с Salesforce, HubSpot, Pipedrive или custom CRM." },
  { title: "Мулти-езикова комуникация", body: "BG · EN · DE · RU. Един агент работи на всички езици според кой пише." },
  { title: "Отговори на ревюта", body: "TripAdvisor, Booking.com, Google Maps. AI чете тона и предлага персонализиран отговор." },
  { title: "Финансова автоматизация", body: "Фактуриране, разпознаване на разходи, седмични отчети за cash flow." },
];

const STEPS = [
  { n: "01", title: "Discovery call", body: "30 мин. Обсъждаме клиента, целите, обхвата. White-label или ProMarketing-branded — ти решаваш.", tag: "Безплатно" },
  { n: "02", title: "Оферта по scope", body: "Фиксирана цена за конкретния проект в рамките на 2 работни дни. Без скрити такси.", tag: "2 раб. дни" },
  { n: "03", title: "Изпълнение + handover", body: "Изграждаме, тестваме, пускаме. Playbook, видео обучение и достъп до дашборда.", tag: "30–60 дни" },
];

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.textPrimary,
    fontFamily: "NotoSans",
    padding: 36,
    fontSize: 9,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  brand: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  brandAccent: { color: COLORS.cyan },
  headerMeta: {
    fontSize: 7,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  eyebrow: {
    fontSize: 7,
    color: COLORS.violet,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h1: {
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.textPrimary,
    lineHeight: 1.05,
    marginBottom: 12,
  },
  h1Accent: { color: COLORS.cyan },
  lead: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  card: {
    width: "50%",
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  cardInner: {
    backgroundColor: COLORS.panel,
    borderRadius: 3,
    padding: 10,
    borderLeft: `2px solid ${COLORS.cyan}`,
    height: "100%",
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  cardBody: {
    fontSize: 8,
    color: COLORS.textSecondary,
    lineHeight: 1.45,
  },
  processRow: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  processCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  processInner: {
    backgroundColor: COLORS.panel,
    borderRadius: 3,
    padding: 10,
    height: "100%",
  },
  processNum: {
    fontSize: 18,
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
    fontSize: 7.5,
    color: COLORS.textSecondary,
    lineHeight: 1.45,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTop: `1px solid ${COLORS.border}`,
  },
  footerCol: { fontSize: 8, color: COLORS.textSecondary },
  footerStrong: { fontSize: 8, color: COLORS.textPrimary, fontWeight: 700 },
  footerCta: {
    backgroundColor: COLORS.cyan,
    color: COLORS.bg,
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            Pro<Text style={styles.brandAccent}>Marketing</Text> LTD
          </Text>
          <Text style={styles.headerMeta}>Партньорска програма · 2026</Text>
        </View>

        <Text style={styles.eyebrow}>01 · Партньорска програма</Text>
        <Text style={styles.h1}>
          Ние сме твоят <Text style={styles.h1Accent}>execution екип</Text>{"\n"}
          за AI автоматизация.
        </Text>
        <Text style={styles.lead}>
          За маркетинг агенции, които обслужват хотели и имотни агенции. Ти продаваш AI
          автоматизация на твоите клиенти — ние я изграждаме под твоя бранд или явно като
          ProMarketing. Срок: 30–60 дни. Без месечни абонаменти за теб, без скрити такси.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.eyebrow}>02 · Какво изпълняваме за теб</Text>
        <Text style={styles.sectionTitle}>Шест направления — един партньор</Text>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <View key={s.title} style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

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

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerStrong}>Ивайло Петев · ProMarketing LTD</Text>
            <Text style={styles.footerCol}>+359 877 399 963 · ivailo@promarketing.pw</Text>
            <Text style={styles.footerCol}>promarketing.pw/partneri</Text>
          </View>
          <Text style={styles.footerCta}>Запази discovery call →</Text>
        </View>
      </Page>
    </Document>
  );
}
