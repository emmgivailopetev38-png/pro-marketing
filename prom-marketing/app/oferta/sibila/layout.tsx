import { Cormorant_Garamond } from "next/font/google";
import type { Metadata } from "next";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Център Сибила · Вашата собствена система за записване",
  description:
    "Личен подарък от ProMarketing за Даниела — как изглежда система за записване, която е Ваша, а не наета.",
  robots: { index: false, follow: false },
};

export default function SibilaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${cormorant.variable} oferta-theme min-h-screen`}
      style={
        {
          // Топла, спокойна палитра — салон, не софтуерна фирма.
          "--color-bg-void": "#fdfaf7",
          "--color-bg-deep": "#f6eee8",
          "--color-bg-glass": "rgba(255, 253, 251, 0.75)",
          "--color-accent-cyan": "#b0724f",
          "--color-accent-violet": "#c69a86",
          "--color-accent-magenta": "#8c4a3f",
          "--color-text-primary": "#2c211c",
          "--color-text-secondary": "#5e4b42",
          "--color-text-tertiary": "#9b8579",
          "--color-border-default": "rgba(176, 114, 79, 0.20)",
          "--color-border-bright": "rgba(176, 114, 79, 0.50)",
          background: "#fdfaf7",
          color: "#2c211c",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
