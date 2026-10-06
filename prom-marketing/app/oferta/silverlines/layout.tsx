import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Оферта за Silverlines (автосервиз на „ОГИ и сие“ ЕООД, кв. Горубляне) —
 * управлявана Google Ads кампания, 150 € + ДДС на месец, първият месец с 50% аванс.
 * Цените са казани от Ивайло на срещата с Огнян Коцев (06.10.2026).
 *
 * Същите три шрифта като при ТОТЕХ, Солари и NS Clean — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--slv-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--slv-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--slv-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Оферта · за Silverlines · Google реклама за сервиза",
  description:
    "Управлявана Google Ads кампания за автосервиз Silverlines в Горубляне — повече обаждания от хора, които търсят сервиз точно сега.",
  robots: { index: false, follow: false },
};

export default function SilverlinesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} slv-doc`}>
      {children}
    </div>
  );
}
