import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { TodorHero } from "@/components/prezentacia/todor/TodorHero";
import { BusinessSnapshot } from "@/components/prezentacia/todor/BusinessSnapshot";
import { PainSignals } from "@/components/prezentacia/todor/PainSignals";
import { AgentSwarm } from "@/components/prezentacia/todor/AgentSwarm";
import { LiveCommandCenter } from "@/components/prezentacia/todor/LiveCommandCenter";
import { OfferPipeline } from "@/components/prezentacia/todor/OfferPipeline";
import { AmazonAutomation } from "@/components/prezentacia/todor/AmazonAutomation";
import { ProductionTracker } from "@/components/prezentacia/todor/ProductionTracker";
import { CapabilitiesGrid } from "@/components/prezentacia/todor/CapabilitiesGrid";
import { ImpactCounters } from "@/components/prezentacia/todor/ImpactCounters";
import { ProcessTimeline } from "@/components/prezentacia/todor/ProcessTimeline";
import { ClosingCTA } from "@/components/prezentacia/todor/ClosingCTA";

export default function DemoPresentationPage() {
  return (
    <main className="relative font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      <ScrollProgress />
      <TodorHero />
      <BusinessSnapshot />
      <PainSignals />
      <AgentSwarm />
      <LiveCommandCenter />
      <OfferPipeline />
      <AmazonAutomation />
      <ProductionTracker />
      <CapabilitiesGrid />
      <ImpactCounters />
      <ProcessTimeline />
      <ClosingCTA />
    </main>
  );
}
