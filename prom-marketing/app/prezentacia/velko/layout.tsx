import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Презентация за Велко Кузманов · Партньорство",
  description:
    "Как работи ProMarketing — какво продаваме, нивата, през които минава клиентът, двата пътя (done-for-you и менторска) и моделът на партньорство и възнаграждение. Лично за Велко Кузманов.",
  robots: { index: false, follow: false },
};

export default function VelkoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#080a08",
          "--color-bg-deep": "#0e140e",
          "--color-bg-glass": "rgba(14, 20, 14, 0.75)",
          "--color-gold": "#e0a82e",
          "--color-gold-bright": "#ffd166",
          "--color-emerald": "#10b981",
          "--color-emerald-bright": "#34d399",
          "--color-text-primary": "#f2f5ee",
          "--color-text-secondary": "#b7c4ad",
          "--color-text-tertiary": "#6f8068",
          "--color-border-default": "rgba(224, 168, 46, 0.14)",
          "--color-border-bright": "rgba(52, 211, 153, 0.34)",
          background: "#080a08",
          color: "#f2f5ee",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
