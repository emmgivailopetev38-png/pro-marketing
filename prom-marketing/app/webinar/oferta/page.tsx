import type { Metadata } from "next";
import { WebinarOffer } from "@/components/webinar/WebinarOffer";

export const metadata: Metadata = {
  title: "Уебинар офертата — избери своето ниво | ProMarketing",
  description:
    "Специалните цени за участници в обучението: курсът на уебинар цена и пълното ниво (курс + менторство 1-на-1) с −30%. Валидни 48 часа.",
  robots: { index: false },
};

export default function WebinarOfertaPage() {
  return <WebinarOffer />;
}
