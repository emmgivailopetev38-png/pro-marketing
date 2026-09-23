import { Golos_Text, Literata, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

/**
 * Менторска програма за инж. Денис Коев (кредитно консултантство, счетоводство,
 * обучения) — 3 месеца, по един час седмично на живо с Ивайло, 2 000 €.
 * Цената и обхватът са казани по телефона от Ивайло (23.09.2026).
 *
 * Същите три шрифта като при Солари и NS Clean — кирилицата е основното съдържание.
 */
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--den-ui",
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--den-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--den-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Менторска програма · за инж. Денис Коев",
  description:
    "Три месеца, по един час седмично на живо: AI системи, маркетинг, сайтове, онлайн продажби и психологията на продажбения разговор — построени върху Вашия бизнес.",
  robots: { index: false, follow: false },
};

export default function DenisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${golos.variable} ${literata.variable} ${mono.variable} den-doc`}>
      {children}
    </div>
  );
}
