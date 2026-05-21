import { PartneriHero } from "@/components/partneri/PartneriHero";
import { PartneriServices } from "@/components/partneri/PartneriServices";
import { PartneriProcess } from "@/components/partneri/PartneriProcess";
import { PartneriClosing } from "@/components/partneri/PartneriClosing";

export default function PartneriPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      <PartneriHero />
      <PartneriServices />
      <PartneriProcess />
      <PartneriClosing />
    </main>
  );
}
