/**
 * Какво е правила Ели (гласовият агент) с лийда — за картата в /ekip.
 *
 * Ивайло (02.11.2026): „хората, които не са вдигнали, затворили са директно
 * или искат по телефона, да му излизат в неговата система“ — клоузърът трябва
 * да вижда с какво влиза. Лийд, когото е докосвала само Ели, си стои в
 * „🆕 Първо обаждане“ (нейните активности не са опит на екипа), но без този
 * ред Георги не може да различи „никой не е звънял“ от „Ели звъня два пъти,
 * той затваря“.
 *
 * Чисти правила, без база — тестват се.
 */

/** Активностите на Ели: `voice_outbound` = набиране, `voice_call` = разговор. */
export const ELI_TYPES = ["voice_outbound", "voice_call"] as const;

export interface EliRow {
  contact_id: string;
  activity_type: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

export interface EliInfo {
  /** Един ред за картата: „🤖 Ели звъня 2 пъти — не вдига · посл. 02.11 07:05“. */
  line: string;
  /** Резюмето на последния разговор от ElevenLabs — Георги чете с какво влиза. */
  summary: string | null;
}

const WHEN = new Intl.DateTimeFormat("bg-BG", {
  timeZone: "Europe/Sofia",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function when(iso: string): string {
  return WHEN.format(new Date(iso)).replace(" г.,", " ·").replace(",", " ·");
}

function dur(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")} мин`;
}

/** Редовете идват по occurred_at НИЗХОДЯЩО (както loadAttempts ги чете). */
export function summarizeEli(rows: EliRow[]): Map<string, EliInfo> {
  const byContact = new Map<string, EliRow[]>();
  for (const r of rows) {
    const list = byContact.get(r.contact_id) ?? [];
    list.push(r);
    byContact.set(r.contact_id, list);
  }

  const out = new Map<string, EliInfo>();
  for (const [id, list] of byContact) {
    const dials = list.filter((r) => r.activity_type === "voice_outbound");
    const call = list.find((r) => r.activity_type === "voice_call");

    if (call) {
      const m = call.metadata ?? {};
      const secs = typeof m.duration_secs === "number" ? m.duration_secs : null;
      // Под ~20 сек не е разговор — човекът е затворил, щом е чул агента.
      const hungUp = secs !== null && secs < 20;
      const failed = m.call_successful === "failure";
      const parts = [
        hungUp ? `🤖 Ели се обади ${when(call.occurred_at)} — затвори веднага` : `🤖 Ели говори с него ${when(call.occurred_at)}`,
        secs !== null && !hungUp ? dur(secs) : null,
        !hungUp && failed ? "без резултат" : null,
      ].filter(Boolean);
      const summary = typeof m.summary === "string" && m.summary.trim() ? m.summary.trim().slice(0, 300) : null;
      out.set(id, { line: parts.join(" · "), summary: hungUp ? null : summary });
      continue;
    }

    if (dials.length > 0) {
      const n = dials.length;
      out.set(id, {
        line: `🤖 Ели звъня ${n === 1 ? "веднъж" : `${n} пъти`} — не вдига · посл. ${when(dials[0].occurred_at)}`,
        summary: null,
      });
    }
  }
  return out;
}
