import type { Metadata } from "next";
import { NaZhivoLanding } from "@/components/uebinar/NaZhivoLanding";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import { UEBINAR_ORIGIN } from "@/lib/uebinar/domen";
import "./na-zhivo.css";

/**
 * /na-zhivo — записване за безплатното онлайн обучение „Покажи, не продавай“
 * (уебинар фунията „Пари с AI“). Тук водят рекламите.
 * Не се индексира — страница само за реклама.
 * Чистият ѝ адрес е https://ivailopetev.com (началната страница на домейна
 * показва нея — виж proxy.ts и lib/uebinar/domen.ts).
 * Целият текст е в lib/uebinar/na-zhivo.ts.
 */
// Картинката при споделяне (Viber, Messenger, FB) — Ивайло, не логото на
// Pro Marketing. Иконите на ivailopetev.com се сменят в next.config.ts.
const OG_IMAGE = {
  url: `${UEBINAR_ORIGIN}/ivailo/og.jpg`,
  width: 1200,
  height: 630,
  alt: "Безплатно обучение на живо „Допълнителен доход с AI“ с Ивайло Петев",
};

export const metadata: Metadata = {
  alternates: { canonical: `${UEBINAR_ORIGIN}/` },
  robots: { index: false, follow: false },
  title: { absolute: NA_ZHIVO.meta.title },
  description: NA_ZHIVO.meta.description,
  applicationName: "Ивайло Петев",
  openGraph: {
    title: NA_ZHIVO.meta.title,
    description: NA_ZHIVO.meta.description,
    type: "website",
    url: `${UEBINAR_ORIGIN}/`,
    siteName: "Ивайло Петев",
    locale: "bg_BG",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: NA_ZHIVO.meta.title,
    description: NA_ZHIVO.meta.description,
    images: [OG_IMAGE.url],
  },
};

export default function Page() {
  return <NaZhivoLanding />;
}
