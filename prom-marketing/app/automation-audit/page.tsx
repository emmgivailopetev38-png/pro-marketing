import type { Metadata } from "next";
import { AuditLanding } from "@/components/audit/AuditLanding";

export const metadata: Metadata = {
  title: "Безплатен AI одит на автоматизациите | ProMarketing",
  description:
    "Оставяш телефон — получаваш 30-минутен безплатен одит: кои процеси в бизнеса ти губят пари и кои се автоматизират първи. Без ангажимент.",
  openGraph: {
    title: "Безплатен AI одит — кои процеси ти губят пари?",
    description: "30 минути, конкретен план, нула ангажимент. Остави телефон и ние звъним.",
    locale: "bg_BG",
    type: "website",
  },
};

export default function AutomationAuditPage() {
  return <AuditLanding />;
}
