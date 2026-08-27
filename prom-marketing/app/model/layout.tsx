import type { Metadata } from "next";
import { Exo_2, Manrope, JetBrains_Mono } from "next/font/google";

import { PageSchema } from "@/components/seo/PageSchema";
const display = Exo_2({ subsets: ["latin", "cyrillic"], weight: ["500", "600", "700", "800"], variable: "--m-display", display: "swap" });
const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--m-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"], variable: "--m-mono", display: "swap" });

export const metadata: Metadata = {
  alternates: { canonical: "/model" },
  title: "Продуктов модел — рамка по браншове",
  description:
    "Темплейт рамка по браншове: база от 5–7 безупречни автоматизации + custom add-ons. Построй веднъж, продай много.",
  // Досега тази страница беше noindex и същевременно стоеше в картата
  // на сайта — противоречив сигнал, който Search Console отчита като
  // грешка. Страницата е публична, обемна и линкната от менюто, значи
  // мястото ѝ е в индекса.
  robots: { index: true, follow: true },
};

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageSchema path="/model" name="Продуктов модел по браншове" description="Как строим системата веднъж и я пренасяме по браншове." crumb="Продуктов модел" />
    <div
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      style={
        {
          "--m-bg": "#05060f",
          "--m-bg2": "#080b18",
          "--m-panel": "rgba(14, 20, 38, 0.66)",
          "--m-panel-solid": "#0b1020",
          "--m-line": "rgba(125, 160, 220, 0.14)",
          "--m-line-bright": "rgba(45, 212, 218, 0.42)",
          "--m-cyan": "#2dd4d8",
          "--m-sky": "#38bdf8",
          "--m-violet": "#9d7bff",
          "--m-pink": "#ef5da8",
          "--m-gold": "#f0c560",
          "--m-emerald": "#34d399",
          "--m-text": "#eaf1ff",
          "--m-dim": "#93a6c6",
          "--m-faint": "#56688a",
          background: "#05060f",
          color: "#eaf1ff",
          minHeight: "100vh",
          fontFamily: "var(--m-body), system-ui, sans-serif",
          overflowX: "hidden",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
    </>
  );
}
