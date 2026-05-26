import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Golden Key · AI Автоматизация на агенция за имоти · ProMarketing",
  description:
    "Тотална AI автоматизация за агенция за недвижими имоти — лийдове, разпределение, нива в CRM, чат с брокери, форми за HR, промотиране и социални мрежи.",
  robots: { index: false, follow: false },
};

export default function GoldenKeyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#0a0805",
          "--color-bg-deep": "#1a1208",
          "--color-bg-glass": "rgba(26, 18, 8, 0.75)",
          "--color-gold": "#d4af37",
          "--color-gold-bright": "#ffd700",
          "--color-cream": "#f5ecd7",
          "--color-text-primary": "#f5ecd7",
          "--color-text-secondary": "#b8a878",
          "--color-text-tertiary": "#7a6a48",
          "--color-border-default": "rgba(212, 175, 55, 0.12)",
          "--color-border-bright": "rgba(212, 175, 55, 0.30)",
          background: "#0a0805",
          color: "#f5ecd7",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
