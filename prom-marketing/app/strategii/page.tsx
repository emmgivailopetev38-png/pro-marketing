import "../v2/v2-design.css";
import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { StrategyLab } from "@/components/strategii/StrategyLab";
import dynamic from "next/dynamic";

const FooterV2 = dynamic(() =>
  import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 }))
);

export default function StrategiiPage() {
  return (
    <div data-v2 className="v2-scope" style={{ background: "var(--v2-void)", minHeight: "100vh" }}>
      <NavbarV2 />
      <main data-v2 style={{ paddingTop: 90 }}>
        <StrategyLab />
      </main>
      <FooterV2 />
    </div>
  );
}
