import type { Metadata } from "next";
import Link from "next/link";
import "@/app/v2/v2-design.css";
import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { JsonLd } from "@/components/seo/JsonLd";
import { graph, webPageSchema } from "@/lib/seo/schema";
import { GUIDES } from "@/lib/seo/guides";
import { abs } from "@/lib/seo/site";

/* Хъбът на ръководствата.

   Стои между началната страница и отделните текстове и върши точно едно
   нещо за търсенето: събира авторитета от вътрешните връзки и го разлива
   към ръководствата. Без такъв хъб всяко ръководство виси само.

   ItemList маркирането отдолу подрежда текстовете за Google — той чете
   реда като приоритет. */

const PATH = "/rakovodstva";
const TITLE = "Ръководства за AI автоматизация на български";
const DESCRIPTION =
  "Практични ръководства за AI автоматизация, AI агенти и автоматизация на бизнес процеси — " +
  "с числа, срокове и честни граници. Писани за българския бизнес.";

export const metadata: Metadata = {
  // absolute: без него шаблонът лепи марката отгоре и заглавието
  // излиза над 60 знака, тоест Google го реже в ключовата дума.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: abs(PATH) },
  openGraph: { type: "website", locale: "bg_BG", url: abs(PATH), title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path: PATH,
            name: TITLE,
            description: DESCRIPTION,
            breadcrumbs: [{ name: "Ръководства", path: PATH }],
          }),
          {
            "@type": "ItemList",
            "@id": `${abs(PATH)}#list`,
            name: TITLE,
            itemListElement: GUIDES.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: abs(`/rakovodstva/${g.slug}`),
              name: g.title,
            })),
          },
        )}
      />

      <div data-v2 className="v2-scope">
        <NavbarV2 />

        <main data-v2 id="top">
          <section className="v2-section relative overflow-hidden pt-32">
            <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
            <div className="v2-wrap">
              <nav aria-label="Трохи" className="v2-mono mb-6 text-[12px]">
                <Link href="/" className="text-[var(--v2-muted)] hover:text-[var(--v2-cyan)]">
                  Начало
                </Link>
                <span className="mx-2 text-[var(--v2-faint)]">/</span>
                <span className="text-[var(--v2-cyan)]">Ръководства</span>
              </nav>

              <span className="v2-eyebrow">РЪКОВОДСТВА</span>
              <h1 className="v2-title-plain mt-4 max-w-3xl text-[clamp(30px,5vw,52px)] leading-[1.1]">
                Как се прави <span className="v2-grad">AI автоматизация</span> — без общи приказки
              </h1>
              <p className="mt-7 max-w-2xl text-[16px] leading-[1.75] text-[var(--v2-muted)] md:text-[17px]">
                Всяко ръководство тук е писано така, че да свърши работа и на човек, който няма
                да работи с нас. Има числа, срокове и раздел за това къде решението не работи —
                тази част обикновено липсва другаде, а е най-полезната.
              </p>

              <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {GUIDES.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/rakovodstva/${g.slug}`}
                    className="v2-card group flex flex-col p-6 transition hover:border-[var(--v2-cyan)]"
                  >
                    <span className="v2-mono text-[11px] uppercase tracking-[0.18em] text-[var(--v2-cyan)]">
                      {g.readMinutes} мин. четене
                    </span>
                    <h2
                      className="mt-3 text-[19px] font-bold leading-snug text-[var(--v2-ink)]"
                      style={{ fontFamily: "var(--v2-font-display)" }}
                    >
                      {g.title}
                    </h2>
                    <p className="mt-3 flex-1 text-[15px] leading-[1.65] text-[var(--v2-muted)]">
                      {g.description}
                    </p>
                    <span className="v2-mono mt-5 text-[12px] text-[var(--v2-cyan)]">Чети →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="v2-section relative overflow-hidden">
            <div aria-hidden className="v2-aurora pointer-events-none absolute inset-0" />
            <div className="v2-wrap relative max-w-3xl text-center">
              <h2 className="v2-title-plain text-[clamp(24px,3.6vw,38px)]">
                Прочете и сега какво
              </h2>
              <p className="mt-5 text-[16px] leading-[1.75] text-[var(--v2-muted)]">
                Ако нещо от прочетеното описва твоя бизнес, половин час разговор стига да се
                разбере откъде да се тръгне. Списъкът с процесите остава при теб така или иначе.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/booking" className="v2-btn v2-btn-primary">
                  Запази безплатна консултация
                </Link>
                <Link href="/ai-avtomatizacia" className="v2-btn">
                  Виж услугите
                </Link>
              </div>
            </div>
          </section>
        </main>

        <FooterV2 />
      </div>
    </>
  );
}
