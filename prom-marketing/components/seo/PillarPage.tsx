import Link from "next/link";
import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { ORG } from "@/lib/seo/site";

/* =====================================================================
   PillarPage — общият скелет на страниците, писани за търсене.

   Три решения в него са чисто SEO, не дизайн:

   1. **Кратък отговор** веднага под H1. Google взима откъс за featured
      snippet и за AI Overviews почти винаги от първите 40-60 думи след
      заглавието, когато те отговарят пряко на въпроса. Затова тук стои
      готов отговор, а не въведение.

   2. **FAQ през <details>, не през JavaScript акордеон.** Съдържанието
      излиза в първоначалния HTML. Роботите, които не пускат скриптове —
      а това са почти всички AI търсачки — виждат целите отговори.

   3. **Трохи и вътрешни връзки във всяка страница.** Стълбовете се сочат
      помежду си; така авторитетът тече из целия клъстер, вместо да
      застива в началната страница.
   ===================================================================== */

export type PillarSection = {
  h2: string;
  lead?: string;
  paragraphs?: string[];
  bullets?: { title: string; text: string }[];
  steps?: { name: string; text: string }[];
};

export type PillarPageProps = {
  breadcrumb: string;
  eyebrow: string;
  h1: React.ReactNode;
  /** Прекият отговор — 40-60 думи, пише се да може да бъде цитиран сам. */
  answer: string;
  intro: string;
  sections: PillarSection[];
  faq: { q: string; a: string }[];
  related: { href: string; title: string; text: string }[];
  ctaTitle: string;
  ctaText: string;
};

export function PillarPage({
  breadcrumb,
  eyebrow,
  h1,
  answer,
  intro,
  sections,
  faq,
  related,
  ctaTitle,
  ctaText,
}: PillarPageProps) {
  return (
    <div data-v2 className="v2-scope">
      <NavbarV2 />

      <main data-v2 id="top">
        {/* ── Заглавие ─────────────────────────────────────────────── */}
        <section className="v2-section relative overflow-hidden pt-32">
          <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
          <div className="v2-wrap">
            <nav aria-label="Трохи" className="v2-mono mb-6 text-[12px]">
              <Link href="/" className="text-[var(--v2-muted)] hover:text-[var(--v2-cyan)]">
                Начало
              </Link>
              <span className="mx-2 text-[var(--v2-faint)]">/</span>
              <span className="text-[var(--v2-cyan)]">{breadcrumb}</span>
            </nav>

            <span className="v2-eyebrow">{eyebrow}</span>

            <h1
              className="v2-title-plain mt-4 max-w-4xl text-[clamp(30px,5vw,56px)] leading-[1.08]"
              lang="bg"
            >
              {h1}
            </h1>

            {/* Прекият отговор. Стои сам, за да може да се цитира сам. */}
            <div className="v2-card mt-8 max-w-3xl p-6 md:p-7">
              <p className="v2-mono mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--v2-cyan)]">
                Накратко
              </p>
              <p className="text-[17px] leading-[1.65] text-[var(--v2-ink)] md:text-[18px]">
                {answer}
              </p>
            </div>

            <p className="mt-7 max-w-3xl text-[16px] leading-[1.75] text-[var(--v2-muted)] md:text-[17px]">
              {intro}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/booking" className="v2-btn v2-btn-primary">
                Запази безплатна консултация
              </Link>
              <a href={`tel:${ORG.phone}`} className="v2-btn">
                Обади се · {ORG.phoneDisplay}
              </a>
            </div>
          </div>
        </section>

        <div className="v2-divider" />

        {/* ── Съдържание ───────────────────────────────────────────── */}
        {sections.map((s) => (
          <section key={s.h2} className="v2-section relative">
            <div className="v2-wrap max-w-4xl">
              <h2 className="v2-title-plain text-[clamp(24px,3.6vw,38px)] leading-[1.15]">
                {s.h2}
              </h2>

              {s.lead ? (
                <p className="mt-5 text-[17px] leading-[1.7] text-[var(--v2-ink)]">{s.lead}</p>
              ) : null}

              {s.paragraphs?.map((p) => (
                <p key={p.slice(0, 40)} className="mt-5 text-[16px] leading-[1.8] text-[var(--v2-muted)]">
                  {p}
                </p>
              ))}

              {s.bullets?.length ? (
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {s.bullets.map((b) => (
                    <li key={b.title} className="v2-card p-5">
                      <h3 className="text-[16px] font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
                        {b.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-[1.65] text-[var(--v2-muted)]">{b.text}</p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {s.steps?.length ? (
                <ol className="mt-8 space-y-4">
                  {s.steps.map((st, i) => (
                    <li key={st.name} className="v2-card flex gap-5 p-5">
                      <span
                        className="v2-mono mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                        style={{ background: "var(--v2-grad-accent)", color: "var(--v2-void)" }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-[16px] font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
                          {st.name}
                        </h3>
                        <p className="mt-1.5 text-[15px] leading-[1.65] text-[var(--v2-muted)]">
                          {st.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </section>
        ))}

        <div className="v2-divider" />

        {/* ── Въпроси ──────────────────────────────────────────────── */}
        <section className="v2-section relative" id="vaprosi">
          <div className="v2-wrap max-w-4xl">
            <span className="v2-eyebrow">ЧЕСТИ ВЪПРОСИ</span>
            <h2 className="v2-title-plain mt-4 text-[clamp(24px,3.6vw,38px)]">
              Това, което питат преди да започнем
            </h2>

            <div className="mt-8 space-y-3">
              {faq.map((item) => (
                <details key={item.q} className="v2-card group p-5 md:p-6">
                  <summary className="cursor-pointer list-none text-[16px] font-semibold text-[var(--v2-ink)] marker:hidden md:text-[17px]">
                    <span className="mr-3 text-[var(--v2-cyan)] transition-transform group-open:rotate-90 inline-block">
                      ›
                    </span>
                    {item.q}
                  </summary>
                  <p className="mt-4 pl-6 text-[15px] leading-[1.75] text-[var(--v2-muted)] md:text-[16px]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="v2-divider" />

        {/* ── Свързани услуги — вътрешните връзки, които местят авторитет ── */}
        <section className="v2-section relative">
          <div className="v2-wrap">
            <span className="v2-eyebrow">СВЪРЗАНО</span>
            <h2 className="v2-title-plain mt-4 text-[clamp(22px,3.2vw,32px)]">
              Останалото от системата
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.href} href={r.href} className="v2-card block p-5 transition hover:border-[var(--v2-cyan)]">
                  <h3 className="text-[16px] font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
                    {r.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-[var(--v2-muted)]">{r.text}</p>
                  <span className="v2-mono mt-4 inline-block text-[12px] text-[var(--v2-cyan)]">Виж →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Призив ───────────────────────────────────────────────── */}
        <section className="v2-section relative overflow-hidden">
          <div aria-hidden className="v2-aurora pointer-events-none absolute inset-0" />
          <div className="v2-wrap relative max-w-3xl text-center">
            <h2 className="v2-title-plain text-[clamp(26px,4vw,42px)] leading-[1.12]">{ctaTitle}</h2>
            <p className="mt-5 text-[16px] leading-[1.75] text-[var(--v2-muted)] md:text-[17px]">{ctaText}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/booking" className="v2-btn v2-btn-primary">
                Запази безплатна консултация
              </Link>
              <Link href="/demo" className="v2-btn">
                Виж живото демо
              </Link>
            </div>
            <p className="v2-mono mt-6 text-[12px] text-[var(--v2-faint)]">
              {ORG.city}, България · отговор в рамките на деня
            </p>
          </div>
        </section>
      </main>

      <FooterV2 />
    </div>
  );
}
