import { Golos_Text, Unbounded, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
  * Стартов план за Инж. Йордан Колев (Данчо) — JK Photography, Пловдив.
  * Среща на живо 23.10.2026: анализ, стратегия, две пробни видеа, как изглежда рекламата и лийд формата.
  * Кампании „Сватба 2027“ и „Коледни сесии“; платена първа кампания 400 €.
 * Заглавията са с Unbounded (едро, „брутално“ — като видеата), текстът и интерфейсът — Golos.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pa-ui",
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pa-display",
  weight: ["600", "700", "900"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pa-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Повече сватби през 2027 · за Данчо · Pro Marketing",
  description:
    "Стартов план за JK Photography: анализ, пазар и конкуренти в Пловдив, две пробни видеа, рекламата и формата за запитване.",
  robots: { index: false, follow: false },
};

export default function JkStartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${golos.variable} ${unbounded.variable} ${mono.variable} pa-doc`}
    >
      {children}
    </div>
  );
}
