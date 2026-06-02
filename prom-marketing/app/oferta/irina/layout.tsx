import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Ирина Белева · AI операционна система за складове с храни · ProMarketing",
  description:
    "Персонална презентация за AI автоматизация на складова база за храни — наличности в реално време, срокове и партиден контрол (FEFO), B2B портал, документи и сертификати, доставки и анализи.",
  robots: { index: false, follow: false },
};

export default function IrinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#06140f",
          "--color-bg-deep": "#0b2018",
          "--color-bg-glass": "rgba(11, 32, 24, 0.75)",
          "--color-emerald": "#10b981",
          "--color-emerald-bright": "#34d399",
          "--color-cold": "#2dd4bf",
          "--color-amber": "#fbbf24",
          "--color-red": "#ef4444",
          "--color-text-primary": "#ecfdf5",
          "--color-text-secondary": "#a7d8c4",
          "--color-text-tertiary": "#5b8f78",
          "--color-border-default": "rgba(16, 185, 129, 0.16)",
          "--color-border-bright": "rgba(52, 211, 153, 0.38)",
          background: "#06140f",
          color: "#ecfdf5",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
