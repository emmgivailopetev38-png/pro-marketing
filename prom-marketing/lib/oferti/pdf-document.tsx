/**
 * PDF-ът на офертата — един образец за всички оферти от модули (06.11.2026).
 * Бял лист, NotoSans (кирилица), цветовете на бранда: мастило, циан, кехлибар.
 * Без емоджита — NotoSans няма глифове за тях.
 */
import { Document, Page, Text, View, StyleSheet, Font, Link } from "@react-pdf/renderer";
import type { OfferItem } from "./katalog";
import { fmtEur, withUnit } from "./smetki";
import type { OfferView } from "./view";

const FONT_HOST = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://promarketing.pw";

// Курсив няма отделен файл: регистрираме курсивните варианти върху същите файлове,
// за да не пада PDF-ът с „Could not resolve font … fontStyle italic“ (09.11.2026 — оферта № 2026-042).
Font.register({
  family: "NotoSans",
  fonts: [
    { src: `${FONT_HOST}/fonts/NotoSans-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_HOST}/fonts/NotoSans-Bold.ttf`, fontWeight: 700 },
    { src: `${FONT_HOST}/fonts/NotoSans-Regular.ttf`, fontWeight: 400, fontStyle: "italic" },
    { src: `${FONT_HOST}/fonts/NotoSans-Bold.ttf`, fontWeight: 700, fontStyle: "italic" },
  ],
});
// кирилицата не се пренася по срички — думата остава цяла
Font.registerHyphenationCallback((word) => [word]);

const C = {
  ink: "#0b1220",
  soft: "#475569",
  faint: "#94a3b8",
  cyan: "#0e7490",
  cyanBg: "#ecfeff",
  amber: "#b45309",
  amberBg: "#fffbeb",
  violet: "#6d28d9",
  line: "#e2e8f0",
  panel: "#f8fafc",
};

const s = StyleSheet.create({
  page: { backgroundColor: "#fff", color: C.ink, fontFamily: "NotoSans", fontSize: 10, paddingTop: 0, paddingBottom: 46, paddingHorizontal: 0 },
  band: { height: 6, backgroundColor: C.cyan },
  body: { paddingHorizontal: 44, paddingTop: 22 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 },
  brand: { fontSize: 15, fontWeight: 700, letterSpacing: 0.4 },
  brandAccent: { color: C.cyan },
  brandSub: { fontSize: 7.5, color: C.faint, marginTop: 2, letterSpacing: 0.8 },
  meta: { fontSize: 8, color: C.soft, textAlign: "right", lineHeight: 1.5 },
  eyebrow: { fontSize: 7.5, color: C.amber, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 6 },
  h1: { fontSize: 23, fontWeight: 700, lineHeight: 1.18, marginBottom: 10 },
  greet: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  lead: { fontSize: 10.5, color: C.soft, lineHeight: 1.6, marginBottom: 10 },
  pain: { backgroundColor: C.amberBg, borderLeftWidth: 3, borderLeftColor: C.amber, padding: 10, marginBottom: 12, fontSize: 10, lineHeight: 1.55 },
  painLabel: { fontSize: 7.5, color: C.amber, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 3 },
  outcome: { backgroundColor: C.cyanBg, borderLeftWidth: 3, borderLeftColor: C.cyan, padding: 10, marginBottom: 6, fontSize: 10.5, lineHeight: 1.55, fontWeight: 700 },
  h2: { fontSize: 13.5, fontWeight: 700, marginTop: 18, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardTitle: { fontSize: 12.5, fontWeight: 700, flex: 1, paddingRight: 10 },
  cardSub: { fontSize: 9.5, color: C.soft, marginBottom: 6, lineHeight: 1.45 },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 14, fontWeight: 700, color: C.amber },
  priceUnit: { fontSize: 8, color: C.soft },
  bulletRow: { flexDirection: "row", marginTop: 2.5, paddingRight: 6 },
  bullet: { width: 10, color: C.cyan, fontSize: 9.5, fontWeight: 700 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.45 },
  cardOutcome: { marginTop: 7, fontSize: 9.5, color: C.cyan, fontWeight: 700, lineHeight: 1.45 },
  cardNot: { marginTop: 6, fontSize: 8.5, color: C.faint, lineHeight: 1.45 },
  note: { marginTop: 6, fontSize: 9, color: C.soft, lineHeight: 1.45 },
  table: { borderWidth: 1, borderColor: C.line, borderRadius: 6, overflow: "hidden" },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  trLast: { borderBottomWidth: 0 },
  trTotal: { backgroundColor: C.panel },
  tdName: { flex: 1, fontSize: 9.5 },
  tdSub: { fontSize: 8, color: C.faint },
  tdPrice: { width: 120, textAlign: "right", fontSize: 9.5 },
  tdBold: { fontWeight: 700 },
  totalLabel: { flex: 1, fontSize: 10.5, fontWeight: 700 },
  totalVal: { width: 160, textAlign: "right", fontSize: 12, fontWeight: 700, color: C.amber },
  vat: { fontSize: 8.5, color: C.soft, marginTop: 6 },
  inst: { marginTop: 8, backgroundColor: C.panel, borderRadius: 6, padding: 10 },
  instTitle: { fontSize: 8, color: C.violet, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  instLine: { fontSize: 9.5, lineHeight: 1.5 },
  instNote: { fontSize: 7.5, color: C.faint, marginTop: 3 },
  step: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.cyan, color: "#fff", fontSize: 9, fontWeight: 700, textAlign: "center", paddingTop: 3.5, marginRight: 9 },
  stepText: { flex: 1, fontSize: 9.8, lineHeight: 1.5, paddingTop: 2 },
  term: { flexDirection: "row", marginBottom: 3 },
  termDash: { width: 10, color: C.faint },
  termText: { flex: 1, fontSize: 9.2, color: C.soft, lineHeight: 1.5 },
  ps: { marginTop: 10, fontSize: 9.5, color: C.soft, lineHeight: 1.5 },
  sign: { marginTop: 22, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 },
  signName: { fontSize: 11, fontWeight: 700 },
  signRole: { fontSize: 8.5, color: C.soft, marginTop: 1 },
  signLine: { fontSize: 9.5, marginTop: 4 },
  signRight: { alignItems: "flex-end" },
  signHint: { fontSize: 8.5, color: C.soft, textAlign: "right", lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 18, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint },
  // „за сравнение“ (11.11.2026)
  cmpNote: { fontSize: 9.8, color: C.soft, lineHeight: 1.55, marginBottom: 8 },
  cmpRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  cmpLabel: { width: 112, paddingVertical: 6, paddingHorizontal: 8, fontSize: 8.4, color: C.soft, lineHeight: 1.4 },
  cmpCell: { flex: 1, paddingVertical: 6, paddingHorizontal: 7, fontSize: 8.6, lineHeight: 1.4, borderLeftWidth: 1, borderLeftColor: C.line },
  cmpCellRec: { backgroundColor: C.cyanBg },
  cmpColTitle: { fontSize: 9, fontWeight: 700, lineHeight: 1.3 },
  cmpTag: { fontSize: 6.8, color: C.cyan, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2, fontWeight: 700 },
  cmpStrong: { fontWeight: 700, color: C.amber },
  cardAlt: { backgroundColor: C.panel },
  altTag: { fontSize: 7, color: C.faint, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  // свободните раздели и „Кой е Ивайло Петев“
  secText: { fontSize: 9.8, lineHeight: 1.55, marginBottom: 5 },
  about: { borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, backgroundColor: C.panel },
  aboutText: { fontSize: 9.6, lineHeight: 1.55, marginBottom: 5 },
  aboutLabel: { fontSize: 7.5, color: C.amber, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 5, marginBottom: 2 },
  aboutProof: { fontSize: 10, fontWeight: 700, lineHeight: 1.45 },
  aboutLink: { fontSize: 9.2, lineHeight: 1.6 },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((b, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bullet}>·</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function ItemCard({ it, tag }: { it: OfferItem; tag?: string }) {
  return (
    <View style={tag ? [s.card, s.cardAlt] : s.card} wrap={false}>
      {tag ? <Text style={s.altTag}>{tag}</Text> : null}
      <View style={s.cardTop}>
        <Text style={s.cardTitle}>{it.title}</Text>
        <View style={s.priceBox}>
          <Text style={s.price}>{fmtEur(it.price)}</Text>
          <Text style={s.priceUnit}>
            {it.unit}
            {it.qty && it.qty > 1 ? ` × ${it.qty}` : ""}
          </Text>
          {it.setup_price ? (
            <Text style={s.priceUnit}>
              + {fmtEur(it.setup_price)} {it.setup_label ?? "внедряване"}
            </Text>
          ) : null}
        </View>
      </View>
      {it.subtitle ? <Text style={s.cardSub}>{it.subtitle}</Text> : null}
      <Bullets items={it.bullets ?? []} />
      {it.outcome ? <Text style={s.cardOutcome}>Резултатът: {it.outcome}</Text> : null}
      {it.not_included && it.not_included.length > 0 ? <Text style={s.cardNot}>Не включва: {it.not_included.join(" · ")}</Text> : null}
      {it.note ? <Text style={s.note}>{it.note}</Text> : null}
    </View>
  );
}

export function OfferPdf({ v }: { v: OfferView }) {
  const { offer, seller, content, totals } = v;
  // редовете от модела (при „Вие“ — вече в учтива форма)
  const items = v.items;
  const showMonthly = totals.monthly_after > 0;
  const showOneTime = totals.one_time_after > 0 || totals.one_time > 0;
  return (
    <Document title={`Оферта ${v.number} · ProMarketing за ${v.forLine}`} author="ProMarketing" subject={offer.title} language="bg">
      <Page size="A4" style={s.page}>
        <View style={s.band} fixed />
        <View style={s.body}>
          <View style={s.head}>
            <View>
              <Text style={s.brand}>
                Pro<Text style={s.brandAccent}>Marketing</Text>
              </Text>
              <Text style={s.brandSub}>AI МАРКЕТИНГ · АВТОМАТИЗАЦИИ · СИСТЕМИ ЗА МАЛКИ ФИРМИ</Text>
            </View>
            <Text style={s.meta}>
              Оферта № {v.number} · {v.date}
              {"\n"}валидна до {v.validUntil}
            </Text>
          </View>

          <Text style={s.eyebrow}>Оферта за {v.forLine}</Text>
          <Text style={s.h1}>{offer.title}</Text>
          <Text style={s.greet}>{v.greeting}</Text>
          {content.intro ? <Text style={s.lead}>{content.intro}</Text> : null}
          {content.pain ? (
            <View style={s.pain}>
              <Text style={s.painLabel}>Това чухме от {content.greeting === "vie" ? "Вас" : "теб"}</Text>
              <Text>{content.pain}</Text>
            </View>
          ) : null}
          {content.outcome ? <Text style={s.outcome}>{content.outcome}</Text> : null}

          <Text style={s.h2}>Какво получава{content.greeting === "vie" ? "те" : "ш"}</Text>
          {items.map((it, i) => (
            <ItemCard key={i} it={it} />
          ))}

          <Text style={s.h2}>Инвестицията</Text>
          <View style={s.table}>
            {items.map((it, i) => (
              <View key={i} style={s.tr}>
                <View style={s.tdName}>
                  <Text>{it.title}</Text>
                  {it.setup_price ? (
                    <Text style={s.tdSub}>
                      + внедряване {fmtEur(it.setup_price)} еднократно
                    </Text>
                  ) : null}
                </View>
                <Text style={s.tdPrice}>
                  {withUnit(fmtEur((it.price ?? 0) * (it.qty && it.qty > 0 ? it.qty : 1)), it.unit)}
                </Text>
              </View>
            ))}
            {totals.discount > 0 ? (
              <View style={s.tr}>
                <Text style={s.tdName}>Отстъпка{offer.discount_note ? ` — ${offer.discount_note}` : ""}</Text>
                <Text style={[s.tdPrice, s.tdBold]}>− {fmtEur(totals.discount)}</Text>
              </View>
            ) : null}
            {showOneTime ? (
              <View style={[s.tr, s.trTotal, showMonthly ? {} : s.trLast]}>
                <Text style={s.totalLabel}>Общо еднократно</Text>
                <Text style={s.totalVal}>{fmtEur(totals.one_time_after)}</Text>
              </View>
            ) : null}
            {showMonthly ? (
              <View style={[s.tr, s.trTotal, s.trLast]}>
                <Text style={s.totalLabel}>Общо месечно</Text>
                <Text style={s.totalVal}>{fmtEur(totals.monthly_after)}/мес</Text>
              </View>
            ) : null}
          </View>
          {v.vatLine ? <Text style={s.vat}>{v.vatLine}</Text> : null}
          {v.hasInstallments ? (
            <View style={s.inst} wrap={false}>
              <Text style={s.instTitle}>На вноски през TBI Bank</Text>
              {v.installmentLines.map((l, i) => (
                <Text key={i} style={s.instLine}>
                  {v.installmentLines.length > 1 ? `${l.title}: ` : ""}
                  {l.line} на месец
                </Text>
              ))}
              <Text style={s.instNote}>Ориентировъчно, без застраховка; точната вноска се вижда при одобрението онлайн (минути, без посещение в банка).</Text>
            </View>
          ) : null}

          {v.compare ? (
            <View>
              <View wrap={false}>
                <Text style={s.h2}>{v.compare.title}</Text>
                <Text style={s.cmpNote}>{v.compare.note}</Text>
                {v.compare.table ? (
                  <View style={[s.table, { marginBottom: 10 }]}>
                    <View style={[s.cmpRow, s.trTotal]}>
                      <Text style={s.cmpLabel}> </Text>
                      {v.compare.table.columns.map((c, i) => (
                        <View key={i} style={c.recommended ? [s.cmpCell, s.cmpCellRec] : s.cmpCell}>
                          <Text style={s.cmpColTitle}>{c.title}</Text>
                          {c.recommended ? <Text style={s.cmpTag}>препоръчано</Text> : null}
                        </View>
                      ))}
                    </View>
                    {v.compare.table.rows.map((r, i, all) => (
                      <View key={i} style={i === all.length - 1 ? [s.cmpRow, s.trLast] : s.cmpRow}>
                        <Text style={s.cmpLabel}>{r.label}</Text>
                        {r.values.map((val, j) => (
                          <Text
                            key={j}
                            style={[
                              s.cmpCell,
                              v.compare!.table!.columns[j]?.recommended ? s.cmpCellRec : {},
                              r.label === "Цена" ? s.cmpStrong : {},
                            ]}
                          >
                            {val}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
              {v.alternatives.map((it, i) => (
                <ItemCard key={i} it={it} tag="за сравнение — не влиза в сумата" />
              ))}
            </View>
          ) : null}

          {v.sections.map((sec, i) => (
            <View key={i} wrap={false}>
              <Text style={s.h2}>{sec.title}</Text>
              {(sec.text ?? "")
                .split(/\n\s*\n/)
                .map((x) => x.trim())
                .filter(Boolean)
                .map((para, j) => (
                  <Text key={j} style={s.secText}>
                    {para}
                  </Text>
                ))}
              {sec.bullets && sec.bullets.length > 0 ? <Bullets items={sec.bullets} /> : null}
            </View>
          ))}

          {content.next_steps.length > 0 ? (
            <View wrap={false}>
              <Text style={s.h2}>Как протича</Text>
              {content.next_steps.map((st, i) => (
                <View key={i} style={s.step}>
                  <Text style={s.stepNum}>{i + 1}</Text>
                  <Text style={s.stepText}>{st}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {content.terms.length > 0 ? (
            <View wrap={false}>
              <Text style={s.h2}>Условия</Text>
              {content.terms.map((t, i) => (
                <View key={i} style={s.term}>
                  <Text style={s.termDash}>–</Text>
                  <Text style={s.termText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {content.ps ? <Text style={s.ps}>P.S. {content.ps}</Text> : null}

          {v.about ? (
            <View wrap={false}>
              <Text style={s.h2}>{v.about.title}</Text>
              <View style={s.about}>
                {v.about.paragraphs.map((para, i) => (
                  <Text key={i} style={s.aboutText}>
                    {para}
                  </Text>
                ))}
                {v.about.cases.length > 0 ? (
                  <View>
                    <Text style={s.aboutLabel}>{v.about.cases_label}</Text>
                    <Bullets items={v.about.cases} />
                  </View>
                ) : null}
                <Text style={s.aboutLabel}>{v.about.proof_label}</Text>
                <Text style={s.aboutProof}>{v.about.proof}</Text>
                <Text style={s.aboutLabel}>{v.about.links_label}</Text>
                {v.about.links.map((l, i) => (
                  <Text key={i} style={s.aboutLink}>
                    {l.label}:{" "}
                    <Link src={l.url} style={{ color: C.cyan }}>
                      {l.url.replace(/^https?:\/\//, "")}
                    </Link>
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          <View style={s.sign} wrap={false}>
            <View>
              <Text style={s.signName}>{seller.name}</Text>
              <Text style={s.signRole}>{seller.role}</Text>
              <Text style={s.signLine}>{seller.phone}</Text>
              {seller.key !== "ivailo" ? <Text style={s.signLine}>Ивайло Петев · основател · +359 877 399 963</Text> : null}
            </View>
            <View style={s.signRight}>
              <Text style={s.signHint}>Въпрос или „да“ — отговор на имейла или едно обаждане.</Text>
              <Text style={s.signHint}>
                Офертата онлайн: <Link src={v.url} style={{ color: C.cyan }}>{v.url.replace(/^https?:\/\//, "")}</Link>
              </Text>
              <Text style={[s.signHint, { marginTop: 4 }]}>promarketing.pw · petevai.com</Text>
            </View>
          </View>
        </View>
        <View style={s.footer} fixed>
          <Text>ProMarketing · Pro Marketing LTD · Русе · promarketing.pw · petevai.com</Text>
          <Text render={({ pageNumber, totalPages }) => `Оферта ${v.number} · стр. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
