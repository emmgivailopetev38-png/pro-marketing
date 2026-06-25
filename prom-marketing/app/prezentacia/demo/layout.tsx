import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI CRM · Командният център от бъдещето · ProMarketing",
  description:
    "Жива демонстрация на custom CRM от ProMarketing — 13 AI агента, контрол на обажданията, проследяване на оферти, автоматично четене на имейли и AI следене на производството.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#05080e",
          "--color-bg-deep": "#0b1320",
          "--color-bg-glass": "rgba(13, 20, 32, 0.75)",
          "--color-accent-cyan": "#22d3ee",
          "--color-accent-sky": "#38bdf8",
          "--color-accent-amber": "#fb923c",
          "--color-accent-emerald": "#34d399",
          "--color-text-primary": "#eaf6ff",
          "--color-text-secondary": "#9fb3c8",
          "--color-text-tertiary": "#5b7088",
          "--color-border-default": "rgba(34, 211, 238, 0.14)",
          "--color-border-bright": "rgba(56, 189, 248, 0.34)",
          background: "#05080e",
          color: "#eaf6ff",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
