import Link from "next/link";
import "@/app/v2/v2-design.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, graph, serviceSchema, webPageSchema } from "@/lib/seo/schema";
import { ORG } from "@/lib/seo/site";
import { VERTICALS, VERTICAL_SEO, VERTICAL_ORDER, type Vertical } from "./verticals";

/* =====================================================================
   Сървърно съдържание за браншовите демота.

   ЗАЩО СЪЩЕСТВУВА: `vertical-demo.tsx` е клиентски компонент, който до
   монтиране връща само екран „Зареждам демото…". Проверка на билда на
   27.08.2026 показа, че деветте адреса /demo/<бранш> се отдават на
   търсачките БЕЗ H1 и практически без текст — цялото демо се появява
   едва след като браузърът пусне JavaScript.

   Google в крайна сметка изпълнява скриптове, но AI търсачките почти
   никога не го правят, а и страница с празен първоначален HTML се
   обхожда по-рядко. Затова тук стои истинско сървърно съдържание,
   поставено СЛЕД демото: посетителят вижда демото първо, а роботът
   получава заглавие, текст и въпроси още в първия отговор.

   Демото не е пипано — работи точно както преди.
   ===================================================================== */

export function VerticalSeo({ slug }: { slug: Vertical }) {
  const v = VERTICALS[slug];
  const seo = VERTICAL_SEO[slug];
  const path = `/demo/${slug}`;

  // Ротация, а не първите три: при .slice(0,3) едни и същи четири бранша
  // събираха всички вътрешни връзки, а останалите пет оставаха сираци.
  // Тук всеки сочи към следващите три след себе си в кръг.
  const i0 = VERTICAL_ORDER.indexOf(slug);
  const others = [1, 2, 3].map((d) => VERTICAL_ORDER[(i0 + d) % VERTICAL_ORDER.length]);

  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path,
            name: seo.h1,
            description: v.desc,
            breadcrumbs: [
              { name: "Живо демо", path: "/demo" },
              { name: v.name, path },
            ],
          }),
          serviceSchema({
            path,
            name: seo.h1,
            serviceType: "Business process automation",
            description: seo.answer,
          }),
          faqSchema(path, seo.faq),
        )}
      />

      {/* Секцията е в нормалния поток след .vd-root (min-height:100vh),
          тоест се стига със скролване и не пипа оформлението на демото. */}
      <section
        className="v2-scope"
        style={{
          background: "var(--v2-void, #05070d)",
          borderTop: "1px solid var(--v2-line, rgba(255,255,255,.08))",
          padding: "clamp(56px,8vw,96px) 0",
        }}
      >
        <div className="v2-wrap" style={{ maxWidth: 860 }}>
          <nav aria-label="Трохи" className="v2-mono" style={{ fontSize: 12, marginBottom: 20 }}>
            <Link href="/" style={{ color: "var(--v2-muted)" }}>
              Начало
            </Link>
            <span style={{ margin: "0 8px", color: "var(--v2-faint)" }}>/</span>
            <Link href="/demo" style={{ color: "var(--v2-muted)" }}>
              Живо демо
            </Link>
            <span style={{ margin: "0 8px", color: "var(--v2-faint)" }}>/</span>
            <span style={{ color: "var(--v2-cyan)" }}>{v.name}</span>
          </nav>

          {/* Единственият H1 на страницата — демото отгоре няма свой. */}
          <h1 className="v2-title-plain" style={{ fontSize: "clamp(26px,4.4vw,42px)", lineHeight: 1.12 }}>
            {seo.h1}
          </h1>

          <div className="v2-card" style={{ marginTop: 28, padding: 24 }}>
            <p
              className="v2-mono"
              style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--v2-cyan)", marginBottom: 12 }}
            >
              Накратко
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--v2-ink)" }}>{seo.answer}</p>
          </div>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Какво поема системата
          </h2>
          <ul style={{ marginTop: 22, display: "grid", gap: 14 }}>
            {seo.does.map((d) => (
              <li key={d.title} className="v2-card" style={{ padding: 18 }}>
                <h3
                  style={{ fontSize: 16, fontWeight: 700, color: "var(--v2-ink)", fontFamily: "var(--v2-font-display)" }}
                >
                  {d.title}
                </h3>
                <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.6, color: "var(--v2-muted)" }}>{d.text}</p>
              </li>
            ))}
          </ul>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Какво остава на човека
          </h2>
          <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.8, color: "var(--v2-muted)" }}>{seo.human}</p>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Чести въпроси
          </h2>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {seo.faq.map((f) => (
              <details key={f.q} className="v2-card" style={{ padding: 18 }}>
                <summary style={{ cursor: "pointer", fontSize: 16, fontWeight: 600, color: "var(--v2-ink)" }}>
                  {f.q}
                </summary>
                <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.75, color: "var(--v2-muted)" }}>{f.a}</p>
              </details>
            ))}
          </div>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Демота за други браншове
          </h2>
          <div style={{ marginTop: 20, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {others.map((k) => (
              <Link key={k} href={`/demo/${k}`} className="v2-card" style={{ display: "block", padding: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--v2-ink)" }}>{VERTICALS[k].name}</span>
                <span style={{ display: "block", marginTop: 6, fontSize: 14, color: "var(--v2-muted)" }}>
                  {VERTICALS[k].card}
                </span>
              </Link>
            ))}
          </div>

          <div className="v2-card" style={{ marginTop: 48, padding: 26, textAlign: "center" }}>
            <h2 className="v2-title-plain" style={{ fontSize: "clamp(19px,2.6vw,26px)" }}>
              Да го направим за твоя бизнес
            </h2>
            <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: "var(--v2-muted)" }}>
              Демото отгоре е с примерни данни. На консултацията минаваме през твоите процеси и
              казваме кой да тръгне пръв.
            </p>
            <div style={{ marginTop: 22, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/booking" className="v2-btn v2-btn-primary">
                Запази безплатна консултация
              </Link>
              <Link href="/ai-avtomatizacia" className="v2-btn">
                Виж услугата
              </Link>
            </div>
            <p className="v2-mono" style={{ marginTop: 18, fontSize: 12, color: "var(--v2-faint)" }}>
              {ORG.city}, България · {ORG.phoneDisplay}
            </p>
          </div>

          <p style={{ marginTop: 34, fontSize: 13, color: "var(--v2-faint)" }}>
            Виж още:{" "}
            <Link href="/rakovodstva" style={{ color: "var(--v2-cyan)" }}>
              ръководствата за AI автоматизация
            </Link>{" "}
            ·{" "}
            <Link href="/ai-agenti" style={{ color: "var(--v2-cyan)" }}>
              AI агенти
            </Link>{" "}
            ·{" "}
            <Link href="/ai-chatbot" style={{ color: "var(--v2-cyan)" }}>
              AI чатбот
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
