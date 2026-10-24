import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * AI програма за новия бизнес на Петър Зинков (кафене/закусвалня с доставка, Благоевград)
 * — 4 месеца, 1 800 € без ДДС. Цената и обхватът са казани от Ивайло на срещата (13.10.2026).
 */
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--pzk-ui", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--pzk-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "AI програма за новия бизнес · 4 месеца · за Петър",
  description: "Четири месеца: уебсайт, CRM, приложение за поръчки и реклами с AI за кафенето ти в Благоевград — построено заедно, докато си в Германия.",
  robots: { index: false, follow: false },
};

export default function PetarLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} pzk-doc`}>{children}</div>;
}
