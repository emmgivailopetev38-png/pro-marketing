/**
 * A/B тестът на лендинга (Стефчо, 26.11.2026 11:38–11:40, Viber):
 *  „Направи Б тест, където махнеш подзаглавието изцяло и вместо „Ето тайната
 *   как…“ нека пише „3-те Скрити Тайни Как…“ · нека трафикът към А да е 60%,
 *   а към Б 40% · на лендинг страницата, не на рекламите“.
 * Ивайло: „направо го направи“.
 *
 * Как работи: адресът е същият (ivailopetev.com), рекламите не се пипат.
 * proxy.ts дава на всеки нов посетител А или Б (60/40) и го пази в бисквитка
 * за 30 дни → човекът вижда винаги една и съща версия. Версията отива в
 * събитията на пиксела, в записването (CRM) и в таблицата uebinar_ab
 * (посещения и отворени форми) → opt-in на А срещу Б.
 */

export type Varianta = "A" | "B";

export const AB_TEST = "zaglavie-2026-11-26";
export const AB_COOKIE = "pm_ab_uebinar";
/** Делът на Б (40%). */
export const AB_DYAL_B = 0.4;
export const AB_BISKVITKA_SEK = 60 * 60 * 24 * 30;
/** Вътрешният път на Б (А е /na-zhivo). */
export const AB_PATH_B = "/na-zhivo/b";

export function eVarianta(v: unknown): v is Varianta {
  return v === "A" || v === "B";
}

/** Версията на посетителя: от бисквитката, ако я има; иначе нова (60/40). */
export function abVarianta(biskvitka: string | null | undefined, rand: number = Math.random()): { varianta: Varianta; nova: boolean } {
  if (eVarianta(biskvitka)) return { varianta: biskvitka, nova: false };
  return { varianta: rand < AB_DYAL_B ? "B" : "A", nova: true };
}

/** Заглавието на Б — думите на Стефчо, без подзаглавие под него. */
export const ZAGLAVIE_B = {
  before: "3-те Скрити Тайни Как Покрай Работата Си Да Изградиш Допълнителен Доход Със ",
  mark: "Сайтове, Които AI Прави За Фирмите В Твоя Град",
  after: "... Дори Да Не Разбираш Нищо От AI",
} as const;
