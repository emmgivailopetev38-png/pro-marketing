import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

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

const C = {
  bg: "#07080f",
  bgDeep: "#0d1221",
  cyan: "#00d4ff",
  cyanDim: "rgba(0, 212, 255, 0.18)",
  violet: "#818cf8",
  white: "#e8f4ff",
  gray: "#7da8cc",
  dim: "#3d6080",
};

const SERVICES = [
  { n: "01", title: "AI чат ботове", body: "24/7 отговори в Instagram, Messenger, Viber, WhatsApp и сайт. Booking за хотели · качествени leads за имотни." },
  { n: "02", title: "Генератор на съдържание", body: "30+ публикации/месец в брандовия глас на клиента. Одобрение преди публикуване." },
  { n: "03", title: "Lead capture + CRM", body: "Свързване с Salesforce, HubSpot, Pipedrive или custom CRM." },
  { n: "04", title: "Мулти-езикова комуникация", body: "BG · EN · DE · RU — един агент работи на всички езици." },
  { n: "05", title: "Отговори на ревюта", body: "TripAdvisor, Booking.com, Google Maps. AI пише, ти одобряваш." },
  { n: "06", title: "Финансова автоматизация", body: "Фактуриране, разходи, седмични финансови отчети." },
];

const STEPS = [
  { n: "01", tag: "Безплатно", title: "Discovery call", body: "30 мин. Обсъждаме клиента и обхвата. White-label или явно — ти избираш." },
  { n: "02", tag: "2 раб. дни", title: "Оферта по scope", body: "Фиксирана цена за проекта в рамките на 2 работни дни. Без скрити такси." },
  { n: "03", tag: "30–60 дни", title: "Изпълнение + handover", body: "Изграждаме, тестваме, пускаме. Playbook + видео обучение + достъп." },
];

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.white,
    fontFamily: "NotoSans",
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    fontSize: 9,
  },
  // Top accent bar
  topBar: {
    height: 6,
    backgroundColor: C.cyan,
  },
  // Brand row
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 36,
    paddingTop: 22,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 13,
    fontWeight: 700,
    color: C.white,
    letterSpacing: 1.5,
  },
  brandAccent: { color: C.cyan },
  brandMeta: {
    fontSize: 6.5,
    color: C.dim,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // Content padding
  body: {
    paddingHorizontal: 36,
  },
  // Hero
  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  heroEyebrowBar: {
    width: 20,
    height: 1,
    backgroundColor: C.cyan,
    marginRight: 10,
  },
  heroEyebrow: {
    fontSize: 7,
    color: C.violet,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  hero: {
    fontSize: 28,
    fontWeight: 700,
    color: C.white,
    lineHeight: 1.1,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  heroAccent: { color: C.cyan },
  lead: {
    fontSize: 10,
    color: C.gray,
    lineHeight: 1.55,
    maxWidth: 460,
    marginBottom: 6,
  },
  // Pill row under hero
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 4,
  },
  pill: {
    borderWidth: 1,
    borderColor: C.cyanDim,
    backgroundColor: "rgba(0,212,255,0.06)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 8,
    color: C.cyan,
    fontWeight: 700,
    marginRight: 6,
  },
  // Section heading
  sectionLead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: C.white,
  },
  sectionEyebrow: {
    fontSize: 7,
    color: C.violet,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: C.cyanDim,
    marginBottom: 12,
  },
  // Service cards
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardWrap: {
    width: "33.33%",
    padding: 3,
  },
  card: {
    backgroundColor: C.bgDeep,
    borderRadius: 4,
    padding: 11,
    minHeight: 80,
  },
  cardNum: {
    fontSize: 8.5,
    fontWeight: 700,
    color: C.cyan,
    letterSpacing: 1,
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.white,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 7.5,
    color: C.gray,
    lineHeight: 1.45,
  },
  // Process — bigger
  processRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  processCol: {
    flex: 1,
    padding: 3,
  },
  processInner: {
    backgroundColor: C.bgDeep,
    borderRadius: 4,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
  },
  processNum: {
    fontSize: 28,
    fontWeight: 700,
    color: C.cyan,
    lineHeight: 1,
    marginBottom: 6,
  },
  processTag: {
    fontSize: 6.5,
    color: C.violet,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  processTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.white,
    marginBottom: 3,
  },
  processBody: {
    fontSize: 7.5,
    color: C.gray,
    lineHeight: 1.45,
  },
  // CTA bar bottom
  ctaBar: {
    marginTop: "auto",
    backgroundColor: C.cyan,
    paddingVertical: 14,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctaLeft: {},
  ctaHeadline: {
    fontSize: 12,
    fontWeight: 700,
    color: C.bg,
    marginBottom: 2,
  },
  ctaSub: {
    fontSize: 8.5,
    color: C.bg,
    opacity: 0.85,
  },
  ctaRight: {
    alignItems: "flex-end",
  },
  ctaPhone: {
    fontSize: 11,
    fontWeight: 700,
    color: C.bg,
    marginBottom: 1,
  },
  ctaUrl: {
    fontSize: 8.5,
    color: C.bg,
    opacity: 0.85,
  },
  // Bottom signature
  sig: {
    paddingVertical: 10,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  sigText: {
    fontSize: 7,
    color: C.dim,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});

export function PartneriDocument() {
  return (
    <Document
      title="ProMarketing — Партньорска програма"
      author="ProMarketing LTD"
      subject="White-label AI автоматизация за маркетинг агенции"
    >
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />

        {/* BRAND ROW */}
        <View style={s.brandRow}>
          <Text style={s.brand}>
            Pro<Text style={s.brandAccent}>Marketing</Text> LTD
          </Text>
          <Text style={s.brandMeta}>Партньорска програма · 2026</Text>
        </View>

        <View style={s.body}>
          {/* HERO */}
          <View style={s.heroEyebrowRow}>
            <View style={s.heroEyebrowBar} />
            <Text style={s.heroEyebrow}>За маркетинг агенции в hotel & real-estate ниша</Text>
          </View>
          <Text style={s.hero}>
            Ние сме твоят{"\n"}
            <Text style={s.heroAccent}>execution екип</Text> за AI автоматизация.
          </Text>
          <Text style={s.lead}>
            Ти продаваш на клиентите си — ние изграждаме под твоя бранд или явно като ProMarketing. Без месечен абонамент. Без скрити такси. Фиксирана цена за всеки проект.
          </Text>
          <View style={s.pillRow}>
            <Text style={s.pill}>White-label</Text>
            <Text style={s.pill}>30–60 дни</Text>
            <Text style={s.pill}>Hotels · Real-estate</Text>
            <Text style={s.pill}>BG · EN · DE · RU</Text>
          </View>

          {/* SERVICES */}
          <View style={s.sectionLead}>
            <Text style={s.sectionTitle}>Шест направления — един партньор</Text>
            <Text style={s.sectionEyebrow}>02 · Услуги</Text>
          </View>
          <View style={s.divider} />
          <View style={s.grid}>
            {SERVICES.map((sv) => (
              <View key={sv.n} style={s.cardWrap}>
                <View style={s.card}>
                  <Text style={s.cardNum}>{sv.n}</Text>
                  <Text style={s.cardTitle}>{sv.title}</Text>
                  <Text style={s.cardBody}>{sv.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* PROCESS */}
          <View style={s.sectionLead}>
            <Text style={s.sectionTitle}>Три стъпки до handover</Text>
            <Text style={s.sectionEyebrow}>03 · Процес</Text>
          </View>
          <View style={s.divider} />
          <View style={s.processRow}>
            {STEPS.map((st) => (
              <View key={st.n} style={s.processCol}>
                <View style={s.processInner}>
                  <Text style={s.processNum}>{st.n}</Text>
                  <Text style={s.processTag}>{st.tag}</Text>
                  <Text style={s.processTitle}>{st.title}</Text>
                  <Text style={s.processBody}>{st.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA BAR */}
        <View style={s.ctaBar}>
          <View style={s.ctaLeft}>
            <Text style={s.ctaHeadline}>Готов да тестваш партньорството?</Text>
            <Text style={s.ctaSub}>Запази безплатна 30-мин discovery call</Text>
          </View>
          <View style={s.ctaRight}>
            <Text style={s.ctaPhone}>+359 877 399 963</Text>
            <Text style={s.ctaUrl}>promarketing.pw/partneri</Text>
          </View>
        </View>

        {/* SIGNATURE */}
        <View style={s.sig}>
          <Text style={s.sigText}>Ивайло Петев · ivailo@promarketing.pw</Text>
          <Text style={s.sigText}>ProMarketing LTD · 2026</Text>
        </View>
      </Page>
    </Document>
  );
}
