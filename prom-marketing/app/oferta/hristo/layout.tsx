import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * AI програма за агенцията на Христо Стойнев (недвижими имоти, екип от 5 брокера,
 * франчайз с CRM на холдинга) — 4 месеца, 1 900 €.
 * Цената и обхватът са казани от Ивайло на срещата (08.10.2026, 45 мин).
 *
 * Два шрифта, и двата с кирилица: Onest за текста, Playfair Display за заглавията.
 */
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--hri-ui",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--hri-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI програма за агенцията · 4 месеца · за Христо Стойнев",
  description:
    "Четири месеца: екипът се учи на AI, а системата поема снимките, видеата, социалните мрежи и текстовете — без да пипаме CRM-а на холдинга.",
  robots: { index: false, follow: false },
};

export default function HristoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} hri-doc`}>{children}</div>;
}
