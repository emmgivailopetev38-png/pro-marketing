import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за ТОТЕХ (тревни смески, тревен чим, озеленяване) — гласов AI агент,
 * система за поръчките и фактури от поръчката, 3 000 € с ДДС на две вноски.
 * Цената, вноските и срокът са казани от Ивайло на срещата (28.09.2026).
 *
 * Същите три шрифта като при Денис, Солари и NS Clean — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tot-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tot-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tot-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Оферта · за ТОТЕХ · гласов агент, поръчки и фактури",
  description:
    "Гласов AI агент, който поема еднотипните обаждания, една система за всички поръчки и фактури от самата поръчка — настроени за ТОТЕХ.",
  robots: { index: false, follow: false },
};

export default function TotexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} tot-doc`}>
      {children}
    </div>
  );
}
