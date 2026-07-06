import type { Metadata } from "next";
import { TradingLanding } from "@/components/trading/TradingLanding";
import { TRADING } from "@/lib/trading/config";

export const metadata: Metadata = {
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
