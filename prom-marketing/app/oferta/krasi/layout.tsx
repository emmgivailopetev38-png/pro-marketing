import { Golos_Text, Unbounded, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
  * Анализ + оферта за Краси Кръстев — семеен хотел с 6 стаи в Стамболийски (обл. Пловдив).
  * Безплатна консултация 20.10.2026 (Fathom 866907039): 1 месец Meta кампания за резервации 450 € + 10–15 €/ден
  * рекламен бюджет, две кампании „Уикенд“/„Делник“, 3 видеа от истинския хотел. Краси решава с жена си.
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
  title: "Шестте стаи пълни · за Краси · Pro Marketing",
  description:
    "Анализ на семейния хотел в Стамболийски и планът: реклама за резервации от Пловдив и София, две кампании, 3 видеа.",
  robots: { index: false, follow: false },
};

export default function KrasiLayout({
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
