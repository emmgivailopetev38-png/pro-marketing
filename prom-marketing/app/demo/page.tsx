import Link from "next/link";
import "@/app/v2/v2-design.css";
import { DemoHub } from "./demo-hub";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, graph, serviceSchema, webPageSchema } from "@/lib/seo/schema";
import { VERTICALS, VERTICAL_ORDER } from "./verticals";
import { ORG } from "@/lib/seo/site";

/* =====================================================================
   Хъбът на живото демо.

   До 27.08.2026 `/demo` беше изцяло клиентска страница: сървърът връщаше
   празен екран, а вътре имаше ДЕСЕТ H1 наведнъж, които се появяваха едва
   след като браузърът пусне JavaScript. За търсачките страницата не
   съществуваше, а за екранните четци беше нечетима.

   Демото остава непокътнато — просто вече стои в клиентски компонент,
   а страницата е сървърна и носи заглавие, текст и връзки към деветте
   бранша. Тези връзки са и единственият начин браншовите демота изобщо
   да бъдат открити от Google.
   ===================================================================== */

const PATH = "/demo";
const TITLE = "Живо демо на AI система за бизнес — 9 бранша";
const DESCRIPTION =
  "Интерактивно демо на AI система за бизнес: CRM, чат, обаждания, документи и отчети " +
  "в движение. Отделно демо за девет бранша, без регистрация.";

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

const FAQ = [
  {
    q: "Демото с истински данни ли работи?",
    a: "Не — данните вътре са примерни, за да може да се пипа свободно, без да се пипа ничий бизнес. Логиката, потокът и екраните обаче са същите, които клиентите използват в реална работа.",
  },
  {
    q: "Трябва ли регистрация?",
    a: "Не. Демото се отваря директно и не иска нито имейл, нито телефон. Ако след това искаш да го видиш върху своите процеси, това става на консултация.",
  },
  {
    q: "Мога ли да получа същото за моя бранш, ако го няма тук?",
    a: "Да. Деветте са най-често търсените, но системата се сглобява по процеси, не по бранш. На консултацията минаваме през твоите и казваме кое се пренася наготово и кое се строи.",
  },
  {
    q: "Колко време отнема, докато такава система заработи при мен?",
    a: "Първият процес — 2 до 4 седмици. Свързаната система с CRM, чат, телефон и отчети обикновено се разгръща за 3 до 6 месеца, по един процес наведнъж, без бизнесът да спира.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path: PATH,
            name: TITLE,
            description: DESCRIPTION,
            breadcrumbs: [{ name: "Живо демо", path: PATH }],
          }),
          serviceSchema({
            path: PATH,
            name: "AI операционна система за бизнес",
            serviceType: "Business software demo",
            description: DESCRIPTION,
          }),
          {
            "@type": "ItemList",
            "@id": "https://promarketing.pw/demo#list",
            name: "Браншови демота",
            itemListElement: VERTICAL_ORDER.map((k, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://promarketing.pw/demo/${k}`,
              name: VERTICALS[k].name,
            })),
          },
          faqSchema(PATH, FAQ),
        )}
      />

      <DemoHub />

      {/* Сървърната част: заглавие, текст и деветте връзки. Стои след
          демото, за да не пипа първия екран. */}
      <section
        className="v2-scope"
        style={{
          background: "var(--v2-void, #05070d)",
          borderTop: "1px solid var(--v2-line, rgba(255,255,255,.08))",
          padding: "clamp(56px,8vw,96px) 0",
        }}
      >
        <div className="v2-wrap" style={{ maxWidth: 880 }}>
          <nav aria-label="Трохи" className="v2-mono" style={{ fontSize: 12, marginBottom: 20 }}>
            <Link href="/" style={{ color: "var(--v2-muted)" }}>
              Начало
            </Link>
            <span style={{ margin: "0 8px", color: "var(--v2-faint)" }}>/</span>
            <span style={{ color: "var(--v2-cyan)" }}>Живо демо</span>
          </nav>

          <h1 className="v2-title-plain" style={{ fontSize: "clamp(26px,4.4vw,42px)", lineHeight: 1.12 }}>
            Живо демо на AI система за бизнес
          </h1>

          <div className="v2-card" style={{ marginTop: 28, padding: 24 }}>
            <p
              className="v2-mono"
              style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--v2-cyan)", marginBottom: 12 }}
            >
              Накратко
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--v2-ink)" }}>
              Демото отгоре е работеща система с примерни данни: CRM, чат с клиенти, обаждания,
              документи, реклами и отчети, свързани в един поток. Пускаш автоматизациите и
              гледаш какво се случва, без регистрация и без да оставяш данни.
            </p>
          </div>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Демо за твоя бранш
          </h2>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.8, color: "var(--v2-muted)" }}>
            Всеки бранш има свои процеси и свои тесни места. Затова има отделно демо за девет от
            тях — със сцените, които реално се случват в този бизнес.
          </p>
          <div
            style={{ marginTop: 24, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}
          >
            {VERTICAL_ORDER.map((k) => (
              <Link key={k} href={`/demo/${k}`} className="v2-card" style={{ display: "block", padding: 18 }}>
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: "var(--v2-ink)", fontFamily: "var(--v2-font-display)" }}
                >
                  {VERTICALS[k].name}
                </span>
                <span style={{ display: "block", marginTop: 8, fontSize: 14, lineHeight: 1.55, color: "var(--v2-muted)" }}>
                  {VERTICALS[k].card}
                </span>
              </Link>
            ))}
          </div>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Чести въпроси за демото
          </h2>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {FAQ.map((f) => (
              <details key={f.q} className="v2-card" style={{ padding: 18 }}>
                <summary style={{ cursor: "pointer", fontSize: 16, fontWeight: 600, color: "var(--v2-ink)" }}>
                  {f.q}
                </summary>
                <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.75, color: "var(--v2-muted)" }}>{f.a}</p>
              </details>
            ))}
          </div>

          <div className="v2-card" style={{ marginTop: 48, padding: 26, textAlign: "center" }}>
            <h2 className="v2-title-plain" style={{ fontSize: "clamp(19px,2.6vw,26px)" }}>
              Същото, но с твоите процеси
            </h2>
            <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: "var(--v2-muted)" }}>
              На консултацията минаваме през това, което се повтаря при теб, и казваме кой процес
              да тръгне пръв. Списъкът остава при теб независимо какво решиш.
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
              ръководства за AI автоматизация
            </Link>{" "}
            ·{" "}
            <Link href="/ai-crm" style={{ color: "var(--v2-cyan)" }}>
              AI CRM система
            </Link>{" "}
            ·{" "}
            <Link href="/glasov-ai-agent" style={{ color: "var(--v2-cyan)" }}>
              гласов AI агент
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
