import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Теодор Лозев · AI Автоматизация в строителството",
  description:
    "Персонализирана презентация за AI операционна система в строителния бранш — единен дашборд за склад, КСС, счетоводство и проекти.",
  robots: { index: false, follow: false },
};

export default function TeodorOfertaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#070a0f",
          "--color-bg-deep": "#0f1722",
          "--color-bg-glass": "rgba(15, 23, 34, 0.75)",
          "--color-accent-amber": "#ffb800",
          "--color-accent-cyan": "#00d4ff",
          "--color-accent-orange": "#ff8a3c",
          "--color-text-primary": "#fff4e1",
          "--color-text-secondary": "#c9a875",
          "--color-text-tertiary": "#7a6648",
          "--color-border-default": "rgba(255, 184, 0, 0.12)",
          "--color-border-bright": "rgba(255, 184, 0, 0.30)",
          background: "#070a0f",
          color: "#fff4e1",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
