/* =====================================================================
   Структурирани данни (JSON-LD, schema.org).

   Това е разликата между „Google чете текст" и „Google разбира бизнеса".
   Всеки възел има стабилен @id, за да могат възлите да се сочат помежду
   си — един граф, а не разхвърляни картончета. Графът е и това, което
   ChatGPT, Perplexity и Google AI Overviews цитират, когато отговарят
   на въпрос за AI автоматизация в България.

   ⚠️ Съзнателно НЯМА Review/AggregateRating. Отзивите на сайта са
   демонстрационни, а маркиране на несъществуващи отзиви е нарушение на
   правилата на Google за структурирани данни и води до ръчна санкция.
   Добавя се в мига, в който има реални отзиви с реални имена.
   ===================================================================== */

import { ORG, SITE_URL, abs } from "./site";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const PERSON_ID = `${SITE_URL}/#ivailo-petev`;
const LOCAL_ID = `${SITE_URL}/#local`;

type Json = Record<string, unknown>;

/**
 * Пощенският адрес — само с това, което е потвърдено.
 *
 * Улицата, пощенският код и координатите се подават само ако са попълнени
 * в `site.ts`. Измислен адрес в структурираните данни е по-вреден от
 * липсващ: Google го сверява с Google Business Profile и разминаването
 * сваля доверието към целия локален профил.
 */
function postalAddress(): Json {
  return {
    "@type": "PostalAddress",
    addressLocality: ORG.city,
    addressRegion: ORG.region,
    addressCountry: ORG.country,
    ...(ORG.street ? { streetAddress: ORG.street } : {}),
    ...(ORG.postalCode ? { postalCode: ORG.postalCode } : {}),
  };
}

/** Фирмата — коренният възел, към който сочи всичко останало. */
export function organizationSchema(): Json {
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: ORG.name,
    legalName: ORG.legalName,
    alternateName: [...ORG.alternateName],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: abs("/opengraph-image"),
      caption: ORG.name,
    },
    image: { "@id": `${SITE_URL}/#logo` },
    description:
      "Агенция за AI автоматизация в България. Изграждаме AI агенти, чатботове, " +
      "гласови асистенти и CRM системи, които поемат рутинната работа в бизнеса.",
    email: ORG.email,
    telephone: ORG.phone,
    vatID: ORG.vatId,
    taxID: ORG.taxId,
    foundingDate: ORG.foundingDate,
    founder: { "@id": PERSON_ID },
    address: postalAddress(),
    areaServed: ORG.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
    knowsLanguage: ["bg", "en"],
    sameAs: [...ORG.sameAs],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: ORG.phone,
        contactType: "sales",
        areaServed: "BG",
        availableLanguage: ["Bulgarian", "English"],
      },
    ],
  };
}

/** Локалният бизнес — това е възелът, който храни Google Maps и „до мен". */
export function localBusinessSchema(): Json {
  return {
    "@type": "ProfessionalService",
    "@id": LOCAL_ID,
    name: `${ORG.name} — AI автоматизация ${ORG.city}`,
    parentOrganization: { "@id": ORG_ID },
    url: abs("/ai-avtomatizacia-plovdiv"),
    telephone: ORG.phone,
    email: ORG.email,
    priceRange: "€€€",
    currenciesAccepted: "EUR, BGN",
    paymentAccepted: "Банков превод, карта",
    address: postalAddress(),
    ...(ORG.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: ORG.geo.lat, longitude: ORG.geo.lng } }
      : {}),
    areaServed: ORG.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };
}

/** Човекът зад фирмата — E-E-A-T носи авторитет, особено в нова ниша. */
export function personSchema(): Json {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: ORG.founder.name,
    jobTitle: ORG.founder.jobTitle,
    worksFor: { "@id": ORG_ID },
    url: SITE_URL,
    telephone: ORG.phone,
    email: ORG.email,
    sameAs: [...ORG.founder.sameAs],
    knowsAbout: [
      "AI автоматизация",
      "AI агенти",
      "автоматизация на бизнес процеси",
      "CRM системи",
      "Meta реклами",
      "изкуствен интелект за бизнес",
    ],
  };
}

/** Сайтът + вътрешното търсене (дава sitelinks searchbox). */
export function webSiteSchema(): Json {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_URL,
    name: ORG.name,
    inLanguage: "bg-BG",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Страница + трохите над нея. */
export function webPageSchema(opts: {
  path: string;
  name: string;
  description: string;
  breadcrumbs?: { name: string; path: string }[];
}): Json[] {
  const url = abs(opts.path);
  const nodes: Json[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: opts.name,
      description: opts.description,
      inLanguage: "bg-BG",
      isPartOf: { "@id": SITE_ID },
      about: { "@id": ORG_ID },
      primaryImageOfPage: { "@id": `${SITE_URL}/#logo` },
    },
  ];

  const crumbs = opts.breadcrumbs ?? [];
  if (crumbs.length) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [{ name: "Начало", path: "/" }, ...crumbs].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: abs(c.path),
      })),
    });
  }
  return nodes;
}

/** Услуга — казва на Google какво точно продаваме и на кого. */
export function serviceSchema(opts: {
  path: string;
  name: string;
  description: string;
  serviceType: string;
  offers?: { name: string; description: string }[];
}): Json {
  const url = abs(opts.path);
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType,
    provider: { "@id": ORG_ID },
    areaServed: ORG.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: url,
      servicePhone: ORG.phone,
      availableLanguage: ["bg", "en"],
    },
    ...(opts.offers?.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: opts.name,
            itemListElement: opts.offers.map((o) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: o.name, description: o.description },
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            })),
          },
        }
      : {}),
  };
}

/** Въпроси и отговори — печели разширен резултат И цитиране в AI отговори. */
export function faqSchema(path: string, qa: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    "@id": `${abs(path)}#faq`,
    inLanguage: "bg-BG",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Ръководство стъпка по стъпка — влиза в AI Overviews много охотно. */
export function howToSchema(opts: {
  path: string;
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  totalTime?: string;
}): Json {
  return {
    "@type": "HowTo",
    "@id": `${abs(opts.path)}#howto`,
    name: opts.name,
    description: opts.description,
    inLanguage: "bg-BG",
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/** Видео — иначе Google вижда само <video> таг и нищо не разбира. */
export function videoSchema(opts: {
  name: string;
  description: string;
  contentPath: string;
  thumbnailPath: string;
  uploadDate: string;
  duration?: string;
}): Json {
  return {
    "@type": "VideoObject",
    "@id": `${abs(opts.contentPath)}#video`,
    name: opts.name,
    description: opts.description,
    contentUrl: abs(opts.contentPath),
    thumbnailUrl: abs(opts.thumbnailPath),
    uploadDate: opts.uploadDate,
    ...(opts.duration ? { duration: opts.duration } : {}),
    publisher: { "@id": ORG_ID },
    inLanguage: "bg-BG",
  };
}

/**
 * Сглобява целия граф в един <script>. Един граф на страница —
 * повече скриптове означава повече шанс възлите да не се свържат.
 */
export function graph(...nodes: (Json | Json[])[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes.flat(),
  })
    // Екранирането на „<" е по документацията на Next: без него текст,
    // съдържащ </script>, би прекъснал скрипта и би счупил цялото
    // маркиране на страницата.
    .replace(/</g, "\\u003c");
}

/** Готовият комплект, който всяка публична страница ползва като база. */
export function baseGraph(): Json[] {
  return [organizationSchema(), webSiteSchema(), personSchema()];
}
