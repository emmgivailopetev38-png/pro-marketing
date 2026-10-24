import { Golos_Text, Literata } from "next/font/google";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * „ВЪЛНАТА“ — безплатният филм-уебинар (32 мин), който пращаме по имейл като
 * подарък. Шрифтовете и светлият вид са като при курса (/bezplaten-kurs).
 *
 * ⚠ Не се индексира и не е в sitemap-а — отваря се по линк от писмата и от
 * рекламите. Записването минава през формата, за да знаем кой гледа.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ub-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--ub-head",
  weight: ["500", "600", "700"],
});

const TITLE = "ВЪЛНАТА — безплатен филм-уебинар за AI и българския бизнес";
const DESCRIPTION =
  "32 минути: защо изпуснахме компютрите, какво изпускаме сега с AI и какво може да направи една малка фирма още тази седмица. Безплатно.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/uebinar` },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: `${SITE_URL}/uebinar`,
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: false, follow: true },
};

export default function UebinarLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${golos.variable} ${literata.variable} ub-doc`}>{children}</div>;
}
