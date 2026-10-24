import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за RoseBulgaria (rosebulgaria.eu, Стойко Стойков) — реклама в Meta + видеа +
 * органично съдържание, 450 € без ДДС на месец (540 € с ДДС), бюджетът за Meta е отделно.
 * Цената е казана от Ивайло на срещата (07.10.2026).
 *
 * Същите три шрифта като при Silverlines и ТОТЕХ — кирилицата е основното съдържание.
 * Тук Literata носи и заглавията, за по-топъл, „редакторски“ вид, който подхожда на розата.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--rbg-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--rbg-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--rbg-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RoseBulgaria · план за растеж · Pro Marketing",
  description:
    "План за RoseBulgaria: реклама във Facebook и Instagram, която първо спира да губи и после расте, и телефон, който превръща първата покупка в абонамент.",
  robots: { index: false, follow: false },
};

export default function RoseBulgariaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} rbg-doc`}>
      {children}
    </div>
  );
}
