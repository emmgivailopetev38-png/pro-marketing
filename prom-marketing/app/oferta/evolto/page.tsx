import { EvoltoHero } from "@/components/oferta/evolto/EvoltoHero";
import { EvoltoModules } from "@/components/oferta/evolto/EvoltoModules";

export default function EvoltoOfertaPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      <EvoltoHero />
      <EvoltoModules />
      {/* Preview only — 6 more sections coming once user approves the visual direction */}
      <div className="relative py-24 text-center" style={{ background: "var(--color-bg-void)" }}>
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-text-tertiary)]">
          PREVIEW — следва: Sales flow timeline · Dashboard mockup · Content engine · Чат бот demo · Digital offer · CTA
        </p>
      </div>
    </main>
  );
}
