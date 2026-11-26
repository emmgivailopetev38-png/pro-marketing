import { NaZhivoLanding } from "@/components/uebinar/NaZhivoLanding";
import { NA_ZHIVO_METADATA, montserrat } from "./obshto";
import "./na-zhivo.css";

/**
 * /na-zhivo — записване за безплатното онлайн обучение „Покажи, не продавай“
 * (уебинар фунията „Пари с AI“). Тук водят рекламите.
 * Не се индексира — страница само за реклама.
 * Чистият ѝ адрес е https://ivailopetev.com (началната страница на домейна
 * показва нея — виж proxy.ts и lib/uebinar/domen.ts).
 * Целият текст е в lib/uebinar/na-zhivo.ts.
 * Това е версия А на A/B теста (60%); Б е в ./b (lib/uebinar/ab.ts).
 */
export const metadata = NA_ZHIVO_METADATA;

export default function Page() {
  return (
    <div className={montserrat.variable}>
      <NaZhivoLanding varianta="A" />
    </div>
  );
}
