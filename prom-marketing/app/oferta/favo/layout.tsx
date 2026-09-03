import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Личен технически преглед за Любо Флорев — Фаво, Свищов.
 *
 * Кирилицата тук е основното съдържание, затова и трите шрифта са взети
 * с cyrillic подмножества: Golos Text е проектиран за кирилица и дава
 * правилните български форми, Literata носи четенето, JetBrains Mono
 * държи числата и адресите изравнени.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--favo-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--favo-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--favo-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Двата магазина на Favo · технически преглед",
  description:
    "Какво работи и къде изтичат поръчки при favo-shop.com и favo-decor.com — и планът за първите 30 дни преди коледния сезон.",
  robots: { index: false, follow: false },
};

export default function FavoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} favo-doc`}>
      {children}
    </div>
  );
}
