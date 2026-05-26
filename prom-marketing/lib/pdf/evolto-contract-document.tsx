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
  border: "#E2E8F0",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.ink,
    fontFamily: "NotoSans",
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
    marginBottom: 20,
  },
  brand: { fontSize: 13, fontWeight: 700 },
  brandAccent: { color: C.gold },
  meta: { fontSize: 8, color: C.inkSoft, letterSpacing: 1.2, textTransform: "uppercase" },
  title: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: C.inkSoft,
    textAlign: "center",
    marginBottom: 18,
  },
  intro: {
    fontSize: 9.5,
    marginBottom: 14,
    lineHeight: 1.55,
  },
  partiesBlock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    padding: 14,
    marginBottom: 16,
  },
  partyLine: {
    fontSize: 9.5,
    marginBottom: 4,
  },
  partyLabel: { fontWeight: 700 },
  article: { marginBottom: 12 },
  articleTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 4,
  },
  para: { fontSize: 9.5, color: C.ink, lineHeight: 1.55, marginBottom: 4, textAlign: "justify" },
  bulletRow: { flexDirection: "row", marginLeft: 6, marginTop: 2 },
  bullet: { width: 12, fontSize: 9.5, color: C.gold },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
  signBlock: {
    marginTop: 24,
    flexDirection: "row",
  },
  signCol: { flex: 1, paddingRight: 15 },
  signLabel: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 24,
    textTransform: "uppercase",
  },
  signBox: {
    borderTopWidth: 1,
    borderTopColor: C.ink,
    paddingTop: 6,
  },
  signLine: {
    fontSize: 8.5,
    color: C.inkSoft,
    marginBottom: 2,
  },
});

export function EvoltoContractDocument() {
  const today = new Date().toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document
      title="Договор за услуги · Evolto × ProMarketing"
      author="ProMarketing LTD"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>
            Pro<Text style={s.brandAccent}>Marketing</Text> LTD
          </Text>
          <Text style={s.meta}>Договор · {today}</Text>
        </View>

        <Text style={s.title}>ДОГОВОР ЗА ИЗРАБОТКА</Text>
        <Text style={s.subtitle}>
          AI операционна система — Sales CRM, Content engine, Cloud + Hermes
        </Text>

        <Text style={s.intro}>
          Днес, {today}, се сключи настоящият Договор между:
        </Text>

        <View style={s.partiesBlock}>
          <Text style={[s.partyLine, { fontWeight: 700 }]}>ИЗПЪЛНИТЕЛ:</Text>
          <Text style={s.partyLine}>
            ProMarketing LTD, със седалище и адрес на управление гр. София, представлявано от Ивайло Петев, електронна поща ivailo@promarketing.pw, телефон +359 877 399 963 — наричано по-долу „Изпълнителят".
          </Text>
          <Text style={[s.partyLine, { marginTop: 10, fontWeight: 700 }]}>ВЪЗЛОЖИТЕЛ:</Text>
          <Text style={s.partyLine}>
            Evolto, със седалище ЛИП Родопи, ул. Околовръстен път, 4109 гр. Пловдив, представлявано от Васил Бедров — собственик, електронна поща info@evolto.bg, телефон +359 894 255 855 — наричано по-долу „Възложителят".
          </Text>
        </View>

        {/* Article 1 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 1. Предмет на договора</Text>
          <Text style={s.para}>
            (1) Изпълнителят се задължава да изработи и инсталира за Възложителя „AI операционна
            система" с шест функционални направления:
          </Text>
          <View style={s.bulletRow}><Text style={s.bullet}>1.</Text><Text style={s.bulletText}>Sales AI CRM — оценка на lead-ове, авто-генериране на оферти и договори, проследяване на статуса;</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>2.</Text><Text style={s.bulletText}>Project & финансово проследяване — приходи/разходи, фактури, Telegram нотификации;</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>3.</Text><Text style={s.bulletText}>Content AI Engine — социални публикации, банери, Reels, Google Trends анализ;</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>4.</Text><Text style={s.bulletText}>Реклами анализ и репорт — дневен анализ на Meta/Google кампании;</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>5.</Text><Text style={s.bulletText}>Чат бот контрол — управление на цялата система с разговор на български;</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>6.</Text><Text style={s.bulletText}>Cloud + Hermes инфраструктура — хостинг, background агенти, корпоративен имейл, социални мрежи.</Text></View>
          <Text style={[s.para, { marginTop: 4 }]}>
            (2) Подробният обхват е описан в Приложение „Оферта", което е неразделна част от
            настоящия Договор.
          </Text>
        </View>

        {/* Article 2 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 2. Цена и плащане</Text>
          <Text style={s.para}>
            (1) Общата цена за изпълнение на предмета по чл. 1 е 2 000 (две хиляди) евро без ДДС.
          </Text>
          <Text style={s.para}>(2) Цената се заплаща по банкова сметка на Изпълнителя на две вноски:</Text>
          <View style={s.bulletRow}><Text style={s.bullet}>а)</Text><Text style={s.bulletText}>50% (1 000 € без ДДС) — авансово, в рамките на 3 работни дни от подписване на Договора;</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>б)</Text><Text style={s.bulletText}>50% (1 000 € без ДДС) — след приключване на сетъпа и инсталацията на място при Възложителя.</Text></View>
          <Text style={[s.para, { marginTop: 4 }]}>
            (3) ДДС, ако е приложим, се добавя върху всяка вноска.
          </Text>
        </View>

        {/* Article 3 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 3. Срокове</Text>
          <View style={s.bulletRow}><Text style={s.bullet}>(1)</Text><Text style={s.bulletText}>Срок за изграждане: 10 (десет) работни дни от получаване на авансовото плащане.</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>(2)</Text><Text style={s.bulletText}>Инсталация на място: 1 (един) работен ден в офиса на Възложителя — настройка на корпоративен имейл, свързване на социалните мрежи, инсталация на Cloud и Hermes.</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>(3)</Text><Text style={s.bulletText}>Допълнителна донастройка: при необходимост от fine-tuning след инсталацията — до 30 (тридесет) календарни дни допълнителни онлайн срещи, без допълнително заплащане. Конкретният брой срещи зависи от времето, необходимо за пълна настройка.</Text></View>
        </View>

        {/* Article 4 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 4. Поддръжка</Text>
          <Text style={s.para}>
            (1) Изпълнителят осигурява 30 (тридесет) календарни дни безплатна поддръжка след приключване на инсталацията — отговори на въпроси, съдействие при оптимизация на системата, корекции на дефекти.
          </Text>
          <Text style={s.para}>
            (2) След изтичане на този срок поддръжка се предоставя по отделна писмена договорка.
          </Text>
        </View>

        {/* Article 5 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 5. Задължения на Възложителя</Text>
          <View style={s.bulletRow}><Text style={s.bullet}>(1)</Text><Text style={s.bulletText}>Възложителят се задължава да предостави на Изпълнителя своевременен достъп до необходимите ресурси — корпоративни акаунти (имейл, социални мрежи, Google Drive), КСС таблици, шаблони на оферти и договори, бранд гайд.</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>(2)</Text><Text style={s.bulletText}>Възложителят определя контактно лице за комуникация по проекта.</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>(3)</Text><Text style={s.bulletText}>Възложителят поема разходите за външни услуги, които не са в обхвата на този Договор (Cloud месечен абонамент, API кредити за AI, рекламни бюджети, хардуер).</Text></View>
        </View>
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>
            Pro<Text style={s.brandAccent}>Marketing</Text> LTD
          </Text>
          <Text style={s.meta}>Договор · Evolto · стр. 2</Text>
        </View>

        {/* Article 6 — Confidentiality */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 6. Конфиденциалност</Text>
          <Text style={s.para}>
            (1) Страните се задължават да третират като поверителна всяка информация, която
            получават една от друга във връзка с изпълнението на този Договор, включително, но не
            само: бизнес планове, финансови данни, клиентски бази, технологични решения,
            ценообразуване, доставчици, КСС таблици, шаблони и брандови материали.
          </Text>
          <Text style={s.para}>
            (2) Поверителната информация не може да се разкрива на трети лица без писмено
            съгласие на другата страна.
          </Text>
          <Text style={s.para}>
            (3) Задължението за конфиденциалност остава в сила 5 (пет) години след прекратяване на Договора.
          </Text>
          <Text style={s.para}>
            (4) В случай на нарушение — нарушителят дължи неустойка в размер на цената по чл. 2,
            без това да освобождава от обезщетение за по-големи действителни вреди.
          </Text>
        </View>

        {/* Article 7 — IP */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 7. Интелектуална собственост</Text>
          <Text style={s.para}>
            (1) С пълното заплащане на цената по чл. 2, всички права върху изработените за
            Възложителя софтуерни модули, конфигурации, prompt-ове и документация преминават
            върху Възложителя за неограничено ползване в неговата дейност.
          </Text>
          <Text style={s.para}>
            (2) Изпълнителят запазва правата върху своите универсални компоненти, шаблони и
            методологии, които ползва и при други клиенти.
          </Text>
          <Text style={s.para}>
            (3) Изпълнителят има право да упоменава Evolto като референция в своето портфолио, в
            съответствие с публично достъпна информация.
          </Text>
        </View>

        {/* Article 8 — Liability */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 8. Отговорност</Text>
          <Text style={s.para}>
            (1) Изпълнителят отговаря за качественото и срочно изпълнение в съответствие с
            обхвата по чл. 1.
          </Text>
          <Text style={s.para}>
            (2) Изпълнителят не отговаря за вреди, причинени от: грешни данни предоставени от
            Възложителя; промени в политиките на трети платформи (Meta, Google, Cloud
            доставчик); срив в инфраструктура на трети лица.
          </Text>
          <Text style={s.para}>
            (3) Максималната отговорност на Изпълнителя е ограничена до общата цена по чл. 2,
            освен при умисъл или груба небрежност.
          </Text>
        </View>

        {/* Article 9 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 9. Прекратяване</Text>
          <View style={s.bulletRow}><Text style={s.bullet}>(1)</Text><Text style={s.bulletText}>По взаимно писмено съгласие на страните.</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>(2)</Text><Text style={s.bulletText}>Едностранно от изправната страна с 14-дневно писмено предизвестие, при системно неизпълнение от другата страна.</Text></View>
          <View style={s.bulletRow}><Text style={s.bullet}>(3)</Text><Text style={s.bulletText}>При прекратяване от Възложителя след стартиране на работа, авансовото плащане не подлежи на връщане.</Text></View>
        </View>

        {/* Article 10 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 10. Лични данни</Text>
          <Text style={s.para}>
            Страните си гарантират взаимно, че обработването на лични данни на трети лица в
            рамките на изпълнението на Договора ще се извършва в съответствие с Регламент (ЕС)
            2016/679 (GDPR) и Закона за защита на личните данни. При нужда страните подписват
            отделно Споразумение за обработващ лични данни (DPA).
          </Text>
        </View>

        {/* Article 11 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 11. Приложимо право и спорове</Text>
          <Text style={s.para}>
            (1) За неуредените въпроси се прилага българското законодателство.
          </Text>
          <Text style={s.para}>
            (2) Споровете се решават чрез преговори, а при невъзможност — от компетентния
            български съд по седалището на Изпълнителя.
          </Text>
        </View>

        {/* Article 12 */}
        <View style={s.article}>
          <Text style={s.articleTitle}>Чл. 12. Заключителни разпоредби</Text>
          <Text style={s.para}>
            (1) Всякакви изменения и допълнения към този Договор се правят в писмена форма с
            подпис на двете страни.
          </Text>
          <Text style={s.para}>
            (2) Договорът се сключи в 2 (два) еднообразни екземпляра, по един за всяка от
            страните.
          </Text>
          <Text style={s.para}>
            (3) Електронен подпис или сканиран подпис, изпратен по имейл, се признава като
            валиден.
          </Text>
        </View>

        {/* Signatures */}
        <View style={s.signBlock}>
          <View style={s.signCol}>
            <Text style={s.signLabel}>За Изпълнителя</Text>
            <View style={s.signBox}>
              <Text style={s.signLine}>___________________________</Text>
              <Text style={s.signLine}>Ивайло Петев</Text>
              <Text style={s.signLine}>ProMarketing LTD</Text>
            </View>
          </View>
          <View style={s.signCol}>
            <Text style={s.signLabel}>За Възложителя</Text>
            <View style={s.signBox}>
              <Text style={s.signLine}>___________________________</Text>
              <Text style={s.signLine}>Васил Бедров</Text>
              <Text style={s.signLine}>Evolto</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
