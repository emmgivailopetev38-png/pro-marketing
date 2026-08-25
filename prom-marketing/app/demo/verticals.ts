import type { Metadata } from "next";

/* ============================================================================
   Единственият източник за деветте браншови демота.
   Ползва се от лентата за превключване (vertical-demo.tsx), от картите в /demo
   и от metadata-та на всяка страница /demo/<бранш>.
   ========================================================================== */

export type Vertical =
  | "influencer" | "shop" | "b2b"
  | "proizvodstvo" | "schetovodstvo" | "ohrana" | "reciklirane" | "dokumenti" | "transport";

type Entry = {
  pill: string;    // късото име за лентата за превключване
  name: string;    // пълното име за картите в /demo
  accent: string;  // акцентът на картата в /demo
  card: string;    // описанието под името в картата
  title: string;   // <title> и OG заглавие на самото демо
  desc: string;    // OG описание — това вижда човекът, щом получи линка
};

export const VERTICALS: Record<Vertical, Entry> = {
  b2b: {
    pill: "B2B / Фирми", name: "B2B / Фирми", accent: "#f0c560",
    card: "CRM, оферти, фактури и проекти — свързани от край до край.",
    title: "Живо демо за B2B фирми · ProMarketing OS",
    desc: "CRM, оферти, фактури и проекти — свързани и автоматизирани. Пуснете автоматизациите и вижте потока на живо.",
  },
  shop: {
    pill: "Магазин", name: "Онлайн магазин", accent: "#ef5da8",
    card: "Реклами, поръчки и отговори, които се движат сами.",
    title: "Живо демо за онлайн магазин · ProMarketing OS",
    desc: "Реклами, поръчки, отговори и справки на автопилот. Вижте как влизат продажбите, докато Вие само гледате.",
  },
  influencer: {
    pill: "Инфлуенсър", name: "Инфлуенсър", accent: "#2dd4d8",
    card: "Съдържание, DM-и и лийдове — докато Вие творите.",
    title: "Живо демо за инфлуенсъри и личен бранд · ProMarketing OS",
    desc: "Съдържание, DM-и и лийдове на автопилот. Пуснете студиото и вижте как постът се ражда за секунди.",
  },
  proizvodstvo: {
    pill: "Производство", name: "Производство", accent: "#3b82f6",
    card: "Поръчки, машини, склад и качество на един екран.",
    title: "Живо демо за производство и цех · ProMarketing OS",
    desc: "Поръчки, машини, склад и качество в реално време. Вижте целия цех на един екран.",
  },
  schetovodstvo: {
    pill: "Счетоводство", name: "Счетоводство", accent: "#0ea5e9",
    card: "Фактури, ДДС, банка и заплати по график.",
    title: "Живо демо за счетоводна кантора · ProMarketing OS",
    desc: "Фактури, ДДС, банка и заплати вървят по график. Вижте как документите се движат без Вас.",
  },
  reciklirane: {
    pill: "Рециклиране", name: "Рециклиране", accent: "#34d399",
    card: "Всяка партида проследима от контейнера до везната.",
    title: "Живо демо за рециклиране и отпадъци · ProMarketing OS",
    desc: "Събиране, сортиране, документи и отчети на едно място. Всяка партида — проследима от контейнера до везната.",
  },
  transport: {
    pill: "Транспорт", name: "Транспорт", accent: "#10b981",
    card: "Курсове, шофьори и документи в една система.",
    title: "Живо демо за транспорт и логистика · ProMarketing OS",
    desc: "Курсове, шофьори, документи и клиенти в една система. Вижте къде е товарът, без да звъните на никого.",
  },
  dokumenti: {
    pill: "Документи", name: "Документооборот", accent: "#60a5fa",
    card: "Сканирате веднъж — намирате за секунди.",
    title: "Живо демо за документооборот и архив · ProMarketing OS",
    desc: "Сканирате веднъж, а системата разпознава, подрежда и напомня. Вижте архива на живо.",
  },
  ohrana: {
    pill: "Охрана", name: "Видеонаблюдение", accent: "#22d3ee",
    card: "Камери, достъп и аларми на едно табло.",
    title: "Живо демо за видеонаблюдение и охрана · ProMarketing OS",
    desc: "Камери, достъп и аларми на едно табло. Вижте как сигналът стига до оператора за секунди.",
  },
};

/* редът, в който се показват — и в лентата, и в /demo */
export const VERTICAL_ORDER: Vertical[] = [
  "b2b", "shop", "influencer", "proizvodstvo", "schetovodstvo",
  "reciklirane", "transport", "dokumenti", "ohrana",
];

/* всяко демо носи своето заглавие и своя линк-преглед, вместо общото на сайта */
export function verticalMetadata(slug: Vertical): Metadata {
  const v = VERTICALS[slug];
  return {
    title: v.title,
    description: v.desc,
    alternates: { canonical: `/demo/${slug}` },
    openGraph: {
      type: "website",
      locale: "bg_BG",
      url: `/demo/${slug}`,
      siteName: "ProMarketing LTD",
      title: v.title,
      description: v.desc,
    },
    twitter: { card: "summary_large_image", title: v.title, description: v.desc },
    robots: { index: false, follow: false },
  };
}
