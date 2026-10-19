import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * AI система за магазина и фирмата за почистване на Мирослав Миланов — 3 000 €, старт с 1 000 € аванс.
 * Цената и обхватът са казани от Ивайло на срещата (19.10.2026, Fathom 193857684).
 */
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--mir-ui", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--mir-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "AI система за магазина и почистването · за Мирослав Миланов",
  description: "Автоматични поръчки към доставчиците, дигитално приемане на стока, задачи за екипа и срокове на годност. Първо магазинът, после почистването.",
  robots: { index: false, follow: false },
};

export default function MiroslavLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} mir-doc`}>{children}</div>;
}
