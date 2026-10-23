import { Golos_Text, Unbounded, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Анализ + оферта за Стефан Христов — ПРЕМИУМ АУТО СЕРВИЗ (бул. Илиянци 94, София · Военна рампа).
 * Безплатна консултация 23.10.2026 (Fathom 195623950): стартов пакет 450 € с ДДС/месец + ~20 €/ден
 * рекламен бюджет, 3 кратки видеа без лице, реклама за обаждания, старт понеделник 26.10.
 * Заглавията са с Unbounded (едро, „брутално“ — като видеата), текстът и интерфейсът — Golos.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pa-ui",
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pa-display",
  weight: ["600", "700", "900"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--pa-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Повече коли на подемника · за Стефан · Pro Marketing",
  description:
    "Анализ на Премиум Ауто Сервиз и планът: реклама за обаждания на Военна рампа, 3 видеа без лице, старт понеделник.",
  robots: { index: false, follow: false },
};

export default function StefanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${golos.variable} ${unbounded.variable} ${mono.variable} pa-doc`}
    >
      {children}
    </div>
  );
}
