import { Alegreya_Sans, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Планът за магазин „Арт Сувенири“ (Бургас) — Ирина. Разговор на 08.09.2026;
 * Ивайло е бил физически в магазина. Демото на самия магазин е статична
 * страница на /oferta/art-suveniri/demo (public/…/index.html + rewrite).
 *
 * Шрифтовете повтарят демото, за да са едно цяло: Cormorant за заглавията
 * (кирилица), Alegreya Sans за текста, JetBrains Mono за числата.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ars-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const alegreya = Alegreya_Sans({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ars-body",
  weight: ["400", "500", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ars-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Планът за Арт Сувенири · Бургас",
  description:
    "Три месеца работа, разписани по седмици — къде е магазинът днес, кое губи клиенти още сега и в какъв ред се оправя. С демо на онлайн магазина.",
  robots: { index: false, follow: false },
};

export default function ArtSuveniriLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${alegreya.variable} ${mono.variable} ars-doc`}>
      {children}
    </div>
  );
}
