import type { Metadata } from "next";

/* /v2 е вътрешният адрес на същата начална страница — държи се като
   пътека за връщане назад, ако редизайнът трябва да се отмени. За
   търсачката обаче това е точно копие на „/" със същото заглавие и
   същия текст. robots.txt го спира да се обхожда, но забранената
   страница пак може да влезе в индекса само с адрес; noindex и
   каноничен адрес към „/" затварят и тази вратичка. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

import dynamic from "next/dynamic";
import "./v2-design.css";

import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { HeroV2 } from "@/components/landing/v2/HeroV2";
import { JarvisSpotlightV2 } from "@/components/landing/v2/JarvisSpotlightV2";
import { RobotTeaserV2 } from "@/components/landing/v2/RobotTeaserV2";
import { ConversionFloats } from "@/components/landing/v2/ConversionFloats";
import { BookingConfetti } from "@/components/effects/BookingConfetti";
import { Toaster } from "@/components/ui/sonner";

/* 04.10.2026 — началната страница е стегната от 22 на 12 секции (Ивайло: „малко
   разхвърлен… да го постегнем" и „да вдигнем доверието"). Свалени са секциите с
   измислени отзиви и клиенти (TestimonialsV2, SocialProofV2), фалшивите табла
   „на живо" (LiveDashboardsV2, ProductShowcaseV2, TrustStripV2), трейдингът и
   лабораторията (LiveLabsV2, QuickAccessV2), повторенията (PainPointsV2,
   IndustriesV2, FinalCTAV2) и изскачащият прозорец след 7 секунди
   (WelcomeLeadPopup). Компонентите остават в components/landing/v2 за връщане. */
const VideoGalleryV2 = dynamic(() => import("@/components/landing/v2/VideoGalleryV2").then((m) => ({ default: m.VideoGalleryV2 })));
const ServicesV2 = dynamic(() => import("@/components/landing/v2/ServicesV2").then((m) => ({ default: m.ServicesV2 })));
const CRMShowcaseV2 = dynamic(() => import("@/components/landing/v2/CRMShowcaseV2").then((m) => ({ default: m.CRMShowcaseV2 })));
const WhyUsV2 = dynamic(() => import("@/components/landing/v2/WhyUsV2").then((m) => ({ default: m.WhyUsV2 })));
const ExpertV2 = dynamic(() => import("@/components/landing/v2/ExpertV2").then((m) => ({ default: m.ExpertV2 })));
const RoiCalculatorV2 = dynamic(() => import("@/components/landing/v2/RoiCalculatorV2").then((m) => ({ default: m.RoiCalculatorV2 })));
const GuaranteeV2 = dynamic(() => import("@/components/landing/v2/GuaranteeV2").then((m) => ({ default: m.GuaranteeV2 })));
const FAQV2 = dynamic(() => import("@/components/landing/v2/FAQV2").then((m) => ({ default: m.FAQV2 })));
const QuickLeadFormV2 = dynamic(() => import("@/components/landing/v2/QuickLeadFormV2").then((m) => ({ default: m.QuickLeadFormV2 })));
const FooterV2 = dynamic(() => import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 })));
const StickyMobileCTA = dynamic(() => import("@/components/landing/StickyMobileCTA").then((m) => ({ default: m.StickyMobileCTA })));
const ChatWidget = dynamic(() => import("@/components/chatbot/ChatWidget").then((m) => ({ default: m.ChatWidget })));

export default function HomePageV2() {
  return (
    <div data-v2 className="v2-scope">
      <NavbarV2 />
      <main data-v2>
        <HeroV2 />
        <VideoGalleryV2 />
        <ServicesV2 />
        <CRMShowcaseV2 />
        <WhyUsV2 />
        <ExpertV2 />
        <RoiCalculatorV2 />
        <JarvisSpotlightV2 />
        <RobotTeaserV2 />
        <GuaranteeV2 />
        <FAQV2 />
        <QuickLeadFormV2 />
      </main>
      <FooterV2 />

      <BookingConfetti />
      <StickyMobileCTA />
      <ChatWidget />
      <ConversionFloats />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
