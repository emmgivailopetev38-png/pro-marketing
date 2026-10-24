import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/**
 * AI гласов агент за потвърждаване на поръчките на Митев Трейдинг (mitevbg.com, CloudCart)
 * — изработка 600 €. Цената и обхватът са казани от Ивайло на срещата с Росица Митева (14.10.2026).
 */
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--mtv-ui", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--mtv-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "AI гласов агент за потвърждаване на поръчки · за Митев Трейдинг",
  description: "Агентът звъни на клиентите, потвърждава поръчката, записва корекциите в CloudCart и дава 10 % на лоялните клиенти. Изработка 600 €.",
  robots: { index: false, follow: false },
};

export default function MitevLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} mtv-doc`}>{children}</div>;
}
