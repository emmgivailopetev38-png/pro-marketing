import type { Metadata } from "next";
import { NaZhivoLanding } from "@/components/uebinar/NaZhivoLanding";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import "./na-zhivo.css";

/**
 * /na-zhivo — записване за безплатното онлайн обучение „Демо първо“
 * (уебинар фунията „Пари с AI“). Тук водят рекламите.
 * Не се индексира: чернова за преглед, докато датата не е потвърдена
 * (NA_ZHIVO.dateConfirmed), и после — страница само за реклама.
 * Целият текст е в lib/uebinar/na-zhivo.ts.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/na-zhivo" },
  robots: { index: false, follow: false },
  title: { absolute: NA_ZHIVO.meta.title },
  description: NA_ZHIVO.meta.description,
  openGraph: {
    title: NA_ZHIVO.meta.title,
    description: NA_ZHIVO.meta.description,
    type: "website",
    url: "/na-zhivo",
    locale: "bg_BG",
  },
};

export default function Page() {
  return <NaZhivoLanding />;
}
