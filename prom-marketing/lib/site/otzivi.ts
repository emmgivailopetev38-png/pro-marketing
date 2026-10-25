/* ---------------------------------------------------------------------------
   Истинските отзиви за началната страница (25.10.2026).

   Всеки цитат е дословен — от WhatsApp, имейл или Viber, както го е написал
   човекът (с неговите правопис и препинателни знаци). Нищо не е перифразирано,
   нищо не е измислено. Може само да се съкрати с „…“, не да се променя.

   saglasie — какво показваме за автора:
     'da'       → пълно име + фирма („Иван Йовчев, Homers Houses“)
     'chaka'    → само първо име + дейност („Иван · строител на къщи“),
                  докато не каже писмено „да“ за името
     'anonimno' → „клиент, онлайн магазин · менторска програма“ — човекът
                  сам е поискал името да остане скрито
   Смяна: само това поле на отзива. Нищо друго не се пипа.

   CHISLA — истински броеве от Supabase (bskywdgxbfdnxqzpffxm) с дата:
     contacts.stage='won' · bookings.status='completed' от 21.08.2026 ·
     recurring_services.active=true. Обновяват се на ръка заедно с `kam`.
--------------------------------------------------------------------------- */

export type Saglasie = "da" | "chaka" | "anonimno";

export type Otziv = {
  id: string;
  /** Дословният текст на отзива. */
  text: string;
  kanal: "WhatsApp" | "имейл" | "Viber";
  /** Както да се покаже под цитата. */
  data: string;
  /** Пълното име на човека (показва се само при saglasie === 'da'). */
  ime: string;
  /** Първото/галеното име (показва се при 'chaka'). */
  parvoIme: string;
  /** Фирмата, както тя сама се пише (само при 'da'). */
  biznes: string;
  /** Дейността — човешки, с малка буква („строител на къщи“). */
  deinost: string;
  /** Услугата, която сме правили за него. */
  usluga: string;
  saglasie: Saglasie;
  /** Снимка на съобщението в public/, ако има. */
  snimka?: { src: string; width: number; height: number };
  /** Втори, независим канал от същия човек — кратък ред под цитата. */
  dopalnenie?: string;
};

export const OTZIVI: Otziv[] = [
  {
    id: "homers-2026-10-25",
    text:
      "и да знаеш не очаквах толкова добри видеа и идеи от AI изненадан съм много приятно естествено той не ги прави сам Поздравления и на теб за насоките. супер дребни корекции добавям за 5 мин. одобрих над 50 видеа за целия месец, Топ благодаря!",
    kanal: "WhatsApp",
    data: "25.10.2026",
    ime: "Иван Йовчев",
    parvoIme: "Иван",
    biznes: "Homers Houses",
    deinost: "строител на къщи",
    usluga: "видеа и реклама",
    saglasie: "chaka",
    snimka: { src: "/otzivi/homers-whatsapp-2026-10-25.jpg", width: 1320, height: 623 },
    dopalnenie: "имейл, същия ден: „…ще напомпят профилете здраво.“",
  },
  {
    id: "mihail-2026-09",
    text: "Мисля, че тепърва ще науча още доста неща от теб и ще направим много яки неща.",
    kanal: "Viber",
    data: "септември 2026",
    ime: "Михаил Михов",
    parvoIme: "Михаил",
    biznes: "Д Бест Буукс",
    deinost: "книги",
    usluga: "менторска програма",
    saglasie: "chaka",
  },
  {
    id: "ekomers-2026-09",
    text:
      "Помогна ми да се науча как се работя с claude code и да автоматизирам доста в процеси в бизнеса ми, което ми спестява много време и ми дава възможност да скалирам повече. Благодаря!",
    kanal: "Viber",
    data: "септември 2026",
    ime: "",
    parvoIme: "",
    biznes: "",
    deinost: "онлайн магазин",
    usluga: "менторска програма",
    saglasie: "anonimno",
  },
];

/** Редът с автора под цитата — според съгласието. */
export function avtorNaOtziv(o: Otziv): string {
  switch (o.saglasie) {
    case "da":
      return `${o.ime}, ${o.biznes}`;
    case "chaka":
      return `${o.parvoIme} · ${o.deinost}`;
    default:
      return `клиент, ${o.deinost} · ${o.usluga}`;
  }
}

/** Истински броеве от Supabase, проверени на датата `kam`. */
export const CHISLA = {
  klienti: 21,
  sreshtiOtAvgust: 45,
  mesechniUslugi: 7,
  kam: "25.10.2026",
} as const;

export function redSChisla(c = CHISLA): string {
  return `${c.klienti} клиента · ${c.sreshtiOtAvgust} проведени срещи от август · ${c.mesechniUslugi} активни месечни услуги · към ${c.kam}`;
}
