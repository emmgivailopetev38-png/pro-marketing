// Сглобява съобщението към модела: бриф, състояние, разговорът и дословните реплики.
import { z } from "zod";
import { PREVENCII, type HintZaiavka, type Replika } from "./types";
import { VAZRAZHENIYA, vazrazhenieOt } from "./biblioteka";
import { tarsi, type Izvor } from "./tarsene";

// Дългите полета се режат, вместо да чупят заявката — една дълга подсказка
// не бива да спре съветника до края на разговора.
const tekst = (n: number) => z.string().transform((x) => x.slice(0, n));
const spisak = <T extends z.ZodTypeAny>(el: T, n: number) => z.array(el).transform((a) => a.slice(-n));

const replika = z.object({
  id: tekst(64),
  s: z.enum(["I", "K", "?"]),
  t: tekst(4000),
  at: z.number().nonnegative(),
});

export const hintSchema = z.object({
  rejim: z.enum(["online", "mikrofon"]),
  brif: z.object({
    klient: tekst(200).optional(),
    biznes: tekst(500).optional(),
    cel: tekst(500).optional(),
    oferta: tekst(500).optional(),
    obrashtenie: z.enum(["ти", "Вие"]).optional(),
    belezhki: tekst(1500).optional(),
  }),
  sastoyanie: z.object({
    etap: tekst(40).optional(),
    bolki: spisak(tekst(300), 20),
    prevencia: z.record(z.string(), z.boolean()),
    vazrazheniya: spisak(tekst(200), 20),
    poslednoKazano: spisak(tekst(400), 5),
  }),
  replikI: spisak(replika, 400),
  povod: tekst(80),
});

const ETIKET = { I: "И", K: "К", "?": "?" } as const;

/** Последните реплики, съкратени отпред до ~7000 знака, с маркер за минутата. */
export function razgovorTekst(replikI: Replika[], limit = 7000): string {
  let ot = replikI.length;
  let dalzhina = 0;
  while (ot > 0 && dalzhina + replikI[ot - 1].t.length + 4 <= limit) {
    ot--;
    dalzhina += replikI[ot].t.length + 4;
  }
  const redove: string[] = ot > 0 ? [`(… още ${ot} по-стари реплики)`] : [];
  let minuta = -1;
  for (const r of replikI.slice(ot)) {
    const m = Math.floor(r.at / 60000);
    if (m !== minuta && (minuta < 0 || m - minuta >= 2)) {
      redove.push(`[мин. ${m}]`);
      minuta = m;
    }
    redove.push(`${ETIKET[r.s]}: ${r.t.trim()}`);
  }
  return redove.join("\n");
}

function poslednaNaKlienta(replikI: Replika[]) {
  for (let i = replikI.length - 1; i >= 0; i--) if (replikI[i].s !== "I") return replikI[i].t;
  return "";
}

export function izvoriZa(z: HintZaiavka): Izvor[] {
  const posledni = z.replikI.slice(-3).map((r) => r.t).join(" ");
  const klient = poslednaNaKlienta(z.replikI);
  const vId = z.povod.startsWith("vazrazhenie:") ? z.povod.slice("vazrazhenie:".length) : vazrazhenieOt(klient)?.id;
  const veriga = vId ? VAZRAZHENIYA.find((v) => v.id === vId) : undefined;
  const zayavka = [klient, klient, posledni, veriga ? `${veriga.ime} ${veriga.signali.join(" ")}` : ""].join(" ");
  return tarsi(zayavka, 6);
}

export function sglobiZayavka(z: HintZaiavka): string {
  const b = z.brif;
  const minuti = Math.round((z.replikI.at(-1)?.at ?? 0) / 60000);
  const prev = PREVENCII.map((p) => `${p.ime} ${z.sastoyanie.prevencia[p.id] ? "✓" : "✗"}`).join(" · ");
  const izvori = izvoriZa(z);
  const povod = z.povod === "klient"
    ? "клиентът току-що завърши реплика"
    : z.povod === "rachno"
      ? "Ивайло натисна „Подскажи“ — иска следващия ход сега"
      : z.povod.startsWith("vazrazhenie:")
        ? `Ивайло натисна бутон „Възражение: ${VAZRAZHENIYA.find((v) => v.id === z.povod.slice(12))?.ime ?? z.povod.slice(12)}“`
        : "демо";

  return [
    "БРИФ:",
    `Клиент: ${b.klient || "—"} · Бизнес: ${b.biznes || "—"} · Иска: ${b.cel || "—"}`,
    `Оферта/цена (само оттук!): ${b.oferta || "— (няма — ако трябва цена, пиши [цената])"} · Обръщение: ${b.obrashtenie || "ти"}`,
    b.belezhki ? `Бележки: ${b.belezhki}` : null,
    "",
    `СЪСТОЯНИЕ: минута ${minuti} · етап досега: ${z.sastoyanie.etap || "СВЪРЗВАНЕ"} · режим: ${z.rejim === "online" ? "онлайн (И и К са разделени)" : "само микрофон — говорещият не е сигурен (?), съди по смисъла"}`,
    `Болки досега: ${z.sastoyanie.bolki.length ? z.sastoyanie.bolki.join(" | ") : "още няма"}`,
    `Превенция: ${prev}`,
    `Възражения досега: ${z.sastoyanie.vazrazheniya.length ? z.sastoyanie.vazrazheniya.join(" | ") : "няма"}`,
    z.sastoyanie.poslednoKazano.length ? `Последните ти подсказки (не ги повтаряй): ${z.sastoyanie.poslednoKazano.join(" | ")}` : null,
    "",
    "РАЗГОВОРЪТ (И = Ивайло, К = клиентът; най-новото е долу):",
    razgovorTekst(z.replikI) || "(още нищо — разговорът започва)",
    "",
    izvori.length
      ? `ДОСЛОВНИ РЕПЛИКИ ОТ ГЕОРГИ, КОИТО МОЖЕ ДА ПАСНАТ:\n${izvori.map((x) => `- [${x.tema} · ${x.zaglavie}] ${x.tekst}`).join("\n")}`
      : null,
    "",
    `ПОВОД: ${povod}.`,
    "Дай СЛЕДВАЩИЯ ход сега — само 11-те реда от формата.",
  ].filter((r): r is string => r !== null).join("\n");
}
