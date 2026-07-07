import "../v2/v2-design.css";
import dynamic from "next/dynamic";

import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { TradingDeck } from "@/components/ai-trading/TradingDeck";

const FooterV2 = dynamic(() =>
  import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 }))
);

export default function AiTradingPage() {
  return (
    <div
      data-v2
      className="v2-scope"
      style={{ background: "var(--v2-void)", minHeight: "100vh" }}
    >
      <NavbarV2 />
      <main data-v2 style={{ paddingTop: 90 }}>
        <TradingDeck />
      </main>
      <FooterV2 />
    </div>
  );
}
