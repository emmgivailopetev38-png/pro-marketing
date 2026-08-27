import { PartneriHero } from "@/components/partneri/PartneriHero";
import { PartneriServices } from "@/components/partneri/PartneriServices";
import { PartneriProcess } from "@/components/partneri/PartneriProcess";
import { PartneriClosing } from "@/components/partneri/PartneriClosing";
import { SeoLinkStrip } from "@/components/seo/SeoLinkStrip";

export default function PartneriPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      <PartneriHero />
      <PartneriServices />
      <PartneriProcess />
      <PartneriClosing />
      {/* Страницата е нарочно без меню и футър; лентата ѝ дава изход,
          за да не е задънена улица за търсачките. */}
      <SeoLinkStrip />
    </main>
  );
}
