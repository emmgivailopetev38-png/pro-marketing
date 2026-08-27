import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Antoan 09 EOOD · AI Система за пожарогасители",
  description:
    "Персонална презентация за AI автоматизация на сервиз за пожарогасители — QR сканиране, авто-протоколи, проследяване на обслужвания.",
  robots: { index: false, follow: false },
};

export default function Antoan09Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#0a0408",
          "--color-bg-deep": "#1a0a14",
          "--color-bg-glass": "rgba(26, 10, 20, 0.75)",
          "--color-red": "#dc2626",
          "--color-red-bright": "#ef4444",
          "--color-orange": "#f97316",
          "--color-text-primary": "#fff5f5",
          "--color-text-secondary": "#fca5a5",
          "--color-text-tertiary": "#7a4848",
          "--color-border-default": "rgba(220, 38, 38, 0.12)",
          "--color-border-bright": "rgba(220, 38, 38, 0.30)",
          background: "#0a0408",
          color: "#fff5f5",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
