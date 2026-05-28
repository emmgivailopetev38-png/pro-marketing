import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Менторска програма · AI системи и автоматизация · ProMarketing",
  description:
    "4-месечна 1-на-1 менторска програма за изграждане на AI системи, автоматизация и CRM маркетинг. 16 седмични сесии, личен ментор, реални проекти. 2 000 € инвестиция.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Менторска програма · AI системи · ProMarketing",
    description:
      "16 седмични 1-на-1 сесии за изграждане на AI системи и автоматизация. От идея до собствен AI бизнес или внедряване в твоя текущ.",
    type: "website",
  },
};

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#080612",
          "--color-bg-deep": "#0f0a1e",
          "--color-bg-glass": "rgba(15, 10, 30, 0.75)",
          "--color-violet": "#8b5cf6",
          "--color-violet-bright": "#a78bfa",
          "--color-gold": "#facc15",
          "--color-gold-bright": "#fde047",
          "--color-text-primary": "#f5f3ff",
          "--color-text-secondary": "#c4b5fd",
          "--color-text-tertiary": "#6b5b8e",
          "--color-border-default": "rgba(139, 92, 246, 0.14)",
          "--color-border-bright": "rgba(139, 92, 246, 0.32)",
          background: "#080612",
          color: "#f5f3ff",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
