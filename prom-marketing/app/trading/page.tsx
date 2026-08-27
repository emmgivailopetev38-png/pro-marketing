import type { Metadata } from "next";
import { TradingLanding } from "@/components/trading/TradingLanding";
import { TRADING } from "@/lib/trading/config";

export const metadata: Metadata = {
  // Персонална или клиентска страница — извън индекса нарочно.
  // robots.txt спира обхождането, но НЕ маха вече индексирана
  // страница; за това е нужен точно този етикет.
  robots: { index: false, follow: false },
  title: `${TRADING.title} — изгради своя трейдинг агент | ProMarketing`,
  description: `${TRADING.subtitle} Безплатна книга + личен разговор. Техническо обучение, не финансов съвет.`,
  openGraph: {
    title: `${TRADING.title} — изгради своя трейдинг агент`,
    description: TRADING.subtitle,
    locale: "bg_BG",
    type: "website",
  },
};

export default function TradingPage() {
  return <TradingLanding />;
}
