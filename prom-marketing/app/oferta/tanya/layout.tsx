import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Таня Стойчева — Healthy Stop (магазин в Пловдив) + онлайн Healthy Looks Box.
 * Среща 22.10.2026 (Fathom 195162450): реклама за продажби, 450 € на месец.
 * Същите три шрифта като при Ваня — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tan-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tan-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tan-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Клиенти за Healthy Looks Box · за Таня · Pro Marketing",
  description:
    "Реклама за продажби за Healthy Looks Box: проследяване на всяка поръчка, рекламни видеа всеки месец и темпо, което магазинът може да обслужи.",
  robots: { index: false, follow: false },
};

export default function TanyaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} tan-doc`}>
      {children}
    </div>
  );
}
