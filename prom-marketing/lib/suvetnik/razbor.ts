// Разчитане на отговора на модела. Форматът е ред по ред с етикети, за да може
// „КАЖИ“ да се покаже, докато останалото още пристига.
import { ETAPI, PREVENCII, TONOVE, type EtapId, type Podskazka, type PrevenciaId, type TonId } from "./types";

const ETIKETI: Record<string, keyof Podskazka> = {
  "КАЖИ": "kazhi",
  "ТОН": "ton",
  "ТЕХНИКА": "tehnika",
  "ЗАЩО": "zashto",
  "ЕТАП": "etap",
  "КЛИЕНТЪТ": "klientat",
  "ВЪЗРАЖЕНИЕ": "vazrazhenie",
  "БОЛКА": "bolka",
  "ПРЕВЕНЦИЯ": "prevencia",
  "ВНИМАВАЙ": "vnimavai",
  "СЛЕДВАЩО": "sledvashto",
  "ГРЕШКА": "greshka",
};

const RED = new RegExp(`^\\s*[*_#>\\-\\s]*(${Object.keys(ETIKETI).join("|")})[*_\\s]*[:：]\\s*(.*)$`, "u");

/** Разчита натрупания досега текст. Работи и с недовършен последен ред. */
export function razcheti(tekst: string): Podskazka {
  const izhod: Podskazka = {};
  let tekushto: keyof Podskazka | null = null;
  for (const surov of tekst.replace(/\r/g, "").split("\n")) {
    const m = surov.match(RED);
    if (m) {
      tekushto = ETIKETI[m[1]];
      izhod[tekushto] = chisti(m[2]);
    } else if (tekushto && surov.trim()) {
      izhod[tekushto] = chisti(`${izhod[tekushto] ?? ""} ${surov}`);
    }
  }
  return izhod;
}

function chisti(s: string) {
  return s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

/** „—“, „-“, „няма“ и подобни значат празно поле. */
export function prazno(s?: string) {
  if (!s) return true;
  const t = s.trim().toLowerCase();
  return t === "" || t === "-" || t === "—" || t === "–" || t === "няма" || t === "не" || t === "n/a";
}

export interface TonInfo {
  id: TonId | null;
  emoji: string;
  cvyat: string;
  dostavka: string;
}

export function tonInfo(ton?: string): TonInfo {
  const t = (ton ?? "").toUpperCase();
  const id = (Object.keys(TONOVE) as TonId[]).find((k) => t.includes(k))
    ?? (t.includes("СПОКО") ? "СПОКОЕН-УВЕРЕН" : t.includes("УВЕРЕН") ? "СПОКОЕН-УВЕРЕН" : t.includes("ЗАИНТЕРЕС") ? "ЛЮБОПИТЕН" : null);
  const dostavka = (ton ?? "")
    .replace(/^[^\p{L}]*/u, "")
    .replace(id ? new RegExp(id, "i") : /^$/, "")
    .replace(/^[\s·:,\-–—]+/, "")
    .trim();
  return id
    ? { id, emoji: TONOVE[id].emoji, cvyat: TONOVE[id].cvyat, dostavka }
    : { id: null, emoji: "🗣", cvyat: "slate", dostavka: (ton ?? "").trim() };
}

const ETAP_DUMI: Array<[EtapId, RegExp]> = [
  ["SVARZVANE", /свързв|рамк|агенд|откри/i],
  ["SITUACIA", /ситуац|картин|текущ/i],
  ["BOLKA", /болк|проблем/i],
  ["PREVENCIA", /превенц/i],
  ["CEL", /цел|решени[ея]|идентичн|бъдеще/i],
  ["POSLEDSTVIA", /последств|последиц|отнем/i],
  ["REZYUME", /резюм|обобщ/i],
  ["POLZI", /полз|презент/i],
  ["ZATVARYANE", /затвар|плащ|цена|инвест|линк/i],
];

export function etapOt(s?: string): EtapId | undefined {
  if (!s) return undefined;
  const pryako = ETAPI.find((e) => s.toUpperCase().includes(e.id));
  if (pryako) return pryako.id;
  return ETAP_DUMI.find(([, re]) => re.test(s))?.[0];
}

const PREV_DUMI: Array<[PrevenciaId, RegExp]> = [
  ["reshavasht", /реша|решав|партн|съдруж|съпруг|жена|мъж/i],
  ["byudzhet", /бюджет|инвест|пари|цена/i],
  ["spiralo", /спир|спряло|вярван|отлаг/i],
  ["momentat", /защо сега|защо точно сега|промени(ло)? се|какво се е промени|моментът/i],
  ["sravnenie", /сравн|критер|оферт|конкур/i],
  ["doverie", /довер|опит|измам|агенц|фрийл/i],
];

export function prevenciiOt(s?: string): PrevenciaId[] {
  if (prazno(s)) return [];
  const ids = PREV_DUMI.filter(([, re]) => re.test(s!)).map(([id]) => id);
  return Array.from(new Set(ids)).filter((id) => PREVENCII.some((p) => p.id === id));
}
