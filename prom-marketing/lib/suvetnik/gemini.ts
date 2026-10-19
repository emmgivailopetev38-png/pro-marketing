import "server-only";

// Gemini през REST (без SDK). Бързият модел върви с минимално мислене, за да
// излезе „КАЖИ“ за под секунда; ако моделът не приема настройката — без нея.
const API = "https://generativelanguage.googleapis.com/v1beta/models";

export const BARZ_MODEL = process.env.SUVETNIK_MODEL || "gemini-3.6-flash";
export const DALBOK_MODEL = process.env.SUVETNIK_MODEL_DALBOK || "gemini-3.8-flash";
const REZERVNI = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash"];

export class GeminiGreshka extends Error {
  constructor(message: string, public status = 502) {
    super(message);
    this.name = "GeminiGreshka";
  }
}

export function geminiKlyuch() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

interface Opcii {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  mislene?: "minimal" | "low" | "medium" | "high" | null;
  json?: boolean;
  signal?: AbortSignal;
}

function tyalo(o: Opcii, sMislene: boolean) {
  const generationConfig: Record<string, unknown> = { maxOutputTokens: o.maxTokens ?? 600 };
  if (sMislene && o.mislene) generationConfig.thinkingConfig = { thinkingLevel: o.mislene };
  if (o.json) generationConfig.responseMimeType = "application/json";
  return JSON.stringify({
    systemInstruction: { parts: [{ text: o.system }] },
    contents: [{ role: "user", parts: [{ text: o.user }] }],
    generationConfig,
  });
}

async function zayavka(o: Opcii, metod: "streamGenerateContent" | "generateContent"): Promise<Response> {
  const klyuch = geminiKlyuch();
  if (!klyuch) throw new GeminiGreshka("Липсва GEMINI_API_KEY във Vercel.", 503);
  const modeli = [o.model ?? BARZ_MODEL, ...REZERVNI.filter((m) => m !== (o.model ?? BARZ_MODEL))];
  let posledna = "";
  for (const model of modeli) {
    for (const sMislene of [true, false]) {
      if (!sMislene && !o.mislene) break;
      const url = `${API}/${encodeURIComponent(model)}:${metod}${metod === "streamGenerateContent" ? "?alt=sse" : ""}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": klyuch },
        body: tyalo(o, sMislene),
        signal: o.signal,
        cache: "no-store",
      });
      if (r.ok) return r;
      posledna = `${r.status} ${(await r.text().catch(() => "")).slice(0, 300)}`;
      if (r.status === 401 || r.status === 403) throw new GeminiGreshka("Ключът GEMINI_API_KEY не е валиден.", 503);
      if (r.status === 429) throw new GeminiGreshka("Gemini: лимитът на безплатния ключ е стигнат за момента.", 429);
      if (r.status === 400 && sMislene && /thinking/i.test(posledna)) continue;
      if (r.status === 404 || (r.status === 400 && /model/i.test(posledna))) break;
      throw new GeminiGreshka(`Gemini върна ${posledna}`);
    }
  }
  throw new GeminiGreshka(`Няма достъпен модел: ${posledna}`);
}

function tekstOt(chunk: unknown): string {
  const c = chunk as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> };
  return (c.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("");
}

/** Поток от парчета текст. */
export async function* potok(o: Opcii): AsyncGenerator<string> {
  const r = await zayavka(o, "streamGenerateContent");
  const reader = r.body?.getReader();
  if (!reader) return;
  const dec = new TextDecoder();
  let bufer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bufer += dec.decode(value, { stream: true });
    let i: number;
    while ((i = bufer.indexOf("\n")) >= 0) {
      const red = bufer.slice(0, i).trim();
      bufer = bufer.slice(i + 1);
      if (!red.startsWith("data:")) continue;
      const json = red.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      let parche: unknown;
      try {
        parche = JSON.parse(json);
      } catch {
        continue; // всяко SSE събитие е един цял JSON ред; счупен ред се прескача
      }
      const t = tekstOt(parche);
      if (t) yield t;
    }
  }
}

/** Цял отговор наведнъж (за обобщението в края). */
export async function cyal(o: Opcii): Promise<string> {
  const r = await zayavka(o, "generateContent");
  return tekstOt(await r.json());
}
