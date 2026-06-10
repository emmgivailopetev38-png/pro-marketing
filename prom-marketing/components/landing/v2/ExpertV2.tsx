/* =====================================================================
   ExpertV2 — "2050" redesign of components/landing/Expert.tsx.
   ALL content preserved 1:1: the four CREDENTIALS stats, the five
   EXPERTISE bullets, the three bio paragraphs, the founder photo +
   name tag, and every contact link (booking, mailto, tel, location)
   with its lucide icon. Only the skin changes — "Luminescent Depth":
   depth-glass surfaces, a holographic section title, a rotating neon
   conic edge on the photo frame, Sora/JetBrains type via v2 tokens, and
   a NeuralCore breathing behind the founder portrait as the signature
   centerpiece.
   No "лв/лева" in the source → no currency conversion needed.
   The original is a pure server component (no hooks/state) → this stays
   a server component too; entrance handled by SectionReveal, exactly
   like WhyUsV2 / IndustriesV2.
   ===================================================================== */
import Image from "next/image";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";
import { Calendar, Mail, Phone, MapPin } from "lucide-react";

const CREDENTIALS = [
  { label: "Години в AI и маркетинг", value: "7+" },
  { label: "Проекти на терен", value: "30+" },
  { label: "Доволни клиенти", value: "20+" },
  { label: "Държави с клиенти", value: "5" },
];

const EXPERTISE = [
  "AI агенти и автоматизация (n8n, Make, OpenAI, Claude)",
  "CRM системи и проектиране на лидов процес",
  "Реклами в Meta и Google · маркетинг с измерими резултати",
  "Изграждане на табла по поръчка и операционни системи",
  "Менторство · учиш се сам да правиш AI системи",
];

export function ExpertV2() {
  return (
    <section className="v2-section overflow-hidden">
      {/* Signature depth glow backdrop (mirrors the original violet wash) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, var(--v2-glow-violet) 0%, transparent 55%)",
          opacity: 0.16,
        }}
      />

      <div className="v2-wrap">
        <SectionReveal>
          <div className="v2-head">
            <span className="v2-eyebrow">{"// зад фирмата"}</span>
            <h2
              className="v2-title"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Запознай се с експерта.
            </h2>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          {/* PHOTO */}
          <SectionReveal className="md:col-span-5">
            <div className="relative">
              {/* NeuralCore — signature centerpiece, breathing behind the frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 -z-[1] opacity-70"
              >
                <NeuralCore nodeCount={170} radius={1.25} spin={0.8} />
              </div>

              {/* Photo container — depth glass + rotating neon conic edge (violet) */}
              <div
                className="v2-glass v2-glow is-always relative overflow-hidden"
                style={{ ["--v2-c" as never]: "var(--v2-violet)" }}
              >
                <Image
                  src="/images/ivailo/IMG_7318.jpeg"
                  alt="Ивайло Петев · основател и AI експерт на ProMarketing"
                  width={960}
                  height={1200}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="block h-full w-full object-cover"
                  style={{ aspectRatio: "4/5" }}
                />
                {/* Subtle overlay for tone */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 60%, rgba(4, 6, 13, 0.7) 100%)",
                  }}
                />
                {/* Name tag */}
                <div className="absolute bottom-5 left-5 right-5 z-[1]">
                  <p className="v2-mono text-[10px] uppercase tracking-[0.3em] text-[var(--v2-cyan)]">
                    Основател · AI Експерт
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold text-white"
                    style={{ fontFamily: "var(--v2-font-display)" }}
                  >
                    Ивайло Петев
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* CONTENT */}
          <div className="md:col-span-7">
            <SectionReveal delay={150}>
              <p className="text-lg leading-relaxed text-[var(--v2-muted)]">
                Аз съм{" "}
                <span
                  className="font-bold text-[var(--v2-ink)]"
                  style={{ fontFamily: "var(--v2-font-display)" }}
                >
                  Ивайло Петев
                </span>{" "}
                — основател на ProMarketing ЕООД. Изграждам AI системи и автоматизации за български бизнеси, които искат да правят повече с по-малко хора.
              </p>
              <p className="mt-5 text-base leading-relaxed text-[var(--v2-muted)]">
                Започнах в маркетинга, преминах през платени реклами, имейл кампании и CRM системи. Когато AI разби играта през 2023-2024, бях един от първите, които започнаха да правят реални AI агенти за бизнеси — не „чат-бот на сайта", а истински системи, които заместват хората в рутината.
              </p>
              <p className="mt-5 text-base leading-relaxed text-[var(--v2-muted)]">
                Работя лично с всеки клиент. Без излишни прослойки, без посредници — ти говориш директно с човека, който изгражда системата ти.
              </p>
            </SectionReveal>

            {/* Credentials stats */}
            <SectionReveal delay={250}>
              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {CREDENTIALS.map((c) => (
                  <div key={c.label} className="v2-card !p-4">
                    <p
                      className="text-3xl font-bold text-[var(--v2-cyan)]"
                      style={{ fontFamily: "var(--v2-font-display)" }}
                    >
                      {c.value}
                    </p>
                    <p className="v2-mono mt-1 text-[10px] uppercase tracking-wider text-[var(--v2-faint)]">
                      {c.label}
                    </p>
                  </div>
                ))}
              </div>
            </SectionReveal>

            {/* Expertise list */}
            <SectionReveal delay={350}>
              <div className="mt-10">
                <p className="v2-eyebrow mb-4">{"// експертиза"}</p>
                <ul className="space-y-2.5">
                  {EXPERTISE.map((e) => (
                    <li
                      key={e}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[var(--v2-muted)]"
                    >
                      <span
                        aria-hidden
                        className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--v2-cyan)]"
                        style={{ boxShadow: "0 0 8px var(--v2-cyan)" }}
                      />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>

            {/* Contact + CTA */}
            <SectionReveal delay={450}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <a href="/booking" className="v2-btn v2-btn-primary">
                  <Calendar className="h-4 w-4" />
                  Запази 30-мин разговор
                </a>
                <a
                  href="mailto:ivailopetev38@gmail.com"
                  className="inline-flex items-center gap-2 text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-cyan)]"
                >
                  <Mail className="h-4 w-4" />
                  ivailopetev38@gmail.com
                </a>
                <a
                  href="tel:+359877399963"
                  className="inline-flex items-center gap-2 text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-cyan)]"
                >
                  <Phone className="h-4 w-4" />
                  +359 877 399 963
                </a>
                <span className="inline-flex items-center gap-2 text-[var(--v2-faint)]">
                  <MapPin className="h-4 w-4" />
                  Пловдив, България
                </span>
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
