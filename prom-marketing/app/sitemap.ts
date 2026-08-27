import type { MetadataRoute } from "next";
import { PILLAR_PAGES, SUPPORTING_PAGES, abs } from "@/lib/seo/site";
import { GUIDES } from "@/lib/seo/guides";

/* =====================================================================
   sitemap.xml — до 27.08.2026 връщаше 404, тоест Google откриваше
   страниците само по вътрешни връзки. При сайт, чиято навигация е
   само лого + телефон, това означаваше, че почти нищо не се откриваше.

   Началната страница е 1.0. Стълбовете — 0.9+. Правните — 0.2.
   `lastModified` идва от времето на билда: всяко пускане на код казва
   на Google „тук е пипано".
   ===================================================================== */

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: abs("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: { bg: abs("/"), en: abs("/en"), "x-default": abs("/") },
      },
    },
    ...[...PILLAR_PAGES, ...SUPPORTING_PAGES].map((p) => ({
      url: abs(p.path),
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),

    // Хъбът на ръководствата и всяко ръководство. Идват директно от
    // lib/seo/guides.ts — ново ръководство влиза в картата само.
    {
      url: abs("/rakovodstva"),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...GUIDES.map((g) => ({
      url: abs(`/rakovodstva/${g.slug}`),
      // Тук датата е истинската от текста, не времето на билда — иначе
      // Google получава „обновено" при всяко пускане на код и спира да
      // вярва на сигнала.
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];
}
