import { SuvetnikApp } from "@/components/admin/suvetnik/SuvetnikApp";

export const dynamic = "force-dynamic";

export const metadata = { title: "Съветникът на живо", robots: { index: false, follow: false } };

export default function SuvetnikPage() {
  return <SuvetnikApp />;
}
