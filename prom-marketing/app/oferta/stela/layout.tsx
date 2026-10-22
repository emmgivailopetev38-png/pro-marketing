import {
  Golos_Text,
  Literata,
  Cormorant_Garamond,
  JetBrains_Mono,
} from "next/font/google";
import type { Metadata } from "next";

/**
 * Анализ + оферта за Стела Джурелова — INTERSTELLAR 18 (оригинални парфюми, interstellar18.com).
 * Разговор по Viber 22.10.2026: органичен маркетинг в мрежите, 3 видеа на ден, 480 € на месец.
 * Заглавията са с Cormorant (парфюмерийна класика), текстът — Literata, интерфейсът — Golos.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ist-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ist-body",
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ist-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ist-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Повече продажби за INTERSTELLAR 18 · за Стела · Pro Marketing",
  description:
    "Анализ на магазина и мрежите на INTERSTELLAR 18 и планът: 3 видеа на ден, един хит на месеца и доверие „оригинал с гаранция“.",
  robots: { index: false, follow: false },
};

export default function StelaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${golos.variable} ${literata.variable} ${cormorant.variable} ${mono.variable} ist-doc`}
    >
      {children}
    </div>
  );
}
