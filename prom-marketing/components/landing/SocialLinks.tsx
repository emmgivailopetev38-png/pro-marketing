import { Sparkles } from "lucide-react";
import { BRANDS } from "@/components/brands";
import { PETEVAI, SOCIAL_PROFILES } from "@/lib/seo/site";

/* =====================================================================
   SocialLinks — редът „Последвай ме" в долния колонтитул.

   Един компонент за двата футъра: FooterV2 (началната и повечето
   публични страници, токени `--v2-*`) и старият Footer (правните
   страници, токени `--color-*`). Профилите идват от SOCIAL_PROFILES в
   lib/seo/site.ts — същият списък храни и `sameAs` в структурираните
   данни, така че иконите и търсачките не могат да се разминат.

   До иконите стои и връзката към Petev.ai — отделен продукт, не социален
   профил (PETEVAI в lib/seo/site.ts, извън `sameAs`).

   Сървърен компонент: само връзки, нула JavaScript. Иконите са
   приглушени и добиват цвета на мрежата при посочване. Всяка е 44×44 —
   достатъчно за пръст.
   ===================================================================== */

type Skin = "v2" | "legacy";

const SKIN = {
  v2: {
    accent: "var(--v2-cyan)",
    label: "v2-mono text-xs uppercase tracking-[0.2em] text-[var(--v2-faint)]",
    chip:
      "border-[var(--v2-line)] bg-[var(--v2-glass-2)] text-[var(--v2-muted)] " +
      "hover:border-[color-mix(in_srgb,var(--social-c)_55%,transparent)] hover:text-[var(--social-c)] " +
      "focus-visible:outline-[color:var(--v2-cyan)]",
  },
  legacy: {
    accent: "var(--color-accent-cyan)",
    label: "font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]",
    chip:
      "border-[var(--color-border-default)] bg-[var(--color-bg-glass)] text-[var(--color-text-secondary)] " +
      "hover:border-[color-mix(in_srgb,var(--social-c)_55%,transparent)] hover:text-[var(--social-c)] " +
      "focus-visible:outline-[color:var(--color-accent-cyan)]",
  },
} as const;

export function SocialLinks({ skin = "v2" }: { skin?: Skin }) {
  const s = SKIN[skin];
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
    <nav
      aria-label="Социални мрежи — Ивайло Петев"
      className="flex flex-wrap items-center gap-x-5 gap-y-3"
    >
      <span className={s.label}>Последвай ме</span>
      <ul className="flex flex-wrap items-center gap-2.5">
        {SOCIAL_PROFILES.map((p) => {
          const { Icon, color } = BRANDS[p.brand];
          return (
            <li key={p.key}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.label} — Ивайло Петев`}
                title={p.label}
                style={{ ["--social-c" as string]: color }}
                className={`grid h-11 w-11 place-items-center rounded-full border transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${s.chip}`}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
    <a
      href={PETEVAI.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${PETEVAI.label} — ${PETEVAI.tagline}`}
      title={`${PETEVAI.label} — ${PETEVAI.tagline}`}
      style={{ ["--social-c" as string]: s.accent }}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${s.chip}`}
    >
      <Sparkles className="h-[16px] w-[16px]" aria-hidden />
      {PETEVAI.label}
    </a>
    </div>
  );
}
