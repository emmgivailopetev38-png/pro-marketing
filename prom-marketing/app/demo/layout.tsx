import type { Metadata } from "next";
import { Exo_2, Manrope, JetBrains_Mono } from "next/font/google";

const display = Exo_2({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--d-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--d-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--d-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProMarketing OS · Живо демо · AI операционна система за бизнес",
  description:
    "Интерактивно демо — пуснете и спрете AI агенти, генерирайте видеа и публикации, гледайте живия CRM поток. Командният център от бъдещето.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      style={
        {
          "--d-bg": "#04060d",
          "--d-bg2": "#070c18",
          "--d-panel": "rgba(13, 21, 38, 0.72)",
          "--d-panel-solid": "#0a1120",
          "--d-line": "rgba(120, 165, 220, 0.14)",
          "--d-line-bright": "rgba(34, 211, 238, 0.4)",
          "--d-cyan": "#22d3ee",
          "--d-sky": "#38bdf8",
          "--d-blue": "#3b82f6",
          "--d-violet": "#8b5cf6",
          "--d-pink": "#ec4899",
          "--d-emerald": "#34d399",
          "--d-amber": "#fbbf24",
          "--d-gold": "#f5c542",
          "--d-red": "#fb7185",
          "--d-text": "#eaf4ff",
          "--d-dim": "#90a6c4",
          "--d-faint": "#566984",
          background: "#04060d",
          color: "#eaf4ff",
          minHeight: "100vh",
          fontFamily: "var(--d-body), system-ui, sans-serif",
          overflowX: "hidden",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
