import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Ваня Чавдарова — фризьорски салон, нова услуга удължаване на коса.
 * Среща 15.10.2026 (Fathom 193107422): месечна видео услуга 350 € или AI Академия 1 800 € без ДДС.
 * Същите три шрифта като при The Tree — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--van-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--van-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--van-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Видеа с твоите снимки и глас · за Ваня · Pro Marketing",
  description:
    "Две възможности за новата услуга удължаване на коса: месечни видеа от твоите снимки и твоя глас, или AI Академия за цялата система на салона.",
  robots: { index: false, follow: false },
};

export default function VanyaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} van-doc`}>
      {children}
    </div>
  );
}
