import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за The Tree (@thetreebg) — чайна в Мол Марково тепе, Пловдив: матча, кафе, брънч,
 * мед, чай и сладко. 3 кратки видеа на ден за страницата, 300 € без ДДС на месец (360 € с ДДС).
 * Цената е казана от Ивайло (16.10.2026), след разговор на място в чайната.
 *
 * Същите три шрифта като при RoseBulgaria — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tt-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tt-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--tt-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "The Tree · 3 видеа на ден · Pro Marketing",
  description:
    "Оферта за The Tree: всеки ден по 3 кратки видеа за Instagram и Facebook — от кадрите на чайната, с текстове, обложки и публикуване.",
  robots: { index: false, follow: false },
};

export default function TheTreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} tt-doc`}>
      {children}
    </div>
  );
}
