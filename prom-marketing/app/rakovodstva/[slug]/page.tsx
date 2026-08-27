import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/v2/v2-design.css";
import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, graph, webPageSchema } from "@/lib/seo/schema";
import { GUIDES, getGuide, relatedFor, type Guide, type GuideBlock } from "@/lib/seo/guides";
import { ORG, SITE_URL, abs } from "@/lib/seo/site";

/* =====================================================================
   Едно ръководство.

   Три неща тук са SEO решения, не дизайн:

   1. **Съдържание с връзки към разделите.** Google взима оттам „скоковете"
      в резултата (jump links) и показва подзаглавията директно в списъка.
      Всеки H2 има свой якор.

   2. **Article + автор + дати.** Ръководство без автор и дата е анонимен
      текст. Google оценява точно обратното — кой го е писал и кога е
      обновен. Затова датите са видими И в маркирането.

   3. **Целият текст е в HTML, без нито един клиентски компонент.**
      Ръководствата са това, което AI търсачките четат и цитират, а те
      почти никога не изпълняват JavaScript.
   ===================================================================== */

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  const path = `/rakovodstva/${g.slug}`;
  return {
    title: { absolute: g.metaTitle },
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: abs(path) },
    openGraph: {
      type: "article",
      locale: "bg_BG",
      url: abs(path),
      title: g.metaTitle,
      description: g.description,
      publishedTime: g.published,
      modifiedTime: g.updated,
      authors: [ORG.founder.name],
    },
  };
}

function Block({ b }: { b: GuideBlock }) {
  switch (b.type) {
    case "p":
      return <p className="mt-5 text-[16px] leading-[1.8] text-[var(--v2-muted)]">{b.text}</p>;
    case "h3":
      return (
        <h3
          className="mt-8 text-[19px] font-bold text-[var(--v2-ink)]"
          style={{ fontFamily: "var(--v2-font-display)" }}
        >
          {b.text}
        </h3>
      );
    case "ul":
      return (
        <ul className="mt-5 space-y-3">
          {b.items.map((it) => (
            <li key={it} className="flex gap-3 text-[16px] leading-[1.75] text-[var(--v2-muted)]">
              <span aria-hidden className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--v2-cyan)]" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-5 space-y-3">
          {b.items.map((it, i) => (
            <li key={it} className="flex gap-4 text-[16px] leading-[1.75] text-[var(--v2-muted)]">
              <span
                className="v2-mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: "var(--v2-grad-accent)", color: "var(--v2-void)" }}
              >
                {i + 1}
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="v2-card mt-7 border-l-2 border-l-[var(--v2-cyan)] p-5 text-[17px] leading-[1.7] text-[var(--v2-ink)]">
          {b.text}
        </blockquote>
      );
    case "table":
      return (
        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-[var(--v2-line-bright)]">
                {b.head.map((h) => (
                  <th key={h} className="py-3 pr-5 font-semibold text-[var(--v2-ink)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.join("|")} className="border-b border-[var(--v2-line)]">
                  {r.map((c) => (
                    <td key={c} className="py-3 pr-5 align-top leading-[1.6] text-[var(--v2-muted)]">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function articleSchema(g: Guide) {
  const url = abs(`/rakovodstva/${g.slug}`);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: g.metaTitle,
    description: g.description,
    inLanguage: "bg-BG",
    datePublished: g.published,
    dateModified: g.updated,
    author: { "@id": `${SITE_URL}/#ivailo-petev` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    articleSection: g.sections.map((s) => s.h2),
    keywords: g.keywords.join(", "),
    wordCount: g.sections
      .flatMap((s) => s.blocks)
      .reduce((n, b) => {
        const text =
          b.type === "table"
            ? [...b.head, ...b.rows.flat()].join(" ")
            : b.type === "ul" || b.type === "ol"
              ? b.items.join(" ")
              : b.text;
        return n + text.split(/\s+/).length;
      }, 0),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const path = `/rakovodstva/${g.slug}`;

  // Двете ръководства за самостоятелната работа водят към менторството,
  // а не към услугата — там читателят вече е казал, че иска да строи сам.
  const MENTOR_SLUGS = ["chatgpt-sam-ili-agencia", "ai-agencia-balgaria-izbor"];
  const wantsMentor = MENTOR_SLUGS.includes(g.slug);

  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path,
            name: g.metaTitle,
            description: g.description,
            breadcrumbs: [
              { name: "Ръководства", path: "/rakovodstva" },
              { name: g.title, path },
            ],
          }),
          articleSchema(g),
          faqSchema(path, g.faq),
        )}
      />

      <div data-v2 className="v2-scope">
        <NavbarV2 />

        <main data-v2 id="top">
          <article className="v2-section relative overflow-hidden pt-32">
            <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
            <div className="v2-wrap max-w-3xl">
              <nav aria-label="Трохи" className="v2-mono mb-6 text-[12px]">
                <Link href="/" className="text-[var(--v2-muted)] hover:text-[var(--v2-cyan)]">
                  Начало
                </Link>
                <span className="mx-2 text-[var(--v2-faint)]">/</span>
                <Link href="/rakovodstva" className="text-[var(--v2-muted)] hover:text-[var(--v2-cyan)]">
                  Ръководства
                </Link>
              </nav>

              <h1 className="v2-title-plain text-[clamp(28px,4.6vw,48px)] leading-[1.12]" lang="bg">
                {g.title}
              </h1>

              {/* Автор и дати — видими, защото Google ги търси точно тук. */}
              <p className="v2-mono mt-5 text-[12px] text-[var(--v2-faint)]">
                {ORG.founder.name} · обновено{" "}
                <time dateTime={g.updated}>
                  {new Date(g.updated).toLocaleDateString("bg-BG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>{" "}
                · {g.readMinutes} мин. четене
              </p>

              <div className="v2-card mt-8 p-6 md:p-7">
                <p className="v2-mono mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--v2-cyan)]">
                  Накратко
                </p>
                <p className="text-[17px] leading-[1.65] text-[var(--v2-ink)]">{g.answer}</p>
              </div>

              {/* Съдържание — дава на Google „скокове" към разделите. */}
              <nav aria-label="Съдържание" className="mt-8">
                <p className="v2-mono mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
                  В това ръководство
                </p>
                <ol className="space-y-2">
                  {g.sections.map((s, i) => (
                    <li key={s.id} className="text-[15px]">
                      <a
                        href={`#${s.id}`}
                        className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-cyan)]"
                      >
                        <span className="v2-mono mr-3 text-[var(--v2-cyan)]">{i + 1}.</span>
                        {s.h2}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              {g.sections.map((s) => (
                <section key={s.id} id={s.id} className="mt-14 scroll-mt-28">
                  <h2 className="v2-title-plain text-[clamp(22px,3.2vw,32px)] leading-[1.2]">
                    {s.h2}
                  </h2>
                  {s.blocks.map((b, i) => (
                    <Block key={i} b={b} />
                  ))}
                </section>
              ))}

              <section id="vaprosi" className="mt-16 scroll-mt-28">
                <h2 className="v2-title-plain text-[clamp(22px,3.2vw,32px)]">Често задавани въпроси</h2>
                <div className="mt-7 space-y-3">
                  {g.faq.map((item) => (
                    <details key={item.q} className="v2-card group p-5">
                      <summary className="cursor-pointer list-none text-[16px] font-semibold text-[var(--v2-ink)]">
                        <span className="mr-3 inline-block text-[var(--v2-cyan)] transition-transform group-open:rotate-90">
                          ›
                        </span>
                        {item.q}
                      </summary>
                      <p className="mt-4 pl-6 text-[15px] leading-[1.75] text-[var(--v2-muted)]">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>

              {relatedFor(g.slug).length ? (
                <section className="mt-16">
                  <h2 className="v2-title-plain text-[clamp(20px,2.8vw,26px)]">Продължава в</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {relatedFor(g.slug).map((r) => {
                      const slug2 = r.slug;
                      return (
                        <Link
                          key={slug2}
                          href={`/rakovodstva/${slug2}`}
                          className="v2-card block p-5 transition hover:border-[var(--v2-cyan)]"
                        >
                          <h3
                            className="text-[16px] font-bold leading-snug text-[var(--v2-ink)]"
                            style={{ fontFamily: "var(--v2-font-display)" }}
                          >
                            {r.title}
                          </h3>
                          <span className="v2-mono mt-3 inline-block text-[12px] text-[var(--v2-cyan)]">
                            {r.readMinutes} мин. →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <section className="v2-card mt-16 p-7 text-center">
                <h2 className="v2-title-plain text-[clamp(20px,2.8vw,28px)]">
                  Да го приложим при теб
                </h2>
                <p className="mt-4 text-[16px] leading-[1.7] text-[var(--v2-muted)]">
                  Половин час разговор стига, за да излезе кой процес да тръгне пръв и колко часа
                  връща. Списъкът остава при теб независимо какво решиш.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <Link href="/booking" className="v2-btn v2-btn-primary">
                    Запази безплатна консултация
                  </Link>
                  <Link href={wantsMentor ? "/mentor" : "/automation-audit"} className="v2-btn">
                    {wantsMentor ? "Виж менторството" : "Безплатен одит на процесите"}
                  </Link>
                </div>
              </section>
            </div>
          </article>
        </main>

        <FooterV2 />
      </div>
    </>
  );
}
