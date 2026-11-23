/* ---------------------------------------------------------------------------
   Томболата в края на обучението „Допълнителен доход с AI“ (подарък №2 —
   „30 минути лично с Ивайло“ за трима). Тегли се на живо от /admin/tombola.

   izvadiImena: приема списък по едно име на ред ИЛИ запазения чат от Zoom
   („19:45:12 From Мария Иванова to Everyone:“) и връща уникалните имена.
   sluchaen: честно случайно число през crypto (без изкривяване по модул).
--------------------------------------------------------------------------- */

const ZOOM_NOV = /^\s*\d{1,2}:\d{2}(?::\d{2})?\s+(?:From|От)\s+(.+?)\s+(?:to|до|към)\s+[^:]+:.*$/i;
const ZOOM_STAR = /^\s*\d{1,2}:\d{2}(?::\d{2})?\s+(?:From|От)\s+(.+?)\s*:.*$/i;
const NASTAVKA = /\s*\((?:host|co-host|me|guest|домакин|съдомакин|аз|гост)\)\s*$/i;
const NE_SA_IMENA = new Set(["me", "аз", "everyone", "всички"]);

function chisto(ime: string): string {
  return ime.replace(NASTAVKA, "").replace(/\s+/g, " ").trim();
}

export function izvadiImena(tekst: string): string[] {
  const out: string[] = [];
  const vidyani = new Set<string>();
  const dobavi = (raw: string) => {
    const ime = chisto(raw);
    if (!ime || ime.length > 60) return;
    const kluch = ime.toLocaleLowerCase("bg-BG");
    if (vidyani.has(kluch) || NE_SA_IMENA.has(kluch)) return;
    vidyani.add(kluch);
    out.push(ime);
  };

  for (const red of tekst.split(/\r?\n/)) {
    if (!red.trim()) continue;
    // Тялото на съобщение в запазения чат на Zoom започва с табулация — не е име.
    if (/^\t/.test(red)) continue;
    const nov = red.match(ZOOM_NOV);
    if (nov) {
      dobavi(nov[1]);
      continue;
    }
    const star = red.match(ZOOM_STAR);
    if (star) {
      dobavi(star[1]);
      continue;
    }
    // Обикновен списък: по едно име на ред (или няколко, разделени с „;“).
    for (const chast of red.split(";")) dobavi(chast);
  }
  return out;
}

/** Честно случайно цяло число в [0, n) — crypto.getRandomValues + отхвърляне. */
export function sluchaen(n: number, rnd: (buf: Uint32Array) => Uint32Array = (b) => crypto.getRandomValues(b)): number {
  if (!Number.isInteger(n) || n <= 0) throw new Error("n трябва да е цяло число > 0");
  const granica = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    rnd(buf);
    if (buf[0] < granica) return buf[0] % n;
  }
}
