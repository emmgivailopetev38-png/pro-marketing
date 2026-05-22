import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Services } from "@/components/landing/Services";
import { Process } from "@/components/landing/Process";
import { Industries } from "@/components/landing/Industries";
import { WhyUs } from "@/components/landing/WhyUs";
import { FAQ } from "@/components/landing/FAQ";
import { QuickLeadForm } from "@/components/landing/QuickLeadForm";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { SpotlightCursor } from "@/components/effects/SpotlightCursor";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { BookingConfetti } from "@/components/effects/BookingConfetti";
import { Toaster } from "@/components/ui/sonner";

export default function HomePage() {
  return (
    <>
      <SpotlightCursor />
      <ScrollProgress />
      <BookingConfetti />
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Services />
        <Process />
        <Industries />
        <WhyUs />
        <FAQ />
        <QuickLeadForm />
        <FinalCTA />
      </main>
      <Footer />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}
