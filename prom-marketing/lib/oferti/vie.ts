/**
 * „ти“ → „Вие“ за офертите на „Вие“ (09.11.2026).
 * Текстовете в каталога и шаблоните са писани на „ти“; когато офертата е на „Вие“,
 * страницата, PDF-ът и имейлът минават оттук, за да не излиза „бизнеса ти“ в учтива оферта.
 * Пипат се САМО формите на „ти“ (теб, твоят…, глаголите на -ш, „сам“ до тях) — текст,
 * писан на „Вие“, минава непроменен. Записаното в базата не се пипа — превръщането е при показване.
 */

const WORD = /[\p{L}\p{N}]+(?:[-‑][\p{L}\p{N}]+)*/gu;

/** Местоименията — без „те“ (то е и „те“ = „they“, и членът в „4-те“). */
const PRON: Record<string, string> = {
  теб: "Вас",
  тебе: "Вас",
  твой: "Ваш",
  твоя: "Вашия",
  твоят: "Вашият",
  твоята: "Вашата",
  твоето: "Вашето",
  твоите: "Вашите",
  твое: "Ваше",
  твои: "Ваши",
};

/** Думи на -аш/-яш/-иш/-еш, които НЕ са глаголи във 2 л. ед. ч. */
const NOT_VERB = new Set(["наш", "ваш", "кеш", "финиш", "гуляш", "бакшиш", "фетиш", "кукиш", "шиш", "мишмаш", "кураж", "камуфлаж"]);

/** Думите след „ти“, които показват, че е подлог („ти и ние“, „без ти да звъниш“). */
const SUBJ_NEXT = new Set(["и", "да", "сам", "сама", "самият", "ще", "не", "също", "вече", "сега", "пак", "лично"]);

/** Кратките местоимения, през които „сам“ стига до глагола: „сам си строиш“, „сам го правиш“. */
const CLITIC = new Set(["си", "се", "го", "ги", "я", "му", "й", "ѝ", "ми", "ни", "им"]);

/** Цели изрази, които думата по дума не хваща правилно. */
const PHRASES: Array<[RegExp, string]> = [
  [/(^|[^\p{L}])теб те няма(?![\p{L}])/gu, "$1Вас Ви няма"],
  [/(^|[^\p{L}])когато си готов(?:а)?(?![\p{L}])/gu, "$1когато сте готови"],
  [/(^|[^\p{L}])ли си готов(?:а)?(?![\p{L}])/gu, "$1ли сте готови"],
  [/(^|[^\p{L}])за година сам(?:а)?(?![\p{L}])/gu, "$1за година сами"],
  // „си“ = „съм“ във 2 л. (не възвратното „си“)
  [/(^|[^\p{L}])докъде си(?![\p{L}])/gu, "$1докъде сте"],
  [/(^|[^\p{L}])къде си(?![\p{L}])/gu, "$1къде сте"],
  [/(^|[^\p{L}])ако си готов(?:а)?(?![\p{L}])/gu, "$1ако сте готови"],
];

export function isVerb2(word: string): boolean {
  const l = word.toLowerCase();
  return l.length >= 4 && /[аяие]ш$/.test(l) && !NOT_VERB.has(l);
}

function keepCase(src: string, out: string): string {
  // „Вие“, „Ваш…“ винаги с главна; глаголите пазят главната буква от началото на изречението
  return src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out;
}

interface Tok {
  w: string;
  start: number;
  end: number;
}

/** Превръща един текст от „ти“ във „Вие“. Текст без форми на „ти“ се връща същият. */
export function kamVie(text: string): string {
  if (!text) return text;
  let s = text;
  for (const [re, to] of PHRASES) s = s.replace(re, to);

  const toks: Tok[] = [];
  for (const m of s.matchAll(WORD)) toks.push({ w: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  if (toks.length === 0) return s;

  const between = (a: number, b: number) => s.slice(toks[a].end, toks[b].start);
  const onlySpace = (a: number, b: number) => /^[  ]+$/.test(between(a, b));
  const out = toks.map((t) => t.w);
  const changed = new Array<boolean>(toks.length).fill(false);

  // 1) глаголите и местоименията
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i].w;
    const l = w.toLowerCase();
    if (PRON[l]) {
      out[i] = PRON[l];
      changed[i] = true;
    } else if (isVerb2(w)) {
      out[i] = w.slice(0, -1) + "те";
      changed[i] = true;
    }
  }
  // 2) „ти“: подлог → „Вие“, кратка форма → „Ви“
  for (let i = 0; i < toks.length; i++) {
    const l = toks[i].w.toLowerCase();
    if (l !== "ти") continue;
    const next = i + 1 < toks.length ? toks[i + 1].w : "";
    const prev = i > 0 ? toks[i - 1].w : "";
    const sentenceStart = i === 0 || /[.!?…:]\s*$/.test(s.slice(0, toks[i].start));
    const subject =
      sentenceStart ||
      (next && (isVerb2(next) || SUBJ_NEXT.has(next.toLowerCase())) && onlySpace(i, i + 1)) ||
      (prev && isVerb2(prev) && onlySpace(i - 1, i));
    out[i] = subject ? "Вие" : "Ви";
    changed[i] = true;
  }
  // 3) „сам/сама“ до глагол на „ти“ → „сами“ (през кратките местоимения: „сам си строиш“)
  const nearVerb = (i: number, dir: 1 | -1): boolean => {
    let prevIdx = i;
    for (let j = i + dir, steps = 0; j >= 0 && j < toks.length && steps < 3; j += dir, steps++) {
      const gap = dir > 0 ? between(prevIdx, j) : between(j, prevIdx);
      if (/[.!?;:—–]/.test(gap)) return false;
      const lw = toks[j].w.toLowerCase();
      if (isVerb2(toks[j].w) || (lw === "ти" && out[j] === "Вие")) return true;
      if (!CLITIC.has(lw)) return false;
      prevIdx = j;
    }
    return false;
  };
  for (let i = 0; i < toks.length; i++) {
    const l = toks[i].w.toLowerCase();
    if (l !== "сам" && l !== "сама") continue;
    if (nearVerb(i, -1) || nearVerb(i, 1)) {
      out[i] = keepCase(toks[i].w, "сами");
      changed[i] = true;
    }
  }
  // 4) „в“ пред „Вас/Ваш…/Ви/Вие“ → „във“
  for (let i = 0; i + 1 < toks.length; i++) {
    const l = toks[i].w;
    if ((l === "в" || l === "В") && changed[i + 1] && /^В/.test(out[i + 1]) && onlySpace(i, i + 1)) {
      out[i] = l === "В" ? "Във" : "във";
      changed[i] = true;
    }
  }

  if (!changed.some(Boolean)) return s;
  let res = "";
  let last = 0;
  for (let i = 0; i < toks.length; i++) {
    res += s.slice(last, toks[i].start) + out[i];
    last = toks[i].end;
  }
  return res + s.slice(last);
}

export function kamVieAll(list: string[] | undefined): string[] | undefined {
  return list ? list.map(kamVie) : list;
}
