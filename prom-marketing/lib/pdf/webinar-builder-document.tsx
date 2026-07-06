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
  emerald: "#059669",
  cyan: "#0e7490",
  violet: "#7c3aed",
  amber: "#b45309",
  border: "#E2E8F0",
  panel: "#F8FAFC",
  warn: "#FEF3C7",
  warnBorder: "#F59E0B",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.ink,
    fontFamily: "NotoSans",
    paddingTop: 0,
    paddingBottom: 34,
    fontSize: 10,
  },
  topBar: { height: 8, backgroundColor: C.emerald },
  body: { paddingHorizontal: 42, paddingTop: 26 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: 0.6 },
  brandAccent: { color: C.emerald },
  meta: { fontSize: 7, color: C.inkSoft, letterSpacing: 1.4, textTransform: "uppercase" },
  eyebrow: {
    fontSize: 7.5,
    color: C.violet,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h1: { fontSize: 25, fontWeight: 700, lineHeight: 1.15, marginBottom: 10 },
  h1Accent: { color: C.emerald },
  lead: { fontSize: 10.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionSub: { fontSize: 9.5, color: C.inkSoft, lineHeight: 1.5, marginBottom: 12 },
  stepCard: {
    backgroundColor: C.panel,
    borderRadius: 5,
    borderLeftWidth: 3,
    padding: 10,
    marginBottom: 7,
  },
  stepTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 3 },
  stepBody: { fontSize: 9, color: C.inkSoft, lineHeight: 1.5 },
  flowRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  flowBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  flowLabel: { fontSize: 8.5, fontWeight: 700, textAlign: "center" },
  flowSub: { fontSize: 6.5, color: C.inkSoft, textAlign: "center", marginTop: 2 },
  flowArrow: { fontSize: 11, color: C.inkSoft, paddingHorizontal: 4 },
  toolsTitle: { fontSize: 9, fontWeight: 700, marginTop: 8, marginBottom: 4, color: C.cyan },
  toolLine: { fontSize: 8.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: 2 },
  warnBox: {
    backgroundColor: C.warn,
    borderLeftWidth: 3,
    borderLeftColor: C.warnBorder,
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  warnText: { fontSize: 8.5, color: "#78350F", lineHeight: 1.55 },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: C.inkSoft,
  },
});

function Footer({ page }: { page: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>ProMarketing · promarketing.pw · Бонус към уебинара „AI Машината за Клиенти”</Text>
      <Text>{page}</Text>
    </View>
  );
}

function Brand() {
  return (
    <View style={s.brandRow}>
      <Text style={s.brand}>
        PRO<Text style={s.brandAccent}>MARKETING</Text>
      </Text>
      <Text style={s.meta}>AI Строител · Бонус презентация</Text>
    </View>
  );
}

function Flow({ boxes, color }: { boxes: Array<[string, string]>; color: string }) {
  return (
    <View style={s.flowRow}>
      {boxes.map(([label, sub], i) => (
        <View key={label} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {i > 0 && <Text style={s.flowArrow}>»</Text>}
          <View style={{ ...s.flowBox, borderColor: color, backgroundColor: `${color}0D` }}>
            <Text style={{ ...s.flowLabel, color }}>{label}</Text>
            <Text style={s.flowSub}>{sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function WebinarBuilderDocument() {
  return (
    <Document title="AI Строител — бърз наръчник · ProMarketing" author="ProMarketing">
      {/* Стр. 1 — корица */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.eyebrow}>Бонус презентация · за записаните в обучението</Text>
          <Text style={s.h1}>
            AI <Text style={s.h1Accent}>Строител</Text> — бърз наръчник
          </Text>
          <Text style={s.lead}>
            Четири неща, които можеш да си направиш САМ — с AI, без екип и без скъп софтуер.
            Всяко от тях го показваме на живо на обучението на 23 юли; тук е картата, за да
            дойдеш подготвен.
          </Text>

          {[
            ["1 · Твоят AI агент", "Отговаря на клиенти, квалифицира и записва срещи — 24/7.", C.emerald],
            ["2 · Реклами с глас", "Диктуваш идеята — AI я превръща в готова кампания.", C.cyan],
            ["3 · Трейдинг агент (образователно)", "Архитектурата на автоматизирана стратегия — и рисковете ѝ.", C.violet],
            ["4 · Дашборд и сайт с код", "Собствени системи без ограниченията на конструкторите.", C.amber],
          ].map(([t, b, color]) => (
            <View key={t as string} style={{ ...s.stepCard, borderLeftColor: color as string }} wrap={false}>
              <Text style={s.stepTitle}>{t}</Text>
              <Text style={s.stepBody}>{b}</Text>
            </View>
          ))}

          <Text style={{ ...s.lead, marginTop: 12 }}>
            На живо: четвъртък, 23 юли, 19:00 ч. в Zoom. Линкът е в имейла ти. Бонусите в
            края са само за присъстващите.
          </Text>
        </View>
        <Footer page="1 / 5" />
      </Page>

      {/* Стр. 2 — AI агент */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>1 · Как да си създадеш AI агент</Text>
          <Text style={s.sectionSub}>
            AI агентът не е „чатбот с готови отговори” — той разбира въпроса, отговаря на
            естествен български и изпълнява следваща стъпка (запис на среща, оферта, CRM запис).
          </Text>

          <Flow
            color={C.emerald}
            boxes={[
              ["Знание", "какво знае"],
              ["Мозък", "GPT / Claude"],
              ["Канал", "сайт · Messenger"],
              ["Действие", "среща · CRM"],
            ]}
          />

          {[
            ["Стъпка 1 · Събери знанието", "15-те най-чести въпроса + отговори до 3 изречения, цените, работното време, какво продаваш и на кого. Един Google Doc е достатъчен за старт."],
            ["Стъпка 2 · Дай му мозък и инструкция", "Инструкцията е ключът: „Ти си асистент на [бизнес]. Отговаряй кратко, на български, приятелски. Ако не знаеш — кажи, че ще провериш и поискай телефон. Целта ти е да запишеш среща.”"],
            ["Стъпка 3 · Вържи го към канал", "Започни от чата на сайта или Messenger. Инструменти без код: Dify, Chatbase, ManyChat + AI. По-мощно: n8n на собствен сървър — пълен контрол."],
            ["Стъпка 4 · Първите 2 седмици — с одобрение", "Агентът предлага чернови, ти одобряваш с 1 клик. Така калибрираш тона без риск. После — автопилот."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.stepCard, borderLeftColor: C.emerald }} wrap={false}>
              <Text style={s.stepTitle}>{t}</Text>
              <Text style={s.stepBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.toolsTitle}>Инструменти за старт</Text>
          <Text style={s.toolLine}>• Без код: Dify.ai, Chatbase, ManyChat — до 1 ден за първи агент</Text>
          <Text style={s.toolLine}>• С контрол: n8n (self-hosted) + OpenAI/Claude API — както е нашата система</Text>
          <Text style={s.toolLine}>• На обучението: показваме нашия жив агент отвътре</Text>
        </View>
        <Footer page="2 / 5" />
      </Page>

      {/* Стр. 3 — Реклами с глас */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>2 · Реклами с глас — от диктовка до кампания</Text>
          <Text style={s.sectionSub}>
            Най-бързият работен поток за реклами през 2026: говориш, AI пише, ти одобряваш.
            Без празен лист, без дизайнер, без чакане.
          </Text>

          <Flow
            color={C.cyan}
            boxes={[
              ["Диктуваш", "гласово, 2 мин"],
              ["AI скрипт", "кука + текст"],
              ["Креатив", "видео / визия"],
              ["Кампания", "Meta Ads"],
            ]}
          />

          {[
            ["Стъпка 1 · Диктувай суровината", "Отвори гласовия режим на ChatGPT/Claude и разкажи: какво продаваш, на кого, каква болка решаваш, какво те отличава. 2 минути говорене = целият бриф."],
            ["Стъпка 2 · Поискай 5 ъгъла", "„Дай ми 5 рекламни ъгъла за това, всеки с кука за първите 3 секунди, болка и призив.” Избираш 2-3 — не по вкус, а по това коя болка е най-масова."],
            ["Стъпка 3 · Креативът", "Видео: AI видео инструменти (Veo, Higgsfield) + AI глас (ElevenLabs има български). Статика: Canva + AI изображение. По 10 варианта за минути."],
            ["Стъпка 4 · Пусни малък тест", "10–20 €/ден на ъгъл, 3 ъгъла едновременно. След 3-4 дни числата казват кой печели — него мащабираш, останалите спираш."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.stepCard, borderLeftColor: C.cyan }} wrap={false}>
              <Text style={s.stepTitle}>{t}</Text>
              <Text style={s.stepBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.toolsTitle}>Правилото</Text>
          <Text style={s.toolLine}>
            Една реклама = една болка + едно обещание + един призив. Тестът решава, не мнението.
          </Text>
        </View>
        <Footer page="3 / 5" />
      </Page>

      {/* Стр. 4 — Трейдинг агент */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>3 · Трейдинг агент — архитектурата (образователно)</Text>
          <Text style={s.sectionSub}>
            Как изглежда автоматизирана търговска система отвътре — същите AI умения от
            предишните страници, приложени към пазарни данни. Това е инженерна карта, не
            инвестиционен съвет.
          </Text>

          <Flow
            color={C.violet}
            boxes={[
              ["Данни", "цени · сигнали"],
              ["Стратегия", "правила"],
              ["Бектест", "мин. 1 година"],
              ["Хартия", "демо сметка"],
              ["Изпълнение", "чак накрая"],
            ]}
          />

          {[
            ["Компонент 1 · Данни", "Исторически и живи цени (борсови API-та, TradingView). Агентът е толкова добър, колкото са данните му."],
            ["Компонент 2 · Стратегия с ясни правила", "„Купи когато X, продай когато Y, рискувай максимум Z% на сделка.” Ако правилото не може да се запише — не може и да се автоматизира. AI помага да формулираш и кодираш правилата."],
            ["Компонент 3 · Бектест", "Пусни правилата върху минала година данни. Повечето стратегии умират тук — това е успех: спестили са ти реални загуби."],
            ["Компонент 4 · Хартиена търговия", "Минимум 1-2 месеца на демо сметка с живи данни. Едва след като числата издържат — микроскопични реални суми."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.stepCard, borderLeftColor: C.violet }} wrap={false}>
              <Text style={s.stepTitle}>{t}</Text>
              <Text style={s.stepBody}>{b}</Text>
            </View>
          ))}

          <View style={s.warnBox}>
            <Text style={s.warnText}>
              Важно: Търговията с финансови инструменти носи реален риск от загуба на целия
              вложен капитал. Автоматизацията не премахва риска — ускорява и печалбите, И
              загубите. Нищо тук не е финансов или инвестиционен съвет; това е техническо
              образование. Никога не търгувай с пари, които не можеш да си позволиш да загубиш.
            </Text>
          </View>
        </View>
        <Footer page="4 / 5" />
      </Page>

      {/* Стр. 5 — Дашборд и сайт с код */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>4 · Собствен дашборд и сайт — с код, без ограничения</Text>
          <Text style={s.sectionSub}>
            Конструкторите (Wix, Shopify темплейти) са добри до първото „не може”. С AI вече не
            ти трябва да си програмист, за да имаш собствен код — трябва ти да знаеш какво искаш.
          </Text>

          <Flow
            color={C.amber}
            boxes={[
              ["Описваш", "на български"],
              ["AI кодира", "Next.js + база"],
              ["Преглеждаш", "и коригираш"],
              ["Публикуваш", "безплатен хостинг"],
            ]}
          />

          {[
            ["Стекът, който използваме и ние", "Next.js (сайтът) + Supabase (базата данни) + Vercel (хостинг, безплатен за старт). Точно на този стек върви promarketing.pw и CRM-ът ни — без месечни такси за платформи."],
            ["AI асистентът пише кода", "Claude Code / Cursor: описваш екрана („дашборд с днешните лийдове, приходи и бутон за нова оферта”) и той го създава. Ти си архитектът, AI е строителят."],
            ["Дашборд за ТВОИТЕ числа", "Лийдове, продажби, разходи — от твоите системи, на един екран, обновяващ се сам. Никакъв Excel в неделя вечер."],
            ["Правилото за собственост", "Всичко в твой GitHub + твои акаунти. Никога не заключвай бизнеса си в чужда платформа, от която не можеш да изнесеш данните."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.stepCard, borderLeftColor: C.amber }} wrap={false}>
              <Text style={s.stepTitle}>{t}</Text>
              <Text style={s.stepBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.toolsTitle}>Следващата стъпка</Text>
          <Text style={s.toolLine}>
            И четирите системи ги виждаш живи на обучението — 23 юли, 19:00, Zoom. Ела 5 минути
            по-рано; бонусите (540+ €) са само за присъстващите.
          </Text>
        </View>
        <Footer page="5 / 5" />
      </Page>
    </Document>
  );
}
