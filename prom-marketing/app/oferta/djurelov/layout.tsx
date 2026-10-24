import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * AI гласов асистент 24/7 — оферта след телефонен разговор (19.10.2026): изработка 700 € без ДДС, срок 1 месец.
 */
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--dju-ui", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--dju-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "AI гласов асистент 24/7 · оферта",
  description: "Асистент, който приема обажданията ти денем и нощем, събира заявката и ти праща резюме. Изработка 700 € без ДДС, срок 1 месец.",
  robots: { index: false, follow: false },
};

export default function DjurelovLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} dju-doc`}>{children}</div>;
}
