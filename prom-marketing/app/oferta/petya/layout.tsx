import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * Менторска програма за Петя Симова (нумерология, продава лично; преди това
 * дигитален маркетинг и управление на IT проекти) — 3 месеца, 1 900 €.
 * Цената и обхватът са казани от Ивайло на срещата (07.10.2026, 29 мин).
 *
 * Два шрифта, и двата с кирилица: Onest за текста, Playfair Display за заглавията.
 */
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pet-ui",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pet-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Менторска програма · AI за твоя бизнес · за Петя Симова",
  description:
    "Три месеца персонално менторство: твоята собствена CRM система, AI агенти, видео, реклами, сайт и гласов агент — построени заедно, върху твоя бизнес.",
  robots: { index: false, follow: false },
};

export default function PetyaLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} pet-doc`}>{children}</div>;
}
