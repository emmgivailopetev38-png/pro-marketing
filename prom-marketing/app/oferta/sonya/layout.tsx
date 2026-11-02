import { Golos_Text, Unbounded, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Соня Кузманова — „Омега Профит Груп“ ЕООД, счетоводна кантора, Пловдив (02.11.2026).
 * След инсталацията на Claude в кантората (Fathom 885086400): три AI кол агента на промоционална цена
 * 600 € без ДДС (решено от Ивайло) + по желание еднократно: реклама на имота в с. Батово — 200 € без ДДС.
 * Заглавията са с Unbounded, текстът — Golos, числата — JetBrains Mono (същият стил като /oferta/andreya).
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--fh-ui",
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--fh-display",
  weight: ["600", "700", "900"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--fh-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Телефонът на кантората — на AI · за Соня · Омега Профит Груп · Pro Marketing",
  description:
    "Три AI кол агента за счетоводната кантора — напомняния за документи, неплатени фактури и входящите обаждания на български и турски — на промоционална цена. Плюс по желание: рекламата на имота в Батово.",
  robots: { index: false, follow: false },
};

export default function SonyaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${golos.variable} ${unbounded.variable} ${mono.variable} fh-doc`}
    >
      {children}
    </div>
  );
}
