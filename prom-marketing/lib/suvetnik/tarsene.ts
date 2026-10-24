// Търсене на дословни реплики на Георги (682-те карти от тренажора + златните
// реплики от сесиите), които пасват на това, което клиентът току-що каза.
// BM25 с грубо „стъбло“ — българските окончания се режат до 6 букви.
import rawCards from "@/data/trening/karti.json";
import rawRepliki from "@/data/suvetnik/repliki.json";

export interface Izvor {
  id: string;
  tema: string;
  zaglavie: string;
  tekst: string;
  ton?: string;
  koga?: string;
}

interface KartaJson { id: string; tema: string; zaglavie: string; vapros?: string; otgovor: string }
interface ReplikaJson { id: string; tehnika: string; koga: string; kazhi: string; ton?: string; zashto?: string; iztochnik?: string }

const STOP = new Set(
  ("и в на за да се не че от с по ли е са ще то си ми ти те го му ни ви ги им как какво кое кой коя кои " +
   "това този тази тези там тук така но или а ако като при до във със без през след преди още вече само " +
   "много малко има няма бъде бил била било били съм си сме сте мен теб нас вас него нея тях един една едно " +
   "нещо нещата всичко всички също просто точно сега тогава защото когато където дали")
    .split(" "),
);

export function tokeni(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 6 ? w.slice(0, 6) : w));
}

interface Indeks {
  docs: Izvor[];
  tf: Map<string, number>[];
  dlina: number[];
  df: Map<string, number>;
  sredna: number;
}

let kesh: Indeks | null = null;

function izgradi(): Indeks {
  const docs: Izvor[] = [
    ...(rawCards as KartaJson[]).map((k) => ({
      id: k.id,
      tema: k.tema,
      zaglavie: k.zaglavie,
      tekst: k.otgovor.replace(/\s+/g, " ").trim(),
    })),
    ...(rawRepliki as ReplikaJson[]).map((r) => ({
      id: r.id,
      tema: r.tehnika,
      zaglavie: r.koga,
      tekst: r.kazhi,
      ton: r.ton,
      koga: r.koga,
    })),
  ].filter((d) => d.tekst.length > 8);

  const tf: Map<string, number>[] = [];
  const dlina: number[] = [];
  const df = new Map<string, number>();
  for (const d of docs) {
    const t = tokeni(`${d.zaglavie} ${d.zaglavie} ${d.tekst} ${d.koga ?? ""}`);
    const m = new Map<string, number>();
    for (const w of t) m.set(w, (m.get(w) ?? 0) + 1);
    tf.push(m);
    dlina.push(t.length);
    for (const w of m.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  }
  const sredna = dlina.reduce((a, b) => a + b, 0) / Math.max(1, dlina.length);
  return { docs, tf, dlina, df, sredna };
}

/** Най-подходящите дословни реплики за заявката. */
export function tarsi(zayavka: string, n = 6, temi?: string[]): Izvor[] {
  kesh ??= izgradi();
  const { docs, tf, dlina, df, sredna } = kesh;
  const q = tokeni(zayavka);
  if (!q.length) return [];
  const N = docs.length;
  const k1 = 1.4;
  const b = 0.7;
  const rezultati: Array<{ i: number; s: number }> = [];
  for (let i = 0; i < N; i++) {
    if (temi && !temi.some((t) => docs[i].tema.toLowerCase().includes(t.toLowerCase()))) continue;
    let s = 0;
    for (const w of q) {
      const f = tf[i].get(w);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * dlina[i]) / sredna)));
    }
    if (s > 0) rezultati.push({ i, s });
  }
  rezultati.sort((a, b2) => b2.s - a.s);
  const vidyani = new Set<string>();
  const izhod: Izvor[] = [];
  for (const { i, s } of rezultati) {
    if (s < 2.2) break;
    const d = docs[i];
    const klyuch = d.tekst.slice(0, 60);
    if (vidyani.has(klyuch)) continue;
    vidyani.add(klyuch);
    izhod.push(d);
    if (izhod.length >= n) break;
  }
  return izhod;
}

export function broiIzvori() {
  kesh ??= izgradi();
  return kesh.docs.length;
}
