import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за NS Clean (почистваща фирма, София) — пълна автоматизация на пътя
 * от запитването до платената фактура, 2 000 € без ДДС. Разговор на 14.09.2026.
 *
 * Същите три шрифта като при Фаво и Солари: кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--nsc-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--nsc-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--nsc-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Пълна автоматизация за NS Clean · оферта",
  description:
    "Запитването влиза само, огледът се записва сам, офертата излиза за минути, екипът получава графика си, а след работата тръгват фактурата и молбата за отзив. За почистваща фирма в София.",
  robots: { index: false, follow: false },
};

export default function NscleanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} nsc-doc`}>
      {children}
    </div>
  );
}
