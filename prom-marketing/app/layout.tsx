import type { Metadata, Viewport } from "next";
import { Unbounded, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { MetaPixel } from "@/components/effects/MetaPixel";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/seo/JsonLd";
import { baseGraph, graph, localBusinessSchema } from "@/lib/seo/schema";
import { ALL_KEYWORDS, ORG, SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "700", "800"],
});

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "600"],
});

/* ---------------------------------------------------------------------
   Заглавието води с ключовата дума, не с марката.

   „ProMarketing" няма търсения — никой не пише името ни в Google, защото
   още не го знае. „AI автоматизация" и „бизнес автоматизация" имат.
   Затова марката отива накрая, където и без това служи само за
   разпознаване, а първите 60 знака се дават на думите, по които ни търсят.

   `template` слага марката автоматично на всяка вътрешна страница —
   така всяко заглавие остава уникално, а сайтът звучи като едно цяло.
   --------------------------------------------------------------------- */
export const metadata: Metadata = {
  title: {
    default: "AI автоматизация за бизнеса — AI агенти и чатботове",
    template: "%s | ProMarketing",
  },
  description:
    "AI автоматизация на бизнес процеси в България: AI агенти, чатботове на български, " +
    "гласови асистенти и CRM, които поемат обажданията, чата и офертите. 24/7.",
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
      SITE_URL
  ),
  applicationName: ORG.name,
  keywords: ALL_KEYWORDS,
  category: "technology",
  authors: [{ name: ORG.founder.name, url: SITE_URL }],
  creator: ORG.legalName,
  publisher: ORG.legalName,
  // Телефонът е основният канал за продажби — нека браузърът го прави линк.
  formatDetection: { telephone: true, email: true, address: false },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: ORG.name,
    title: "AI автоматизация за бизнеса · AI агенти, чатботове и CRM",
    description:
      "AI агенти поемат обажданията, чата и офертите. Ти гледаш само резултатите — " +
      "в личния си AI CRM. Безплатна консултация.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI автоматизация за бизнеса",
    description:
      "AI агенти, чатботове и CRM, които работят 24/7. Ти само одобряваш.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Без таван на откъса и с голяма визия — заема повече място в
      // резултатите, което само по себе си вдига кликовете.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // ⚠️ ТУК НЯМА `alternates` — и това е нарочно.
  //
  // Досега коренният layout задаваше `canonical: "https://promarketing.pw"`.
  // Метаданните в Next се наследяват, затова ВСЯКА страница без свой
  // каноничен адрес казваше на Google: „аз съм копие на началната".
  // /magazin, /demo, /kurs, /plan, /booking, /jarvis, /automation-audit —
  // всички сочеха към „/". Google прилежно ги изключваше от индекса.
  //
  // Заедно с липсващия sitemap това е причината сайтът да съществува за
  // търсачката като една-единствена страница. Каноничният адрес вече се
  // задава от всяка страница поотделно; началната — в app/page.tsx.
  //
  // Попълва се веднъж, след като Search Console даде кода за домейна.
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bg"
      className={`${unbounded.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body>
        {/* Фирмата, сайтът, човекът и локалният бизнес — един граф, валиден
            за целия сайт. Излиза в първоначалния HTML, значи го четат и
            роботите, които не изпълняват JavaScript — а това са почти
            всички AI търсачки. */}
        <JsonLd json={graph(baseGraph(), localBusinessSchema())} />
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-accent-cyan)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-bg-void)] focus:outline-none"
        >
          Прескочи към съдържанието
        </a>
        <MetaPixel />
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
