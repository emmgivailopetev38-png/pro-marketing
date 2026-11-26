import { TabloStefcho } from "@/components/admin/TabloStefcho";
import { PERIODI, zarediTablo, type Period } from "@/lib/tablo/danni";
import type { Nivo } from "@/lib/tablo/metriki";

export const dynamic = "force-dynamic";

/**
 * /admin/tablo — рекламите и метриките от CRM-а на Стефчо, на нашите данни
 * (Ивайло, 26.11.2026: „добави го в моя CRM първо само за мен… рекламите и
 * метриките автоматично се попълват в това табло“). /admin е само за Ивайло.
 */
export default async function TabloPage({ searchParams }: { searchParams: Promise<{ p?: string; nivo?: string }> }) {
  const sp = await searchParams;
  const period: Period = PERIODI.find((x) => x.kluch === sp.p)?.kluch ?? "vsichko";
  const nivo: Nivo = sp.nivo === "campaign" || sp.nivo === "adset" ? sp.nivo : "ad";
  const t = await zarediTablo(period);
  return <TabloStefcho t={t} nivo={nivo} />;
}
