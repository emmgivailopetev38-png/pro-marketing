import type { Metadata } from "next";
import { WebinarLanding } from "@/components/webinar/WebinarLanding";
import { WEBINAR, webinarDateLabel } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: `${WEBINAR.title} — безплатно онлайн обучение | ProMarketing`,
  description: `${WEBINAR.subtitle} ${webinarDateLabel() ? `На живо: ${webinarDateLabel()}.` : "Запиши се за ранен достъп — датата се обявява скоро."} Безплатен AI Стартов Пакет за всеки записан.`,
  openGraph: {
    title: `${WEBINAR.title} — безплатно онлайн обучение`,
    description: WEBINAR.subtitle,
    locale: "bg_BG",
    type: "website",
  },
};

export default function WebinarPage() {
  return <WebinarLanding />;
}
