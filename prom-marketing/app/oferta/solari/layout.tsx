import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Презентация за Жоро Димитров (Жоро Солари) — соларни системи, програмата за
 * енергийна ефективност и автомобилите. Разговор на 03.09.2026, 17:30.
 *
 * Същите три шрифта като при Фаво: кирилицата е основното съдържание,
 * затова и трите са с cyrillic подмножества.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--sol-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--sol-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--sol-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Програмата, документите и колите · за Жоро Солари",
  description:
    "Как системата поема запитванията по програмата за енергийна ефективност, документите за ИСУН и обявите за автомобили — с примери и условията от разговора.",
  robots: { index: false, follow: false },
};

export default function SolariLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} sol-doc`}>
      {children}
    </div>
  );
}
