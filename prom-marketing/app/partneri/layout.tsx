import { Unbounded } from "next/font/google";
import type { Metadata } from "next";

const editorial = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Партньорска програма за маркетинг агенции · ProMarketing",
  description:
    "White-label AI автоматизация за маркетинг агенции, обслужващи хотели и имотни агенции. Ние сме твоят execution екип — 30–60 дни до handover.",
  alternates: { canonical: "https://promarketing.pw/partneri" },
};

export default function PartneriLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${editorial.variable} partneri-theme min-h-screen`}
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
