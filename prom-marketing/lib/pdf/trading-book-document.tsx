import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { TRADING_DISCLAIMER } from "@/lib/trading/config";

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
  violet: "#7c3aed",
  emerald: "#059669",
  amber: "#b45309",
  rose: "#be123c",
  border: "#E2E8F0",
  panel: "#F8FAFC",
  warn: "#FEF3C7",
  warnBorder: "#F59E0B",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, color: C.ink, fontFamily: "NotoSans", paddingBottom: 34, fontSize: 10 },
  topBar: { height: 8, backgroundColor: C.violet },
  body: { paddingHorizontal: 42, paddingTop: 26 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  brand: { fontSize: 13, fontWeight: 700, letterSpacing: 0.6 },
  brandAccent: { color: C.violet },
  meta: { fontSize: 7, color: C.inkSoft, letterSpacing: 1.4, textTransform: "uppercase" },
  eyebrow: { fontSize: 7.5, color: C.emerald, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 6 },
  h1: { fontSize: 26, fontWeight: 700, lineHeight: 1.15, marginBottom: 10 },
  h1Accent: { color: C.violet },
  lead: { fontSize: 10.5, color: C.inkSoft, lineHeight: 1.6, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  sectionSub: { fontSize: 9.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: 12 },
  para: { fontSize: 9.5, lineHeight: 1.6, marginBottom: 8 },
  card: { backgroundColor: C.panel, borderRadius: 5, borderLeftWidth: 3, padding: 10, marginBottom: 7 },
  cardTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 3 },
  cardBody: { fontSize: 9, color: C.inkSoft, lineHeight: 1.55 },
  flowRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  flowBox: { flex: 1, borderWidth: 1, borderRadius: 5, paddingVertical: 8, paddingHorizontal: 4, alignItems: "center" },
  flowLabel: { fontSize: 8.5, fontWeight: 700, textAlign: "center" },
  flowSub: { fontSize: 6.5, color: C.inkSoft, textAlign: "center", marginTop: 2 },
  flowArrow: { fontSize: 11, color: C.inkSoft, paddingHorizontal: 4 },
  warnBox: { backgroundColor: C.warn, borderLeftWidth: 3, borderLeftColor: C.warnBorder, borderRadius: 4, padding: 10, marginTop: 10 },
  warnText: { fontSize: 8.5, color: "#78350F", lineHeight: 1.55 },
  footer: {
    position: "absolute", bottom: 14, left: 42, right: 42,
    flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: C.inkSoft,
  },
});

function Footer({ page }: { page: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>ProMarketing · promarketing.pw/trading · Образователно съдържание, не финансов съвет</Text>
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
      <Text style={s.meta}>Трейдинг Агентът · безплатна книга</Text>
    </View>
  );
}

function Flow({ boxes, color }: { boxes: Array<[string, string]>; color: string }) {
  return (
    <View style={s.flowRow}>
      {boxes.map(([label, sub], i) => (
        <View key={label} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {i > 0 && <Text style={s.flowArrow}>→</Text>}
          <View style={{ ...s.flowBox, borderColor: color, backgroundColor: `${color}0D` }}>
            <Text style={{ ...s.flowLabel, color }}>{label}</Text>
            <Text style={s.flowSub}>{sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function TradingBookDocument() {
  return (
    <Document title="Трейдинг Агентът — наръчникът · ProMarketing" author="ProMarketing">
      {/* Стр. 1 — корица */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.eyebrow}>Безплатна книга · техническо образование</Text>
          <Text style={s.h1}>
            Трейдинг <Text style={s.h1Accent}>Агентът</Text> — наръчникът
          </Text>
          <Text style={s.lead}>
            Как се изгражда автоматизирана търговска система: от идея до агент, който изпълнява
            стратегията ти дисциплинирано, без емоции и без да стои пред екрана. Това е
            инженерната карта — какво се строи, в какъв ред и къде хората се провалят.
          </Text>

          {[
            ["Защо агент, а не „още взиране в графики”", "Най-скъпият проблем на трейдъра не е липсата на информация — а емоцията: страх, алчност, отмъщение след загуба. Машината няма нито едно от трите.", C.violet],
            ["Какво ще намериш вътре", "5-те компонента на системата · как се пишат правила, които машина изпълнява · бектест и демо · инструментите по нива · 3-те фатални грешки.", C.emerald],
            ["Какво НЯМА да намериш", "„Гарантирана печалба”, „сигнали за забогатяване”, копи-пейст стратегии. Който ти ги обещава, продава лотарийни билети.", C.rose],
          ].map(([t, b, color]) => (
            <View key={t as string} style={{ ...s.card, borderLeftColor: color as string }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}

          <View style={s.warnBox}>
            <Text style={s.warnText}>⚠️ {TRADING_DISCLAIMER}</Text>
          </View>
        </View>
        <Footer page="1 / 8" />
      </Page>

      {/* Стр. 2 — Архитектурата */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Глава 1 · Архитектурата на трейдинг агента</Text>
          <Text style={s.sectionSub}>
            Всяка работеща система — от хоби бот до хедж фонд — има същите 5 блока. Разликата е
            в качеството на всеки блок, не в тайни съставки.
          </Text>

          <Flow
            color={C.violet}
            boxes={[
              ["Данни", "цени, обем"],
              ["Стратегия", "правила"],
              ["Бектест", "историята"],
              ["Демо", "живи данни"],
              ["Изпълнение", "най-накрая"],
            ]}
          />

          {[
            ["1 · Данни", "Исторически цени за тестване + живи данни за търговия. Източници: API на борсата (Binance, IBKR), TradingView, безплатни датасети. Правило: боклук на входа = боклук на изхода."],
            ["2 · Стратегия", "Набор правила за вход, изход и риск. Ако не можеш да я опишеш на лист като „ако X и Y → купи; излез при Z” — нямаш стратегия, имаш усещане."],
            ["3 · Бектест", "Правилата, пуснати върху миналото. Тук умират 90% от идеите — и това е ЦЕЛТА. Всяка идея, убита в бектеста, е спасена реална загуба."],
            ["4 · Демо (paper trading)", "Същите правила, живи данни, фалшиви пари. Минимум 4-8 седмици. Разкрива всичко, което бектестът крие: изпълнение, спредове, забавяния."],
            ["5 · Изпълнение", "Едва сега — реална сметка, микроскопичен размер. Агентът праща поръчките, ти следиш седмичния отчет."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.card, borderLeftColor: C.violet }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}
        </View>
        <Footer page="2 / 8" />
      </Page>

      {/* Стр. 3 — Правилата */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Глава 2 · Как идеята става правило</Text>
          <Text style={s.sectionSub}>
            Машината изпълнява само еднозначни инструкции. Ето превода от „трейдърски език” към
            „агентски език”:
          </Text>

          {[
            ["„Купувам при пробив”", "→ „Купи, когато цената затвори над най-високата стойност от последните 20 свещи, при обем ≥ 1.5× средния за 20 периода.”"],
            ["„Излизам, когато се обърне”", "→ „Продай при затваряне под 10-периодната EMA ИЛИ при −2% от входа — което настъпи първо.”"],
            ["„Не рискувам много”", "→ „Размер на позицията = 1% от сметката / разстоянието до стопа. Максимум 3 отворени позиции. Максимална дневна загуба 3% → агентът спира до утре.”"],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.card, borderLeftColor: C.emerald }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.para}>
            Точно тук AI е революцията за не-програмисти: описваш правилото на български, AI
            асистентът (Claude, ChatGPT) го превръща в код за Pine Script или Python — и после
            го обясняваш обратно, за да провериш, че е разбрал ТОЧНО теб.
          </Text>

          <Text style={s.sectionTitle}>Рискът е стратегията</Text>
          <Text style={s.para}>
            Аматьорът пита „кога да вляза”. Професионалистът пита „колко губя, ако греша 10 пъти
            подред”. Правилата за размер на позиция и дневен лимит НЕ са пожелателни — те са
            разликата между лоша седмица и изтрита сметка.
          </Text>
        </View>
        <Footer page="3 / 8" />
      </Page>

      {/* Стр. 4 — Бектест */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Глава 3 · Бектест — детекторът на самозаблуди</Text>
          <Text style={s.sectionSub}>
            Целта на бектеста не е да докаже, че стратегията работи. Целта е да се ОПИТА да я
            счупи. Каквото оцелее — заслужава демо.
          </Text>

          {[
            ["Мини­мум 1 година данни, различни пазари", "Стратегия, тествана само в бичи пазар, е стратегия за губене в мечи. Тествай през спокойни и луди периоди."],
            ["Включи разходите", "Комисиони, спред, приплъзване (slippage). „Печеливша” стратегия без разходи често е губеща с тях — особено при чести сделки."],
            ["Пази се от overfitting", "Ако си напасвал параметрите, докато кривата стане красива — си запомнил миналото, не си предсказал бъдещето. Тест: раздели данните; настройвай на едната половина, валидирай на другата."],
            ["Гледай最 лошия период, не средното", "Максимален спад (drawdown) и най-дълга губеща серия. Ако не можеш да ги изтърпиш психически на демо — няма да ги изтърпиш и с реални пари."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.card, borderLeftColor: C.amber }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.para}>
            Инструменти: TradingView Strategy Tester (най-лесен старт), Python + backtesting.py
            / vectorbt (пълен контрол), а AI асистентът пише кода и на двете.
          </Text>
        </View>
        <Footer page="4 / 8" />
      </Page>

      {/* Стр. 5 — Инструментите по нива */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Глава 4 · Инструментите — по нива</Text>
          <Text style={s.sectionSub}>Започни от нивото, което отговаря на уменията ти ДНЕС. Всяко ниво е работеща система.</Text>

          {[
            ["Ниво 1 · Полуавтомат (0 код)", "TradingView аларма по твоето правило → известие на телефона → ти изпълняваш ръчно. Агентът е „наблюдателят”, ти си „ръката”. Старт за 1 уикенд.", C.emerald],
            ["Ниво 2 · Свързан агент (малко код)", "TradingView webhook → n8n/Make → API на борсата изпълнява + лог в Google Sheets + Telegram отчет. Тук повечето хора спират — и това е напълно достатъчно.", C.violet],
            ["Ниво 3 · Пълен агент (Python)", "Собствен бот: данни, изчисление, изпълнение, риск-модул, дневник, отчети. AI асистентът пише 90% от кода; ти трябва да разбираш ЛОГИКАТА, не синтаксиса.", C.amber],
          ].map(([t, b, color]) => (
            <View key={t as string} style={{ ...s.card, borderLeftColor: color as string }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.sectionTitle}>Задължителните предпазители на всяко ниво</Text>
          {[
            "Дневен стоп: агентът спира след X% дневна загуба — без изключения",
            "Лимит на размер: никоя позиция над Y% от сметката",
            "Kill switch: един бутон/команда, която спира всичко веднага",
            "Дневник: всяка сделка записана — какво, кога, защо, резултат",
          ].map((t) => (
            <Text key={t} style={{ ...s.para, marginBottom: 3 }}>
              • {t}
            </Text>
          ))}
        </View>
        <Footer page="5 / 8" />
      </Page>

      {/* Стр. 6 — 3-те фатални грешки */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Глава 5 · 3-те грешки, които изтриват сметки</Text>

          {[
            ["Грешка 1 · Реални пари преди демо", "Ентусиазмът след добър бектест е най-скъпата емоция. Демо периодът не е формалност — той е последният безплатен урок. Всичко след него се плаща."],
            ["Грешка 2 · Пипане на агента по време на работа", "Най-честият провал: агентът е на минус 3 дни и човекът „само леко коригира” правилата. Резултат: нито системна, нито дискреционна търговия — хаос. Правилото: промени се тестват на демо, никога на живо."],
            ["Грешка 3 · Чужди сигнали на сляпо", "Копирането на чужди сигнали, които не разбираш, не е автоматизация — а прехвърляне на съдбата ти на непознат с маркетинг бюджет. Ако не знаеш ЗАЩО влиза в сделка, не можеш да знаеш кога да спреш да го слушаш."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.card, borderLeftColor: C.rose }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}

          <View style={s.warnBox}>
            <Text style={s.warnText}>
              ⚠️ Реалност, без украса: мнозинството хора, които търгуват активно, губят пари —
              с или без бот. Автоматизацията премахва емоцията и умората, но НЕ създава
              печеливша стратегия от нищото. Тя прави дисциплинирано това, което ти си
              проектирал — добро или лошо.
            </Text>
          </View>
        </View>
        <Footer page="6 / 8" />
      </Page>

      {/* Стр. 7 — План 30 дни */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Глава 6 · Първите 30 дни — планът</Text>

          {[
            ["Седмица 1 · Правилата", "Избери ЕДИН пазар и ЕДНА идея. Разпиши я до еднозначни правила (Глава 2). AI асистентът ти помага да ги формулираш."],
            ["Седмица 2 · Бектест", "Кодирай правилата (Pine Script през AI) и ги пусни върху 1+ година. Включи разходите. Ако умре — нова идея, същият процес. Това Е прогрес."],
            ["Седмица 3-4 · Демо + аларми", "Оцелялата стратегия отива на демо/аларми (Ниво 1). Води дневник. Сравнявай демото с бектеста — разминаванията са уроците."],
            ["След 30-ия ден", "Ако демото държи: Ниво 2 — свързваш изпълнението. Ако не: обратно на Седмица 1 с наученото. Цикълът Е системата."],
          ].map(([t, b]) => (
            <View key={t} style={{ ...s.card, borderLeftColor: C.emerald }} wrap={false}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardBody}>{b}</Text>
            </View>
          ))}

          <Text style={s.para}>
            Това е същият цикъл, който минаваме заедно в менторството — само че там го минаваш
            с човек, който е строил агенти, до теб на всяка стъпка, и завършваш с работеща
            собствена система, а не с папка недовършени опити.
          </Text>
        </View>
        <Footer page="7 / 8" />
      </Page>

      {/* Стр. 8 — Следваща стъпка */}
      <Page size="A4" style={s.page}>
        <View style={s.topBar} />
        <View style={s.body}>
          <Brand />
          <Text style={s.sectionTitle}>Следващата стъпка — ако искаш да не си сам</Text>
          <Text style={s.para}>
            Можеш да минеш целия път сам с тази книга — тя е пълната карта. Ако искаш да го
            минеш по-бързо и със застраховка срещу скъпите грешки, работим 1-на-1:
          </Text>

          <View style={{ ...s.card, borderLeftColor: C.violet }}>
            <Text style={s.cardTitle}>Трейдинг Агент · Менторство 1-на-1 (4 месеца)</Text>
            <Text style={s.cardBody}>
              16 лични сесии: твоята стратегия → правила → бектест → демо → изпълнение. Изграждаш
              собствен агент, който разбираш до винтче — код и системи в твои акаунти, твоя
              собственост. Ограничени места (работим лично).
            </Text>
          </View>

          <Text style={s.para}>
            📞 Първата стъпка е безплатен 15-минутен разговор: разказваш къде си, ние казваме
            честно дали и как можем да помогнем. Ако книгата ти е дошла по имейл — ще ти пишем
            ние. Или си запази час директно на promarketing.pw/booking.
          </Text>

          <View style={s.warnBox}>
            <Text style={s.warnText}>⚠️ {TRADING_DISCLAIMER}</Text>
          </View>
        </View>
        <Footer page="8 / 8" />
      </Page>
    </Document>
  );
}
