import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * „AI наръчник за собственика“ — безплатният наръчник, към който води лийд
 * рекламата в Meta (екранът „Благодарим“ на формата → бутон „Изтегли наръчника“).
 *
 * Шрифтовете са като при офертите (`/oferta/*`): кирилицата е основното
 * съдържание. Literata носи заглавията, Golos Text — текста.
 *
 * Страницата е публична и МОЖЕ да се индексира — за разлика от офертите.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--nr-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--nr-head",
  weight: ["500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--nr-mono",
  weight: ["400", "500"],
});

const TITLE = "AI наръчник за собственика — безплатен PDF";
const DESCRIPTION =
  "10 задачи, които AI може да поеме във фирмата ти — запитвания, обаждания, CRM, оферти, реклами, отчети, документи — и как да започнеш още днес, безплатно или евтино.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/narachnik` },
  openGraph: {
    type: "article",
    locale: "bg_BG",
    url: `${SITE_URL}/narachnik`,
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function NarachnikLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} nr-doc`}>
      {children}
    </div>
  );
}
