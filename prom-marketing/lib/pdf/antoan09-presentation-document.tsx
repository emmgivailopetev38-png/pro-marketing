import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const FONT_HOST = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: `${FONT_HOST}/fonts/NotoSans-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_HOST}/fonts/NotoSans-Bold.ttf`, fontWeight: 700 },
  ],
});

const C = {
  bg: "#FFFFFF",
  ink: "#0a0408",
  inkSoft: "#7a4848",
  red: "#dc2626",
  redBright: "#ef4444",
  orange: "#f97316",
  border: "#FCE7E7",
  panel: "#FFF5F5",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, color: C.ink, fontFamily: "NotoSans", paddingTop: 0, paddingBottom: 30, paddingHorizontal: 0, fontSize: 10 },
  topBar: { height: 8, backgroundColor: C.red },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  brand: { fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: 0.6 },
  brandAccent: { color: C.red },
  meta: { fontSize: 7, color: C.inkSoft, letterSpacing: 1.4, textTransform: "uppercase" },
  eyebrow: { fontSize: 7, color: C.redBright, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 6 },
  h1: { fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.15, marginBottom: 10 },
  h1Accent: { color: C.red },
  tag: {
    alignSelf: "flex-start", backgroundColor: C.panel, borderLeftWidth: 3, borderLeftColor: C.red,
    paddingHorizontal: 10, paddingVertical: 4, fontSize: 9, color: C.ink, marginBottom: 10,
    textTransform: "uppercase", letterSpacing: 1.5,
  },
  lead: { fontSize: 9.5, color: C.inkSoft, lineHeight: 1.5, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 16, marginBottom: 8, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modulesGrid: { marginTop: 4, flexDirection: "row", flexWrap: "wrap" },
  moduleWrap: { width: "50%", padding: 3 },
  moduleCard: { backgroundColor: C.panel, borderRadius: 4, padding: 8, borderLeftWidth: 3, borderLeftColor: C.red },
  moduleNum: { fontSize: 7, color: C.redBright, letterSpacing: 1.5, marginBottom: 1 },
  moduleTitle: { fontSize: 10, fontWeight: 700, color: C.ink, marginBottom: 2 },
  moduleBody: { fontSize: 7.5, color: C.inkSoft, lineHeight: 1.35, marginBottom: 3 },
  bulletRow: { flexDirection: "row", marginTop: 1.5, paddingLeft: 3 },
  bullet: { width: 8, color: C.red, fontSize: 7 },
  bulletText: { flex: 1, fontSize: 7, color: C.ink, lineHeight: 1.35 },
  priceBox: {
    backgroundColor: C.panel, borderRadius: 6, padding: 16, marginTop: 10,
    borderWidth: 2, borderColor: C.red, alignItems: "center",
  },
  priceLabel: { fontSize: 7, color: C.redBright, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  priceValue: { fontSize: 32, fontWeight: 700, color: C.red, marginBottom: 4 },
  priceMeta: { fontSize: 9, color: C.inkSoft, marginBottom: 8 },
  stepRow: { flexDirection: "row", marginTop: 6, backgroundColor: C.panel, borderRadius: 4, padding: 8, alignItems: "center" },
  stepNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.red, color: C.redBright, textAlign: "center", fontSize: 11, fontWeight: 700, paddingTop: 4, marginRight: 10 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 10, fontWeight: 700, color: C.ink, marginBottom: 1 },
  stepDesc: { fontSize: 8, color: C.inkSoft, lineHeight: 1.35 },
  tiersRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  tierCard: { flex: 1, backgroundColor: C.panel, borderRadius: 4, padding: 10, borderTopWidth: 3, borderTopColor: C.red },
  tierBadge: { fontSize: 6.5, color: C.redBright, letterSpacing: 1.3, marginBottom: 3, textTransform: "uppercase" },
  tierTitle: { fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 3 },
  tierPrice: { fontSize: 16, fontWeight: 700, color: C.redBright, marginBottom: 2 },
  tierPriceSub: { fontSize: 7, color: C.inkSoft, marginBottom: 5 },
  tierFeature: { flexDirection: "row", marginTop: 1.5 },
  tierCheck: { width: 8, color: C.redBright, fontSize: 7 },
  tierFeatureText: { flex: 1, fontSize: 7, color: C.ink, lineHeight: 1.3 },
  footer: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", justifyContent: "space-between" },
  footerCol: { flex: 1, fontSize: 8, color: C.inkSoft, lineHeight: 1.5 },
  footerBold: { fontWeight: 700, color: C.ink },
});

const MODULES = [
  { n: "01", title: "QR сканиране · мигновено разпознаване", body: "Сканираш QR с телефон → излизат всички детайли за пожарогасителя.", bullets: ["15 марки в България (Спарк, Полуш, Огнеборец...)", "Серийни номера (Спарк 0036, 0028 и др.)", "QR кодове се генерират и отпечатват от системата"] },
  { n: "02", title: "AI Vision · резервен план", body: "QR размит? AI разпознава от снимка.", bullets: ["Снимка през Telegram → AI разпознава", "Ако не може · техникът пише ръчно", "Voice → text · диктовка на български"] },
  { n: "03", title: "Авто-генериране на протокол", body: "PDF/Word протокол при сканиране, готов за подпис.", bullets: ["Шаблонът ви се преобразува в дигитален", "Авто-попълване: марка, сериен, дата, тип", "Архив на всички протоколи в системата"] },
  { n: "04", title: "Tracking · 3 вида обслужване", body: "Системата следи кога подлежи на обслужване.", bullets: ["Техническо · 2 години → известие 30 дни преди", "Презареждане · при нужда", "Хидростатично · 10 години (+10г живот)"] },
  { n: "05", title: "Управление на обекти и клиенти", body: "Клиент → обекти → пожарогасители → история.", bullets: ["Карта на клиент с всички обекти", "Списък на пожарогасители на обект", "Пълна история на обслужвания"] },
  { n: "06", title: "Връзка с уебсайт · поръчки", body: "Поръчките от сайта влизат директно в системата.", bullets: ["Form на сайт → нов клиент в система", "Заявки → разпределяне на техник", "Telegram известия за нови поръчки"] },
  { n: "07", title: "Многоезичен AI чат · опция", body: "За експанзия към Румъния и Гърция (отделна Phase 2).", bullets: ["BG + RO + EL + EN", "Чат-бот на сайта · разпознава езика на посетителя", "*Доплащане за multilingual"] },
];

const PROCESS = [
  { step: "1", title: "Анализ", body: "Изпращате вашия текущ протокол → анализирам формата." },
  { step: "2", title: "План + демо", body: "Подготвям конкретен план + демо с примерни пожарогасители." },
  { step: "3", title: "Изграждане", body: "30-45 дни до пълно стартиране." },
  { step: "4", title: "Старт + тренинг", body: "Стартиране с реалните ви данни + онлайн тренинг." },
  { step: "5", title: "Поддръжка", body: "30 дни безплатна + постоянна оптимизация." },
];

export function Antoan09PresentationDocument() {
  const today = new Date().toLocaleDateString("bg-BG");
  return (
    <Document title="Презентация · Antoan 09 EOOD × ProMarketing" author="ПроМаркетинг ЕООД">
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <View style={s.brandRow}>
            <Text style={s.brand}>Pro<Text style={s.brandAccent}>Marketing</Text> LTD</Text>
            <Text style={s.meta}>Презентация · {today}</Text>
          </View>

          <Text style={s.eyebrow}>Персонална презентация</Text>
          <Text style={s.h1}>AI система за <Text style={s.h1Accent}>пожарогасители</Text></Text>
          <Text style={s.tag}>🧯 Antoan 09 EOOD · Сервиз + Продажба</Text>
          <Text style={s.lead}>
            QR сканиране, авто-протоколи, проследяване на 3 вида обслужване (техническо, презареждане,
            хидростатично). От 300 към 3 000 пожарогасителя седмично — без увеличаване на хора.
          </Text>

          <Text style={s.sectionTitle}>7 модула · едно цяло</Text>
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

          <Text style={s.sectionTitle}>Цена · пълна система</Text>
          <View style={s.priceBox}>
            <Text style={s.priceLabel}>ПЪЛНА СИСТЕМА</Text>
            <Text style={s.priceValue}>1 800 €</Text>
            <Text style={s.priceMeta}>без ДДС · еднократно · ⏱ 30-45 дни</Text>
            <Text style={{ fontSize: 8, color: C.inkSoft, marginTop: 4, textAlign: "center" }}>
              Плащане: 50% при подписване · 50% при стартиране · ДДС се добавя при фактуриране
            </Text>
            <Text style={{ fontSize: 8, color: C.orange, marginTop: 8, fontWeight: 700, textAlign: "center" }}>
              + ОПЦИЯ: Многоезичен AI чат (BG/RO/EL/EN) — отделна Phase 2
            </Text>
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

          <View style={s.footer}>
            <View style={s.footerCol}>
              <Text style={s.footerBold}>„ПроМаркетинг" ЕООД</Text>
              <Text>Ивайло Петев · управител</Text>
              <Text>ivailopetev38@gmail.com</Text>
              <Text>+359 877 399 963</Text>
            </View>
            <View style={[s.footerCol, { textAlign: "right" }]}>
              <Text>Резервирай разговор:</Text>
              <Text>promarketing.pw/booking</Text>
              <Text>Онлайн презентация:</Text>
              <Text>promarketing.pw/oferta/antoan09</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
