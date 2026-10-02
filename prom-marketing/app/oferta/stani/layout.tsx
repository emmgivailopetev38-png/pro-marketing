import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Стани (парти агенция, Русе) — външен гласов модул за робота Unitree R1:
 * говори на български и изпълнява функции, без достъп до самия робот.
 * 1 800 € с ДДС за настройката; устройството и месечните такси — отделно.
 *
 * Същите три шрифта като при ТОТЕХ, Денис и Солари — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--sta-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--sta-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--sta-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Оферта · за Стани · роботът говори на български",
  description:
    "Външен гласов модул за Unitree R1: говори с гостите на партитата на български, пуска игри, записва поздрави и запитвания — без достъп до самия робот.",
  robots: { index: false, follow: false },
};

export default function StaniLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} sta-doc`}>
      {children}
    </div>
  );
}
