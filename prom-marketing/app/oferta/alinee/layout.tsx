import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "За Alineé Fragrances · Къде се губят продажбите",
  description:
    "Рекламата работи — спира се на сайта. Анализ на фунията от реклама до поръчка и три пакета за преструктура на магазина.",
  robots: { index: false, follow: false },
};

/**
 * За печат страницата минава в светла палитра. PDF-ът, който се сваля от нея,
 * се прави точно оттук (Chrome headless срещу самия маршрут), за да няма
 * втори текст, който да се разминава със страницата.
 */
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm 12mm; }
  /* Променливите се задават и inline върху .alinee-theme, а inline бие
     стиловия лист — затова тук всяка от тях е с !important. */
  .alinee-theme {
    --a-void: #ffffff !important;
    --a-deep: #ffffff !important;
    --a-card: #f6f3ec !important;
    --a-line: #d8d1c2 !important;
    --a-line-soft: #e9e4d9 !important;
    --a-amber: #8a5f14 !important;
    --a-amber-dim: #a87c33 !important;
    --a-alert: #92341c !important;
    --a-green: #2f5c3d !important;
    --a-text: #1b1610 !important;
    --a-text-2: #4a4239 !important;
    --a-text-3: #6f6659 !important;
    background: #ffffff !important;
    color: #1b1610 !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  /* Плътните амбър петна (ленти, бутони) стават тъмен текст на светло. */
  .alinee-theme [style*="#0d0a07"] { color: #1b1610 !important; }
  .alinee-theme main { max-width: none !important; padding: 0 !important; gap: 26px !important; }
  .alinee-theme section, .alinee-theme article, .alinee-theme table { break-inside: avoid; }
  .alinee-theme h1 { font-size: 30pt !important; }
  .alinee-theme h2 { font-size: 16pt !important; }
  .alinee-theme h3 { font-size: 13pt !important; }
  .alinee-theme a[href^="#"], .alinee-theme a[download] { display: none !important; }
  .alinee-theme a { color: inherit !important; text-decoration: none !important; }
}
`;

export default function AlineeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="alinee-theme min-h-screen"
      style={
        {
          "--a-void": "#0d0a07",
          "--a-deep": "#141009",
          "--a-card": "#1b1610",
          "--a-line": "rgba(232, 213, 178, 0.14)",
          "--a-line-soft": "rgba(232, 213, 178, 0.07)",
          "--a-amber": "#dfa94a",
          "--a-amber-dim": "#a87c33",
          "--a-alert": "#e08a6c",
          "--a-green": "#86b392",
          "--a-text": "#f2ece0",
          "--a-text-2": "#b8ae9d",
          "--a-text-3": "#7d7365",
          background: "#0d0a07",
          color: "#f2ece0",
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      {children}
    </div>
  );
}
