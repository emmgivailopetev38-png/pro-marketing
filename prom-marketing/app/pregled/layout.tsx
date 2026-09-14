import { Cormorant_Garamond, Manrope } from "next/font/google";
import type { Metadata } from "next";

/**
 * Страницата, на която клиент одобрява видеата си (/pregled/<ключ>).
 * Отделен layout извън сайта и извън CRM-а: няма меню, няма път към
 * нищо друго. Двата шрифта са с кирилица — всичко тук е на български.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pg-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pg-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Видеата за одобрение · Pro Marketing",
  description: "Първите готови клипове — за преглед и одобрение от клиента.",
  robots: { index: false, follow: false, nocache: true },
};

export default function PregledLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${cormorant.variable} ${manrope.variable} pg-doc`}>{children}</div>;
}
