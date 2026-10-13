/* =====================================================================
   SocialFollowV2 — „Последвай ме в мрежите" на началната страница.

   Стои веднага след формата за контакт (QuickLeadFormV2) и преди
   долния колонтитул: който не е оставил телефон, може поне да ни
   последва. Четири големи плочки — YouTube, Instagram, TikTok,
   Facebook — всяка е цяла връзка, голяма колкото да се натисне с палец.

   Изграден само от езика "Luminescent Depth" (app/v2/v2-design.css):
   .v2-eyebrow / .v2-title-plain / .v2-sub / .v2-card, без нов CSS.
   Профилите, иконите и цветовете идват от един източник —
   SOCIAL_PROFILES (lib/seo/site.ts) + BRANDS (components/brands.tsx) —
   същият списък, който храни `sameAs` и иконите във футъра.

   Сървърен компонент: само връзки, нула JavaScript; входната анимация
   е в SectionReveal, като във всяка друга секция.
   ===================================================================== */
import { ArrowUpRight } from "lucide-react";
import { BRANDS } from "@/components/brands";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { SOCIAL_PROFILES } from "@/lib/seo/site";

export function SocialFollowV2() {
  return (
    <section
      id="sledvai"
      aria-labelledby="sledvai-title"
      className="v2-section scroll-mt-20"
      style={{ paddingTop: "clamp(8px, 2vw, 24px)", paddingBottom: "clamp(48px, 7vw, 96px)" }}
    >
      <div className="v2-wrap">
        <SectionReveal>
          <div className="v2-head is-center" style={{ marginBottom: "clamp(28px, 4vw, 44px)" }}>
            <span className="v2-eyebrow">{"// в мрежите"}</span>
            <h2
              id="sledvai-title"
              className="v2-title-plain"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Последвай ме <span className="v2-grad">в&nbsp;мрежите.</span>
            </h2>
            <p className="v2-sub text-balance">
              Видеа за AI, автоматизации и маркетинг. Избери мрежата, която ползваш.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={120}>
          <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {SOCIAL_PROFILES.map((p) => {
              const { Icon, color } = BRANDS[p.key];
              return (
                <li key={p.key}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.label} — Ивайло Петев`}
                    className="v2-card group flex h-full min-h-[132px] flex-col items-center justify-center gap-3 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--v2-cyan)]"
                    style={{ ["--social-c" as string]: color, padding: "clamp(18px, 2.4vw, 26px) 12px" }}
                  >
                    <ArrowUpRight
                      aria-hidden
                      className="absolute right-3 top-3 h-4 w-4 text-[var(--v2-faint)] transition-colors group-hover:text-[var(--v2-cyan)]"
                    />
                    <span
                      className="grid h-14 w-14 place-items-center rounded-full"
                      style={{
                        color: "var(--social-c)",
                        background: "color-mix(in srgb, var(--social-c) 14%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--social-c) 38%, transparent)",
                      }}
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="block min-w-0">
                      <span
                        className="block text-base font-bold text-[var(--v2-ink)]"
                        style={{ fontFamily: "var(--v2-font-display)" }}
                      >
                        {p.label}
                      </span>
                      <span className="v2-mono mt-1 block text-[11px] text-[var(--v2-muted)]">
                        {p.handle}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </SectionReveal>
      </div>
    </section>
  );
}
