import { NaZhivoLanding } from "@/components/uebinar/NaZhivoLanding";
import { NA_ZHIVO_METADATA, montserrat } from "../obshto";
import "../na-zhivo.css";

/**
 * Версия Б на лендинга (A/B тестът на Стефчо, 26.11.2026 — lib/uebinar/ab.ts):
 * без подзаглавие и със заглавието „3-те Скрити Тайни…“. Показва се на 40% от
 * хората на https://ivailopetev.com (proxy.ts); отделен адрес няма.
 */
export const metadata = NA_ZHIVO_METADATA;

export default function Page() {
  return (
    <div className={montserrat.variable}>
      <NaZhivoLanding varianta="B" />
    </div>
  );
}
