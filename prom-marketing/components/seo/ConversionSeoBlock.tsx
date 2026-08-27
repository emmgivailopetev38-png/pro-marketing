import Link from "next/link";
import "@/app/v2/v2-design.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, graph, webPageSchema } from "@/lib/seo/schema";
import { ORG } from "@/lib/seo/site";

/* =====================================================================
   Сървърен блок за страниците-конверсия (/booking, /automation-audit).

   Тези две страници вършат работата си отлично — водят към разговор.
   За търсачката обаче бяха почти празни: 99 и 165 думи, тоест под
   прага, на който Google изобщо смята страницата за съдържание.

   Тук не се добавя пълнеж. Добавя се това, което човекът и без това
   пита преди да натисне бутона: какво ще се случи, как да се подготви,
   какво излиза накрая. Полезно за посетителя и достатъчно за робота.
   ===================================================================== */

export type ConversionSeoProps = {
  path: string;
  h2: string;
  intro: string;
  steps: { name: string; text: string }[];
  faq: { q: string; a: string }[];
  schemaName: string;
  schemaDescription: string;
  crumb: string;
};

export function ConversionSeoBlock({
  path,
  h2,
  intro,
  steps,
  faq,
  schemaName,
  schemaDescription,
  crumb,
}: ConversionSeoProps) {
  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path,
            name: schemaName,
            description: schemaDescription,
            breadcrumbs: [{ name: crumb, path }],
          }),
          faqSchema(path, faq),
        )}
      />

      <section
        className="v2-scope"
        style={{
          background: "var(--v2-void, #05070d)",
          borderTop: "1px solid var(--v2-line, rgba(255,255,255,.08))",
          padding: "clamp(56px,8vw,90px) 0",
        }}
      >
        <div className="v2-wrap" style={{ maxWidth: 820 }}>
          <h2 className="v2-title-plain" style={{ fontSize: "clamp(22px,3.4vw,34px)", lineHeight: 1.15 }}>
            {h2}
          </h2>
          <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.8, color: "var(--v2-muted)" }}>{intro}</p>

          <ol style={{ marginTop: 30, display: "grid", gap: 14 }}>
            {steps.map((s, i) => (
              <li key={s.name} className="v2-card" style={{ display: "flex", gap: 18, padding: 18 }}>
                <span
                  className="v2-mono"
                  style={{
                    flexShrink: 0,
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    background: "var(--v2-grad-accent)",
                    color: "var(--v2-void)",
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <h3
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--v2-ink)", fontFamily: "var(--v2-font-display)" }}
                  >
                    {s.name}
                  </h3>
                  <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.65, color: "var(--v2-muted)" }}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="v2-title-plain" style={{ fontSize: "clamp(20px,3vw,28px)", marginTop: 48 }}>
            Чести въпроси
          </h2>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {faq.map((f) => (
              <details key={f.q} className="v2-card" style={{ padding: 18 }}>
                <summary style={{ cursor: "pointer", fontSize: 16, fontWeight: 600, color: "var(--v2-ink)" }}>
                  {f.q}
                </summary>
                <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.75, color: "var(--v2-muted)" }}>{f.a}</p>
              </details>
            ))}
          </div>

          <p style={{ marginTop: 36, fontSize: 14, lineHeight: 1.8, color: "var(--v2-faint)" }}>
            Още преди разговора:{" "}
            <Link href="/ai-avtomatizacia" style={{ color: "var(--v2-cyan)" }}>
              какво е AI автоматизация
            </Link>{" "}
            ·{" "}
            <Link href="/rakovodstva/kolko-struva-ai-avtomatizacia" style={{ color: "var(--v2-cyan)" }}>
              колко струва
            </Link>{" "}
            ·{" "}
            <Link href="/demo" style={{ color: "var(--v2-cyan)" }}>
              живото демо
            </Link>
            . Или направо на телефона: {ORG.phoneDisplay}.
          </p>
        </div>
      </section>
    </>
  );
}
