// LIVE homepage → the 2050 "Luminescent Depth" redesign.
// The full composition + design system lives in app/v2/page.tsx; we render
// it here so promarketing.pw "/" shows it. The previous homepage components
// remain untouched in components/landing/* as an instant rollback path.
//
// Обвивката тук е нарочна, а не преизнос: структурираните данни на
// началната страница трябва да излязат САМО на "/", не и на "/v2" —
// иначе двата адреса си оспорват едни и същи @id възли.
import type { Metadata } from "next";
import HomePageV2 from "./v2/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, graph, serviceSchema, videoSchema, webPageSchema } from "@/lib/seo/schema";
import { HOME_FAQ, HOME_SERVICES, HOME_VIDEOS } from "@/lib/seo/home-content";
import { SITE_URL } from "@/lib/seo/site";

// Каноничният адрес и езиковите алтернативи вече живеят тук, а не в
// коренния layout — там те се наследяваха от всяка страница и я
// обявяваха за копие на началната.
export const metadata: Metadata = {
  alternates: {
    canonical: SITE_URL,
    languages: {
      "bg-BG": SITE_URL,
      en: `${SITE_URL}/en`,
      "x-default": SITE_URL,
    },
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path: "/",
            name: "AI автоматизация за бизнеса · AI агенти и чатботове",
            description:
              "AI агенти, чатботове на български, гласови асистенти и CRM, които поемат " +
              "обажданията, чата и офертите — 24/7.",
          }),
          serviceSchema({
            path: "/",
            name: "AI автоматизация за бизнеса",
            serviceType: "AI automation",
            description:
              "Изграждане на AI агенти, чатботове, гласови асистенти и CRM системи за " +
              "малкия и средния бизнес в България.",
            offers: HOME_SERVICES.map((s) => ({ name: s.name, description: s.description })),
          }),
          // Видеата в галерията иначе са невидими за търсачките — <video>
          // без маркиране не казва нищо за какво е клипът.
          HOME_VIDEOS.map((v) => videoSchema({ ...v })),
          faqSchema("/", HOME_FAQ.map((x) => ({ q: x.q, a: x.a }))),
        )}
      />
      <HomePageV2 />
    </>
  );
}
