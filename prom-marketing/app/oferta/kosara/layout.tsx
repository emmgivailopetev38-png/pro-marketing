import { Golos_Text, Unbounded, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Галина Трендафилова — Kosara.bg (детски дрехи и обувки, онлайн магазин + физически магазини), 03.11.2026.
 * След безплатната консултация на 03.11 (Fathom 884529710): AI система за съдържанието в мрежите и продуктовата
 * обработка, инсталирана на 3 работни места + обучение на екипа — 800 € без ДДС (960 € с ДДС), еднократно.
 * Заглавията са с Unbounded, текстът — Golos, числата — JetBrains Mono (същият стил като /oferta/sonya).
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--fh-ui",
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--fh-display",
  weight: ["600", "700", "900"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--fh-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Съдържанието и продуктите на Kosara — на AI · за Галина · Pro Marketing",
  description:
    "AI система за Kosara.bg: от линк към продукт до готови видеа, снимки и текстове за мрежите, обработка на продуктовите снимки и обучение на екипа — на 3 работни места, с твоето одобрение за всичко.",
  robots: { index: false, follow: false },
};

export default function KosaraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${golos.variable} ${unbounded.variable} ${mono.variable} fh-doc`}
    >
      {children}
    </div>
  );
}
