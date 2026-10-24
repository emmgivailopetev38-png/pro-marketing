import { Golos_Text, Literata } from "next/font/google";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * „Фирма с AI служители“ — безплатният видео курс, към който води лийд
 * рекламата в Meta (екранът „Благодарим“ на формата → бутон „Гледай курса“)
 * и първото писмо към новия лийд.
 *
 * Шрифтовете са като при наръчника (/narachnik).
 *
 * ⚠ Страницата НЕ се индексира и НЕ е в sitemap-а, докато Ивайло не каже
 * „пускай“ за курса — до тогава се отваря само по линк. После: `index: true`
 * тук + ред в SUPPORTING_PAGES (lib/seo/site.ts).
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--kr-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--kr-head",
  weight: ["500", "600", "700"],
});

const TITLE = "Фирма с AI служители — безплатен видео курс";
const DESCRIPTION =
  "Пет кратки видео урока: какво вече вършат AI служителите в една истинска малка фирма — телефона, офертите, рекламите, видеата и отчетите. С истинските екрани.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/bezplaten-kurs` },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: `${SITE_URL}/bezplaten-kurs`,
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: false, follow: true },
};

export default function BezplatenKursLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${golos.variable} ${literata.variable} kr-doc`}>{children}</div>;
}
