import { Golos_Text, Unbounded, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Андрея — Full House, фулфилмънт център (02.11.2026).
 * AI call агенти за потвърждение на пратки в 2–3 държави (BG · RO · GR) на цени на едро за препродажба,
 * плюс каталогът с допълнителни агенти и услуги, които може да добави за своите клиенти.
 * Заглавията са с Unbounded, текстът и интерфейсът — Golos, числата — JetBrains Mono.
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
  title: "Всяка пратка потвърдена · за Андрея · Full House · Pro Marketing",
  description:
    "AI call агенти за потвърждение на пратки в България, Румъния и Гърция — цени на едро за препродажба, пилот и каталог с допълнителни агенти и услуги за фулфилмънт.",
  robots: { index: false, follow: false },
};

export default function AndreyaLayout({
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
