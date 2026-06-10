import dynamic from "next/dynamic";
import "./v2-design.css";

import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { HeroV2 } from "@/components/landing/v2/HeroV2";
import { TrustStripV2 } from "@/components/landing/v2/TrustStripV2";
import { SpotlightCursor } from "@/components/effects/SpotlightCursor";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { BookingConfetti } from "@/components/effects/BookingConfetti";
import { Toaster } from "@/components/ui/sonner";

const ServicesV2 = dynamic(() => import("@/components/landing/v2/ServicesV2").then((m) => ({ default: m.ServicesV2 })));
const LiveDashboardsV2 = dynamic(() => import("@/components/landing/v2/LiveDashboardsV2").then((m) => ({ default: m.LiveDashboardsV2 })));
const CRMShowcaseV2 = dynamic(() => import("@/components/landing/v2/CRMShowcaseV2").then((m) => ({ default: m.CRMShowcaseV2 })));
const PainPointsV2 = dynamic(() => import("@/components/landing/v2/PainPointsV2").then((m) => ({ default: m.PainPointsV2 })));
const IndustriesV2 = dynamic(() => import("@/components/landing/v2/IndustriesV2").then((m) => ({ default: m.IndustriesV2 })));
const TestimonialsV2 = dynamic(() => import("@/components/landing/v2/TestimonialsV2").then((m) => ({ default: m.TestimonialsV2 })));
const WhyUsV2 = dynamic(() => import("@/components/landing/v2/WhyUsV2").then((m) => ({ default: m.WhyUsV2 })));
const ExpertV2 = dynamic(() => import("@/components/landing/v2/ExpertV2").then((m) => ({ default: m.ExpertV2 })));
const FAQV2 = dynamic(() => import("@/components/landing/v2/FAQV2").then((m) => ({ default: m.FAQV2 })));
const QuickLeadFormV2 = dynamic(() => import("@/components/landing/v2/QuickLeadFormV2").then((m) => ({ default: m.QuickLeadFormV2 })));
const FinalCTAV2 = dynamic(() => import("@/components/landing/v2/FinalCTAV2").then((m) => ({ default: m.FinalCTAV2 })));
const FooterV2 = dynamic(() => import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 })));
const StickyMobileCTA = dynamic(() => import("@/components/landing/StickyMobileCTA").then((m) => ({ default: m.StickyMobileCTA })));
const ChatWidget = dynamic(() => import("@/components/chatbot/ChatWidget").then((m) => ({ default: m.ChatWidget })));

export default function HomePageV2() {
  return (
    <div data-v2 className="v2-scope">
      <NavbarV2 />
      <main data-v2>
        <HeroV2 />
        <TrustStripV2 />
        <ServicesV2 />
        <LiveDashboardsV2 />
        <CRMShowcaseV2 />
        <PainPointsV2 />
        <IndustriesV2 />
        <TestimonialsV2 />
        <WhyUsV2 />
        <ExpertV2 />
        <FAQV2 />
        <QuickLeadFormV2 />
        <FinalCTAV2 />
      </main>
      <FooterV2 />

      <SpotlightCursor />
      <ScrollProgress />
      <BookingConfetti />
      <StickyMobileCTA />
      <ChatWidget />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
