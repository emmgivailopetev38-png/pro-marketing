/**
 * Текстът на /bezplaten-kurs — безплатният видео курс „Фирма с AI служители“
 * (лийд магнитът на рекламата „ПМ · Безплатен курс · AI за собственика · 2026-10-07“).
 *
 * Курсът ПОКАЗВА какво вършат AI служителите в истинската фирма на Ивайло —
 * с истинските екрани и кадри. Гласът в уроците е клонингът на гласа на
 * Ивайло (ElevenLabs) — затова редът за прозрачност стои над уроците и
 * етикетът „AI ГЛАС“ е във всяко видео.
 *
 * Всеки текст тук е минал през прокурор по истинност (FAKTI.md / TEKSTOVE.md в
 * „Проекти/Реклами/Курс-2026-10-07/uroci/“). Нов текст → пак през него.
 *
 * Видеата са в `public/bezplaten-kurs/` (4:5, 720×900, H.264). Урок без
 * готово видео (`video: null`) се показва като „Излиза скоро“.
 */

export const NASLOV = "Фирма с AI служители";
export const PODNASLOV =
  "Какво вече вършат AI служителите в една истинска малка фирма — моята. Обажданията от сайта, офертите, рекламите, видеата и отчетите. С истинските екрани, без теория. Пет урока, по около минута.";
export const PROZRACHNOST =
  "Гласът в уроците е моят, клониран с изкуствен интелект. Екраните и кадрите с мен са истински; видеото за къщата е правено с AI. Имената на клиентите са скрити.";

const UTM = "utm_source=kurs&utm_medium=stranica&utm_campaign=kurs";
export const BOOKING = `https://promarketing.pw/booking?${UTM}`;
export const AKADEMIA = `https://akademia.promarketing.pw/?${UTM}`;
export const PHONE = "0877 399 963";
export const PHONE_TEL = "+359877399963";

export type Most = "odit" | "akademia" | null;

export interface Urok {
  n: number;
  id: string;
  zaglavie: string;
  kakvo: string;
  /** /bezplaten-kurs/urok-N.mp4 — null, докато урокът не е готов */
  video: string | null;
  poster: string | null;
  /** секунди — само за надписа до урока */
  sekundi: number | null;
  /** мекият мост под урока */
  most: Most;
}

export const UROCI: Urok[] = [
  {
    n: 1,
    id: "urok-1",
    zaglavie: "Екипът, който не спи",
    kakvo: "Какво правят AI служителите в моята фирма — и четирите нива на AI. Къде си ти?",
    video: "/bezplaten-kurs/urok-1.mp4",
    poster: "/bezplaten-kurs/urok-1.jpg",
    sekundi: 59,
    most: null,
  },
  {
    n: 2,
    id: "urok-2",
    zaglavie: "Коста — AI гласът на сайта",
    kakvo: "Коста вдига, когато ми звънят от сайта. Казва, че е AI, отговаря по моя сценарий и може да запише среща в календара ми.",
    video: "/bezplaten-kurs/urok-2.mp4",
    poster: "/bezplaten-kurs/urok-2.jpg",
    sekundi: 37,
    most: "odit",
  },
  {
    n: 3,
    id: "urok-3",
    zaglavie: "Задачата с един глас",
    kakvo: "Площадът в Бургас, една задача на глас — и офертите, които AI подготвя по думите ми, а аз преглеждам и пращам.",
    video: "/bezplaten-kurs/urok-3.mp4",
    poster: "/bezplaten-kurs/urok-3.jpg",
    sekundi: 50,
    most: "akademia",
  },
  {
    n: 4,
    id: "urok-4",
    zaglavie: "Видеото, което носи обаждания",
    kakvo: "Къщата в Белцов: осем месеца през агенции — нито едно обаждане. После едно AI видео — 47 обаждания.",
    video: "/bezplaten-kurs/urok-4.mp4",
    poster: "/bezplaten-kurs/urok-4.jpg",
    sekundi: 43,
    most: "odit",
  },
  {
    n: 5,
    id: "urok-5",
    zaglavie: "Отчетът, който ме чака сутрин",
    kakvo: "Как AI следи рекламите и CRM-а и ми казва колко струва една среща.",
    video: "/bezplaten-kurs/urok-5.mp4",
    poster: "/bezplaten-kurs/urok-5.jpg",
    sekundi: 56,
    most: null,
  },
];

export const MOST: Record<Exclude<Most, null>, { tekst: string; buton: string; href: string }> = {
  odit: {
    tekst: "Искаш това да работи и при теб? На безплатния AI одит ще видим дали има смисъл за твоя бизнес.",
    buton: "Избери час за одита",
    href: BOOKING,
  },
  akademia: {
    tekst: "Искаш да се научиш сам да възлагаш така? В Академията го учиш стъпка по стъпка, върху истински бизнес.",
    buton: "Виж Академията",
    href: AKADEMIA,
  },
};

export const DVA_PATYA = {
  zaglavie: "Какво следва",
  odit: {
    kick: "Искаш това да работи при теб?",
    zaglavie: "Безплатен AI одит · 45 минути онлайн",
    tekst: "Показваме ти кои задачи във фирмата ти може да поеме AI и откъде да започнеш.",
    buton: "Избери час",
    href: BOOKING,
  },
  akademia: {
    kick: "Искаш да се научиш да го правиш сам?",
    zaglavie: "Академия Pro Marketing",
    tekst: "Платена програма: кратки уроци със задача, върху истински бизнес, в затворена общност. Достъпът се отключва лично.",
    buton: "Заяви достъп",
    href: AKADEMIA,
  },
};
