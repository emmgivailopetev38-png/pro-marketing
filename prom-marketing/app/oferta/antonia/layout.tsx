import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * AI програма за Антония Сакарова (текстилен бизнес + нов бизнес за личностно развитие / NLP)
 * — 4 месеца 1:1, 1 800 € без ДДС, или онлайн курс 500 € без ДДС.
 * Цените и обхватът са казани от Ивайло на срещата (19.10.2026, Fathom 193840771).
 */
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--ant-ui", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--ant-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "AI за двата ви бизнеса · оферта за Антония",
  description: "Професионален визуален вид и съдържание за текстилния и за новия ви бизнес — с AI, управляван с глас, в двете възможности, които обсъдихме.",
  robots: { index: false, follow: false },
};

export default function AntoniaLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} ant-doc`}>{children}</div>;
}
