// Съветникът на живо — общите типове между браузъра и сървъра.

/** Кой говори: И = Ивайло (микрофонът), К = клиентът (звукът от таба), ? = не е ясно (само микрофон). */
export type Govoreshht = "I" | "K" | "?";

export interface Replika {
  id: string;
  s: Govoreshht;
  t: string;
  /** Милисекунди от началото на разговора. */
  at: number;
}

/** Етапите по „Моят скрипт“ на Георги, в реда на разговора. */
export const ETAPI = [
  { id: "SVARZVANE", ime: "Свързване" },
  { id: "SITUACIA", ime: "Ситуация" },
  { id: "BOLKA", ime: "Болка" },
  { id: "PREVENCIA", ime: "Превенция" },
  { id: "CEL", ime: "Цел" },
  { id: "POSLEDSTVIA", ime: "Последствия" },
  { id: "REZYUME", ime: "Резюме" },
  { id: "POLZI", ime: "Ползи" },
  { id: "ZATVARYANE", ime: "Затваряне" },
] as const;
export type EtapId = (typeof ETAPI)[number]["id"];

/** Възраженията, които се обират ПРЕДИ края (превенция). */
export const PREVENCII = [
  { id: "reshavasht", ime: "Кой решава", ikona: "👥" },
  { id: "byudzhet", ime: "Готовност да инвестира", ikona: "💶" },
  { id: "spiralo", ime: "Какво го е спирало досега", ikona: "🧠" },
  { id: "momentat", ime: "Защо сега", ikona: "⏳" },
  { id: "sravnenie", ime: "Критерий за избор", ikona: "🔍" },
  { id: "doverie", ime: "Лош опит / доверие", ikona: "🛡" },
] as const;
export type PrevenciaId = (typeof PREVENCII)[number]["id"];

/** Тоновете, с които съветникът казва КАК да се изрече репликата. */
export const TONOVE = {
  "ЛЮБОПИТЕН": { emoji: "🤔", cvyat: "sky" },
  "ЕМПАТИЧЕН": { emoji: "🤝", cvyat: "emerald" },
  "СЪЖАЛЯВАЩ": { emoji: "😔", cvyat: "violet" },
  "СПОКОЕН-УВЕРЕН": { emoji: "😌", cvyat: "cyan" },
  "ТВЪРД-ЯСЕН": { emoji: "🎯", cvyat: "amber" },
  "ИЗНЕНАДАН": { emoji: "😮", cvyat: "orange" },
  "ТОПЪЛ": { emoji: "😊", cvyat: "pink" },
  "ВОДЕЩ": { emoji: "🧭", cvyat: "blue" },
  "МЪЛЧИ": { emoji: "🤫", cvyat: "slate" },
} as const;
export type TonId = keyof typeof TONOVE;

export interface Brif {
  klient?: string;
  biznes?: string;
  cel?: string;
  oferta?: string;
  /** „ти“ или „Вие“. */
  obrashtenie?: "ти" | "Вие";
  belezhki?: string;
}

export interface SastoyanieRazgovor {
  etap?: EtapId;
  bolki: string[];
  prevencia: Partial<Record<PrevenciaId, boolean>>;
  vazrazheniya: string[];
  poslednoKazano: string[];
}

export type Povod = "klient" | "rachno" | `vazrazhenie:${string}` | "demo";

export interface HintZaiavka {
  rejim: "online" | "mikrofon";
  brif: Brif;
  sastoyanie: SastoyanieRazgovor;
  replikI: Replika[];
  povod: Povod;
}

/** Една подсказка, разчетена ред по ред от отговора на модела. */
export interface Podskazka {
  kazhi?: string;
  ton?: string;
  tehnika?: string;
  zashto?: string;
  etap?: string;
  klientat?: string;
  vazrazhenie?: string;
  bolka?: string;
  prevencia?: string;
  vnimavai?: string;
  sledvashto?: string;
  /** Сървърът е паднал по средата на потока. */
  greshka?: string;
}

export interface Obobshtenie {
  rezyume: string;
  bolki: string[];
  cel: string;
  vazrazheniya: { tip: string; obrano: boolean; kak: string }[];
  prevencia_propusnata: string[];
  sledvashta_stapka: string;
  data_chas: string;
  samoanaliz: { po_barzo_do_problema: string; zadalbochavane: string; predotvratyavane: string };
  silni: string[];
  za_trenirovka: string[];
  crm_belezhka: string;
}
