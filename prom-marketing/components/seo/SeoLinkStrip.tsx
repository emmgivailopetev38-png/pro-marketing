import Link from "next/link";
import { ORG } from "@/lib/seo/site";

/* =====================================================================
   Лента с връзки за страниците, които нямат навигация и колонтитул.

   Някои лендинги (например /partneri) са нарочно самостоятелни — без
   меню и без футър, за да не разсейват. За търсачката обаче такава
   страница е задънена улица: получава авторитет и не го предава на
   никого. Google чете това като сигнал, че страницата е откъсната от
   сайта.

   Лентата е дискретна, стои най-отдолу и решава точно това, без да
   връща цялото меню обратно.
   ===================================================================== */

const DEFAULT_LINKS = [
  { href: "/ai-avtomatizacia", label: "AI автоматизация" },
  { href: "/ai-agenti", label: "AI агенти" },
  { href: "/ai-chatbot", label: "AI чатбот" },
  { href: "/ai-crm", label: "AI CRM" },
  { href: "/glasov-ai-agent", label: "Гласов AI агент" },
  { href: "/ai-marketing", label: "AI маркетинг" },
  { href: "/rakovodstva", label: "Ръководства" },
  { href: "/demo", label: "Живо демо" },
  { href: "/automation-audit", label: "Безплатен AI одит" },
  { href: "/mentor", label: "Менторство" },
];

export function SeoLinkStrip({
  links = DEFAULT_LINKS,
  title = "Останалото от системата",
}: {
  links?: { href: string; label: string }[];
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      style={{
        borderTop: "1px solid rgba(255,255,255,.08)",
        background: "#05070d",
        padding: "44px 24px 52px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.38)",
            marginBottom: 16,
          }}
        >
          {title}
        </p>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ fontSize: 15, color: "rgba(255,255,255,.66)", textDecoration: "none" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p style={{ marginTop: 22, fontSize: 13, color: "rgba(255,255,255,.3)" }}>
          {ORG.legalName} · {ORG.city}, България ·{" "}
          <a href={`tel:${ORG.phone}`} style={{ color: "rgba(255,255,255,.55)" }}>
            {ORG.phoneDisplay}
          </a>
        </p>
      </div>
    </section>
  );
}
