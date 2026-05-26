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
  ink: "#0a0805",
  inkSoft: "#5a4e30",
  gold: "#d4af37",
  goldBright: "#b8941f",
  border: "#E5DBC0",
  panel: "#FBF7EC",
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
    marginBottom: 24,
  },
  brand: { fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: 0.6 },
  brandAccent: { color: C.gold },
  meta: { fontSize: 7, color: C.inkSoft, letterSpacing: 1.4, textTransform: "uppercase" },
  eyebrow: { fontSize: 7, color: C.goldBright, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 6 },
  h1: { fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.15, marginBottom: 10 },
  h1Accent: { color: C.gold },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: C.panel,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 9,
    color: C.ink,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  lead: { fontSize: 9.5, color: C.inkSoft, lineHeight: 1.5, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: C.ink,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modulesGrid: { marginTop: 4, flexDirection: "row", flexWrap: "wrap" },
  moduleWrap: { width: "50%", padding: 3 },
  moduleCard: {
    backgroundColor: C.panel,
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
  },
  moduleNum: { fontSize: 7, color: C.goldBright, letterSpacing: 1.5, marginBottom: 1 },
  moduleTitle: { fontSize: 10, fontWeight: 700, color: C.ink, marginBottom: 2 },
  moduleBody: { fontSize: 7.5, color: C.inkSoft, lineHeight: 1.35, marginBottom: 3 },
  bulletRow: { flexDirection: "row", marginTop: 1.5, paddingLeft: 3 },
  bullet: { width: 8, color: C.gold, fontSize: 7 },
  bulletText: { flex: 1, fontSize: 7, color: C.ink, lineHeight: 1.35 },
  stepRow: {
    flexDirection: "row",
    marginTop: 6,
    backgroundColor: C.panel,
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.gold,
    color: C.goldBright,
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    paddingTop: 4,
    marginRight: 10,
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 10, fontWeight: 700, color: C.ink, marginBottom: 1 },
  stepDesc: { fontSize: 8, color: C.inkSoft, lineHeight: 1.35 },
  footer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCol: { flex: 1, fontSize: 8, color: C.inkSoft, lineHeight: 1.5 },
  footerBold: { fontWeight: 700, color: C.ink },
});

const MODULES = [
  { n: "01", title: "Лийдове · авто-прием", body: "Всеки запитващ — независимо откъде идва — влиза в CRM-а автоматично.", bullets: ["Facebook, Instagram, TikTok форми → CRM", "Уебсайт форми и chat → CRM", "Имейли към office@ → AI разпознава", "Обаждания → запис + транскрипция", "Telegram/Viber → авто-прием"] },
  { n: "02", title: "Разпределение по брокер", body: "Лидът директно отива при правилния брокер според район, специализация и натовареност.", bullets: ["Правила по район и специализация", "Авто-баланс на натовареност", "Round-robin или приоритет", "Push нотификации в реално време"] },
  { n: "03", title: "Custom нива в CRM", body: "Сами си създавате stage-овете — без програмист. Drag & drop.", bullets: ["Нови → Контакт → Огледан → Оферта → Сделка", "Добавяте нови нива в движение", "Авто-движение между нивата с правила", "Pipeline + Kanban визуализация"] },
  { n: "04", title: "AI CRM · оценка и прогноза", body: "AI оценява всеки лид (топъл/студен) и предсказва вероятност за сделка.", bullets: ["Score 0-100 спрямо качество", "Прогноза 'време до сделка' и бюджет", "Авто follow-up таски на брокера", "ROI анализ по източник на лиди"] },
  { n: "05", title: "Чат за брокери", body: "Вътрешен бизнес чат с AI помощник — ваше пространство.", bullets: ["Канали по екипи, район, сделка", "Споделяне на имоти и документи", "AI: 'Намери ми всички 3-стайни в Тракия'", "Voice → text + auto-summary"] },
  { n: "06", title: "HR · форми за персонал", body: "Кандидати за брокери — автоматизирана селекция.", bullets: ["Форма на сайт и социални мрежи", "AI скрининг по опит и мотивация", "Авто интервю scheduling", "База от минали кандидати"] },
  { n: "07", title: "Промотиране на обяви", body: "Имотите и експертизата ви достигат до повече хора.", bullets: ["Auto-публикуване във FB, IG, OLX, imot.bg", "AI описания на имоти от снимки", "Reels от обиколка на имот", "Targeted реклами по типов клиент"] },
  { n: "08", title: "Всички социални мрежи", body: "FB, IG, TikTok, LinkedIn, YouTube от един dashboard.", bullets: ["Един редактор → всички мрежи наведнъж", "Календар за следващите 30 дни", "DM и коментари в единна inbox", "Брандови шаблони за всеки пост"] },
  { n: "09", title: "Поддръжка · живо", body: "Не ви оставяме сами след инсталацията.", bullets: ["30 дни безплатна поддръжка", "Прав хотлайн за спешни въпроси", "Месечна оптимизация и нови функции", "Тренинг видеа за нови служители"] },
];

const PROCESS = [
  { step: "1", title: "Разговор", body: "Утре 27.05 в 10:00 — процеси, болезнени места, какво искате да отпадне." },
  { step: "2", title: "План + демо", body: "Подготвям конкретен план + демо с примерни данни от агенция за имоти." },
  { step: "3", title: "Изграждане", body: "От 30 до 60 дни според големината на проекта." },
  { step: "4", title: "Инсталация", body: "1-3 работни дни на място. Тренинг + настройка." },
  { step: "5", title: "Поддръжка", body: "30 дни безплатна + продължаваща оптимизация." },
];

export function GoldenKeyPresentationDocument() {
  const today = new Date().toLocaleDateString("bg-BG");
  return (
    <Document title="Презентация · Golden Key × ProMarketing" author="ПроМаркетинг ЕООД">
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
            AI операционна система <Text style={s.h1Accent}>за Golden Key</Text>
          </Text>
          <Text style={s.tag}>Агенция за недвижими имоти</Text>
          <Text style={s.lead}>
            Тотална автоматизация — лийдове, разпределение, нива в CRM, AI оценка, чат за брокери,
            HR форми, промотиране на обяви, всички социални мрежи в едно. Брокерите се фокусират
            върху сделките, не върху ръчната работа.
          </Text>

          <Text style={s.sectionTitle}>9 модула в един dashboard</Text>
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
              <Text style={{ fontWeight: 700 }}>По поръчка.</Text> Системата се прави около вашите процеси — за брокерство, не за всичко.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Сами създавате нива.</Text> Добавяте нови stage-ове в CRM-а след инсталацията, без програмист.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>Без зависимост.</Text> Всичко е ваше, на ваш Cloud. Защитени сте от промени в политики на трети платформи.
            </Text>
          </View>
          <View style={s.bulletRow}>
            <Text style={s.bullet}>✓</Text>
            <Text style={s.bulletText}>
              <Text style={{ fontWeight: 700 }}>На място.</Text> От Русе сме. Идваме при вас за тренинг и настройка — не само Zoom.
            </Text>
          </View>

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
              <Text>promarketing.pw/oferta/golden-key</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
