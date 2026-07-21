import Image from "next/image";
import { SectionReveal } from "@/components/effects/SectionReveal";
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

export function Expert() {
  return (
    <section className="relative py-32">
      {/* Subtle violet glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// зад фирмата"}
            </p>
            <h2
              className="font-display text-[clamp(28px,5vw,52px)] font-semibold leading-[1.08] tracking-tight"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Запознай се с <span className="text-[var(--color-accent-cyan)]">експерта</span>.
            </h2>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          {/* PHOTO */}
          <SectionReveal className="md:col-span-5">
            <div className="relative">
              {/* Frame glow */}
              <div
                aria-hidden
                className="absolute -inset-3 rounded-2xl opacity-60 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(139, 92, 246, 0.20))",
                }}
              />
              {/* Photo container */}
              <div
                className="relative overflow-hidden rounded-2xl border"
                style={{
                  borderColor: "rgba(6, 182, 212, 0.20)",
                  background: "rgba(10, 10, 31, 0.40)",
                }}
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
                      "linear-gradient(180deg, transparent 65%, rgba(3, 3, 8, 0.45) 100%)",
                  }}
                />
                {/* Name tag */}
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
                    Основател · AI Експерт
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-white">
                    Ивайло Петев
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* CONTENT */}
          <div className="md:col-span-7">
            <SectionReveal delay={150}>
              <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
                Аз съм{" "}
                <span className="font-display font-bold text-[var(--color-text-primary)]">
                  Ивайло Петев
                </span>{" "}
                — основател на ProMarketing ЕООД. Изграждам AI системи и автоматизации за български бизнеси, които искат да правят повече с по-малко хора.
              </p>
              <p className="mt-5 text-base leading-relaxed text-[var(--color-text-secondary)]">
                Започнах в маркетинга, преминах през платени реклами, имейл кампании и CRM системи. Когато AI разби играта през 2023-2024, бях един от първите, които започнаха да правят реални AI агенти за бизнеси — не „чат-бот на сайта", а истински системи, които заместват хората в рутината.
              </p>
              <p className="mt-5 text-base leading-relaxed text-[var(--color-text-secondary)]">
                Работя лично с всеки клиент. Без излишни прослойки, без посредници — ти говориш директно с човека, който изгражда системата ти.
              </p>
            </SectionReveal>

            {/* Credentials stats */}
            <SectionReveal delay={250}>
              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {CREDENTIALS.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: "rgba(6, 182, 212, 0.15)",
                      background: "rgba(6, 182, 212, 0.04)",
                    }}
                  >
                    <p className="font-display text-3xl font-bold text-[var(--color-accent-cyan)]">
                      {c.value}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {c.label}
                    </p>
                  </div>
                ))}
              </div>
            </SectionReveal>

            {/* Expertise list */}
            <SectionReveal delay={350}>
              <div className="mt-10">
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
                  {"// експертиза"}
                </p>
                <ul className="space-y-2.5">
                  {EXPERTISE.map((e) => (
                    <li
                      key={e}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                    >
                      <span
                        aria-hidden
                        className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-accent-cyan)]"
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
                <a
                  href="/booking"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-colors"
                  style={{
                    background: "var(--color-accent-cyan)",
                    color: "var(--color-bg-void)",
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  Запази 30-мин разговор
                </a>
                <a
                  href="mailto:emmgivailopetev38@gmail.com"
                  className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent-cyan)]"
                >
                  <Mail className="h-4 w-4" />
                  emmgivailopetev38@gmail.com
                </a>
                <a
                  href="tel:+359877399963"
                  className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent-cyan)]"
                >
                  <Phone className="h-4 w-4" />
                  +359 877 399 963
                </a>
                <span className="inline-flex items-center gap-2 text-[var(--color-text-tertiary)]">
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
