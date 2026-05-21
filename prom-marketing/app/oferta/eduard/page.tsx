import { EduardHero } from "@/components/oferta/eduard/EduardHero";
import { EduardPackages } from "@/components/oferta/eduard/EduardPackages";
import { EduardTimeline } from "@/components/oferta/eduard/EduardTimeline";
import { EduardWhy } from "@/components/oferta/eduard/EduardWhy";
import { EduardClosing } from "@/components/oferta/eduard/EduardClosing";

export default function EduardOfertaPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      <EduardHero />
      <EduardPackages />
      <EduardTimeline />
      <EduardWhy />
      <EduardClosing />
    </main>
  );
}
