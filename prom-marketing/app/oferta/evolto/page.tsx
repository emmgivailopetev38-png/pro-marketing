import { EvoltoHero } from "@/components/oferta/evolto/EvoltoHero";
import { EvoltoModules } from "@/components/oferta/evolto/EvoltoModules";
import { EvoltoSalesFlow } from "@/components/oferta/evolto/EvoltoSalesFlow";
import { EvoltoDashboard } from "@/components/oferta/evolto/EvoltoDashboard";
import { EvoltoContentEngine } from "@/components/oferta/evolto/EvoltoContentEngine";
import { EvoltoChatBot } from "@/components/oferta/evolto/EvoltoChatBot";
import { EvoltoDigitalOffer } from "@/components/oferta/evolto/EvoltoDigitalOffer";
import { EvoltoClosing } from "@/components/oferta/evolto/EvoltoClosing";

export default function EvoltoOfertaPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      <EvoltoHero />
      <EvoltoModules />
      <EvoltoSalesFlow />
      <EvoltoDashboard />
      <EvoltoContentEngine />
      <EvoltoChatBot />
      <EvoltoDigitalOffer />
      <EvoltoClosing />
    </main>
  );
}
