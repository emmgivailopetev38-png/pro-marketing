import { Unbounded } from "next/font/google";
import type { Metadata } from "next";

const editorial = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Evolto · AI операционна система · ProMarketing",
  description:
    "Персонализирана AI операционна система за Evolto — Sales AI CRM + Content AI Engine. Автоматизирани оферти, договори, видеа, банери, постове.",
  robots: { index: false, follow: false },
};

export default function EvoltoOfertaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${editorial.variable} evolto-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#070b18",
          "--color-bg-deep": "#0a1429",
          "--color-bg-glass": "rgba(10, 20, 41, 0.75)",
          "--color-solar-gold": "#FFB800",
          "--color-solar-amber": "#F59E0B",
          "--color-electric-blue": "#3B82F6",
          "--color-electric-cyan": "#06B6D4",
          "--color-text-primary": "#f0f4ff",
          "--color-text-secondary": "#94a3b8",
          "--color-text-tertiary": "#475569",
          "--color-border-default": "rgba(255, 184, 0, 0.10)",
          "--color-border-bright": "rgba(255, 184, 0, 0.28)",
          background: "#070b18",
          color: "#f0f4ff",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
