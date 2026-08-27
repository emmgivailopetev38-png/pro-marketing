import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/* =====================================================================
   robots.txt — до 27.08.2026 връщаше 404.

   Две решения тук са нарочни:

   1. AI роботите (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) са
      ИЗРИЧНО допуснати. Все повече запитвания идват от хора, които питат
      ChatGPT „коя фирма прави AI автоматизации в България". Забраниш ли
      ги, изчезваш от този канал, а той расте по-бързо от класическото
      търсене.

   2. Клиентските оферти и презентациите са забранени. Те са персонални
      и тънки — в индекса само разреждат авторитета и излагат имена.
   ===================================================================== */

const DISALLOW = [
  "/admin",
  "/api/",
  "/oferta/",
  "/prezentacia/",
  "/razgovorat/",
  "/pitch",
  "/webinar",
  "/trading",
  "/ai-trading",
  "/v2",
  "/kurs/uspeh",
  "/*?*fbclid=",
  "/*?*gclid=",
  "/*?*utm_",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
  "Bytespider",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      // Да не си харчим бюджета за обхождане по картинките на админа.
      { userAgent: "Googlebot-Image", allow: ["/images/", "/videa/", "/ads/"], disallow: "/admin" },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/api/", "/oferta/", "/prezentacia/", "/razgovorat/"],
      })),
      // Скрейпъри за чужди SEO инструменти — ядат ресурс, не носят клиенти.
      { userAgent: ["SemrushBot", "AhrefsBot", "MJ12bot", "DotBot", "PetalBot"], disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
