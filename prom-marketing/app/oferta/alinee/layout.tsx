import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "За Alineé Fragrances · Къде се губят продажбите",
  description:
    "Рекламата работи — спира се на сайта. Анализ на фунията от реклама до поръчка и три пакета за преструктура на магазина.",
  robots: { index: false, follow: false },
};

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
      {children}
    </div>
  );
}
