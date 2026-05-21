import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Едуард · AI Автоматизация · ProMarketing",
  description:
    "Персонализирана оферта за AI автоматизация на социални мрежи, чат ботове и дашборд от ProMarketing LTD.",
  robots: { index: false, follow: false },
};

export default function EduardOfertaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#07080f",
          "--color-bg-deep": "#0d1221",
          "--color-bg-glass": "rgba(13, 18, 33, 0.75)",
          "--color-accent-cyan": "#00d4ff",
          "--color-accent-violet": "#818cf8",
          "--color-accent-magenta": "#a78bfa",
          "--color-text-primary": "#e8f4ff",
          "--color-text-secondary": "#7da8cc",
          "--color-text-tertiary": "#3d6080",
          "--color-border-default": "rgba(0, 212, 255, 0.10)",
          "--color-border-bright": "rgba(0, 212, 255, 0.30)",
          background: "#07080f",
          color: "#e8f4ff",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
