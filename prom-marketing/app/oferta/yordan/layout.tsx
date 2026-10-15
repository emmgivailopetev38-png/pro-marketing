import { Onest, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

/** Оферта за Йордан Николов — гласов агент 1 000 € + агент на сайта 500 € (цените: Ивайло, бележка в календара). */
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--yrd-ui", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--yrd-display", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Гласов агент и агент на сайта · за Йордан Николов",
  description: "AI, който отговаря на въпросите на клиентите по телефона и в сайта.",
  robots: { index: false, follow: false },
};

export default function YordanLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${onest.variable} ${playfair.variable} yrd-doc`}>{children}</div>;
}
