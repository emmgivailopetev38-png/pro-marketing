import type { Metadata } from "next";
import { WebinarDeck } from "@/components/webinar/WebinarDeck";
import { WEBINAR } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: `Презентация — ${WEBINAR.title} | ProMarketing`,
  description: "Вътрешна презентация за уебинара. Не е публична страница.",
  robots: { index: false, follow: false },
};

/**
 * /webinar/prezentacia — слайдовете за самия Zoom уебинар (screen share).
 * Не е линкната отникъде публично; noindex. Управление: стрелки / N / F.
 */
export default function WebinarPrezentaciaPage() {
  return <WebinarDeck />;
}
