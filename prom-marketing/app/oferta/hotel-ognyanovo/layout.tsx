import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Семеен хотел Огняново (с. Огняново, общ. Гърмен) — Вили Куртов.
 * Пълна AI автоматизация на хотела, 5 900 € без ДДС, разделена на два етапа
 * по 2 950 € по нейно искане от телефонния разговор на 23.09.2026.
 *
 * Числата за хотела са проверени на 23.09.2026: Booking.com (9,2 от 116 отзива),
 * hotelognyanovo.com (цени, стаи, СПА), техническо измерване на сайта.
 *
 * Обръщението е на „Вие“ — писмена оферта към фирма.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--og-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--og-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--og-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Пълна AI автоматизация за Семеен хотел Огняново · оферта",
  description:
    "Телефонът се вдига от първото позвъняване, сайтът отговаря сам, имейлите тръгват без чакане, а социалните мрежи вървят по график. На два етапа, всеки със свой резултат.",
  robots: { index: false, follow: false },
};

export default function OgnyanovoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} og-doc`}>
      {children}
    </div>
  );
}
