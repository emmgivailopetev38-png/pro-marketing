import type { Metadata } from "next";
import { PitchHero } from "@/components/pitch/PitchHero";
import { ShiftSection } from "@/components/pitch/ShiftSection";
import { CapabilitiesGrid } from "@/components/pitch/CapabilitiesGrid";
import { ResultsSection } from "@/components/pitch/ResultsSection";
import { ProcessSection } from "@/components/pitch/ProcessSection";
import { TechStackSection } from "@/components/pitch/TechStackSection";
import { ClosingCTA } from "@/components/pitch/ClosingCTA";
import { SpotlightCursor } from "@/components/effects/SpotlightCursor";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { BookingConfetti } from "@/components/effects/BookingConfetti";

export const metadata: Metadata = {
  title: "AI решенията на бъдещето — ProMarketing LTD",
  description:
    "Изграждаме AI агенти, custom CRM системи и автоматизации, които работят 24/7 и превръщат рутината в растеж. Виж пълния спектър от това, което правим за теб.",
  openGraph: {
    title: "AI решенията на бъдещето — ProMarketing LTD",
    description:
      "AI агенти, custom CRM, автоматизации. Виж пълния спектър от това, което правим.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return (
    <>
      <SpotlightCursor />
      <ScrollProgress />
      <BookingConfetti />
      <main className="overflow-hidden">
        <PitchHero />
        <ShiftSection />
        <CapabilitiesGrid />
        <ResultsSection />
        <ProcessSection />
        <TechStackSection />
        <ClosingCTA />
      </main>
    </>
  );
}
