/* ---------------------------------------------------------------------------
   Успехи — единственото място с данните за /uspehi и секцията на началната
   страница (03.11.2026, Ивайло: „всички наши успехи… галерия… видео съдържание
   на уебсайта за по-високо доверие").

   Правилата (не се пипат без Ивайло):
   • Числата са само от нашия CRM/Meta, с дата. Ново число → нова дата.
   • Снимките са истински кадри. Без AI портрети, без чужди хора в кадъра.
   • Видеата с AI глас носят етикета вътре в самото видео (EU AI Act чл. 50)
     и ред `ai` тук.
   • Галерия „Конференции и събития" се показва чак когато има снимки
     (масивът е празен → блокът не се рендва).
--------------------------------------------------------------------------- */

export type Chislo = { stoinost: string; tekst: string; iztochnik: string };
export type Snimka = { src: string; width: number; height: number; alt: string; etiket: string; kategoria: "teren" | "prezentacia" | "sabitia" };
export type Video = { slug: string; title: string; scene: string; len: string; format: "4x5" | "9x16"; ai?: string };

export const KAM_DATA = "3 ноември 2026";

export const CHISLA: Chislo[] = [
  { stoinost: "56", tekst: "проведени срещи от август", iztochnik: "CRM" },
  { stoinost: "23", tekst: "клиента", iztochnik: "CRM" },
  { stoinost: "7", tekst: "активни месечни услуги", iztochnik: "CRM" },
  { stoinost: "4,86 €", tekst: "на запитване в собствената ни реклама", iztochnik: "Meta · 13 дни · 38 запитвания" },
];

export const VIDEA: Video[] = [
  { slug: "komanden-centar", title: "Фирмата, която отговаря до минути — дори в 23:47.", scene: "Командният център", len: "1:05", format: "4x5", ai: "гласът зад кадър е AI (клонинг на Ивайло)" },
  { slug: "eli-zvani", title: "Ново запитване в 21:14. Ели звъни в 21:16 и записва час.", scene: "Ели, AI асистентката", len: "0:14", format: "4x5", ai: "Ели е AI асистентка" },
  { slug: "palen-otchet", title: "Пълен отчет за целия бизнес — с един глас.", scene: "Пълен отчет", len: "1:04", format: "9x16", ai: "гласът на асистента е AI · демо данни" },
  { slug: "ot-kolata", title: "Управлявам бизнеса си от колата.", scene: "От колата", len: "1:11", format: "9x16", ai: "гласът на асистента е AI" },
  { slug: "predi-sled", title: "Суров кадър → готов клип със субтитри. Без студио.", scene: "Преди / след", len: "0:47", format: "9x16", ai: "гласът на асистента е AI" },
];

export const GALERIA: Snimka[] = [
  { src: "/uspehi/kola-pulen-otchet.jpg", width: 900, height: 1600, alt: "Ивайло Петев шофира и иска пълен отчет от AI асистента си с глас", etiket: "„Искам пълен отчет“ — от колата", kategoria: "teren" },
  { src: "/uspehi/burgas-nosht.jpg", width: 900, height: 1600, alt: "Ивайло Петев вечерта в Бургас дава задача на AI агента по телефона", etiket: "Бургас, вечерта — задачите тръгват с глас", kategoria: "teren" },
  { src: "/uspehi/hotel-kostyum.jpg", width: 900, height: 1600, alt: "Ивайло Петев на път, управлява фирмата от телефона", etiket: "На път — системата работи", kategoria: "teren" },
  { src: "/uspehi/gradina-kostyum.jpg", width: 900, height: 1600, alt: "Ивайло Петев между две срещи говори с AI асистента", etiket: "Между две срещи", kategoria: "teren" },
  { src: "/uspehi/prez-1.jpg", width: 1200, height: 676, alt: "Слайд от презентацията на ProMarketing: командният център на бизнеса", etiket: "Презентацията, която показвам на срещите", kategoria: "prezentacia" },
  { src: "/uspehi/prez-2.jpg", width: 1200, height: 676, alt: "Слайд: AI агентите, които работят за теб, и HERMES", etiket: "AI агентите и HERMES", kategoria: "prezentacia" },
  { src: "/uspehi/prez-3.jpg", width: 1200, height: 580, alt: "Слайд: един екран за целия бизнес — демо табло", etiket: "Един екран. Целият бизнес. (демо)", kategoria: "prezentacia" },
];

/* Снимките от конференции и събития (MHC 2026 и следващите) идват тук. */
export const SABITIA: { ime: string; data: string; myasto: string; snimki: Snimka[] }[] = [];

export const redChisla = () => `Данни от нашия CRM и Meta · към ${KAM_DATA}`;
