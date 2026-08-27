import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Версията на Next в отговорите не помага на никого освен на скенерите.
  poweredByHeader: false,

  images: {
    // AVIF пръв — при снимките на сайта сваля 30-50% спрямо WebP, а LCP
    // е един от трите показателя, по които Google мери страницата.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async redirects() {
    return [
      // ─────────────────────────────────────────────────────────────
      // www → без www, с 301.
      //
      // До 27.08.2026 и двата адреса връщаха 200, тоест целият сайт
      // съществуваше два пъти за Google. Каноничният таг сочеше вярно,
      // но каноничният таг е препоръка; 301 е нареждане. Разделеният
      // авторитет между двата хоста е чиста загуба.
      // ─────────────────────────────────────────────────────────────
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.promarketing.pw" }],
        destination: "https://promarketing.pw/:path*",
        permanent: true,
      },

      // Стари/логични адреси, които хората и роботите пробват.
      { source: "/uslugi", destination: "/ai-avtomatizacia", permanent: true },
      { source: "/ai", destination: "/ai-avtomatizacia", permanent: true },
      { source: "/avtomatizacia", destination: "/ai-avtomatizacia", permanent: true },
      { source: "/chatbot", destination: "/ai-chatbot", permanent: true },
      { source: "/crm", destination: "/ai-crm", permanent: true },
      { source: "/kontakti", destination: "/booking", permanent: true },
    ];
  },

  async rewrites() {
    return [
      // Самостоятелна статична страница (Велко) — обслужва се от public/velko/index.html.
      // Скоупната само за /velko; не засяга нито един app/CRM маршрут.
      { source: "/velko", destination: "/velko/index.html" },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Не помага на класирането пряко, но е част от „сайтът е поддържан".
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Картинките и видеата се сменят рядко — нека кешът работи.
        source: "/:path(videa|images|ads)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
