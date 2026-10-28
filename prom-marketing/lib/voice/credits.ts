/**
 * Свършат ли кредитите в ElevenLabs, агентът не проговаря изобщо: разговорът
 * пада още при свързването с `quota_exceeded`, а човекът гледа мълчащ бутон.
 * Така беше от 27.10.2026 21:03 до подновяването на 29.10 — нов лийд от
 * рекламата опита седем пъти, а никой не разбра до сутринта.
 *
 * Пазачът гледа последните разговори на агента. Паднал ли е последният от
 * квота преди по-малко от PROBE_MINUTES, следващият човек не се пуска към
 * мълчанието, а към календара. След PROBE_MINUTES един разговор пак минава —
 * иначе при върнати кредити щяхме да блокираме вечно: нов разговор нямаше
 * да се случи, за да покаже, че всичко е наред.
 *
 * Всяка грешка (ключ, права, мрежа, формат) → „unknown" и разговорът МИНАВА.
 * По-скъпо е да спрем истински клиент, отколкото да пуснем един към тишината.
 */

const API = "https://api.elevenlabs.io/v1/convai/conversations";
const PROBE_MINUTES = 30;
/** Предишен провал по-стар от това е друга „серия" — пак се алармира. */
const NEW_OUTAGE_HOURS = 6;
const CACHE_MS = 60_000;

export type CreditsState = "ok" | "out" | "unknown";

export interface CreditsCheck {
  state: CreditsState;
  /** Първият провал след работещ период — за него се праща аларма. */
  freshOutage: boolean;
}

interface ListedConversation {
  conversation_id: string;
  start_time_unix_secs: number;
  status: string;
}

/** Чистата преценка — отделена, за да се тества без мрежа. */
export function judgeCredits(
  latest: ListedConversation | undefined,
  previous: ListedConversation | undefined,
  latestIsQuota: boolean,
  nowMs: number
): CreditsCheck {
  if (!latest || latest.status !== "failed" || !latestIsQuota) return { state: "ok", freshOutage: false };
  const ageMin = (nowMs - latest.start_time_unix_secs * 1000) / 60_000;
  if (ageMin > PROBE_MINUTES) return { state: "ok", freshOutage: false };
  const prevAgeH = previous ? (nowMs - previous.start_time_unix_secs * 1000) / 3_600_000 : Infinity;
  const freshOutage = !previous || previous.status !== "failed" || prevAgeH > NEW_OUTAGE_HOURS;
  return { state: "out", freshOutage };
}

export function isQuotaReason(reason: unknown): boolean {
  return typeof reason === "string" && /quota_exceeded|run out of credits/i.test(reason);
}

let cache: { at: number; agentId: string; result: CreditsCheck } | null = null;

export async function checkAgentCredits(agentId: string): Promise<CreditsCheck> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { state: "unknown", freshOutage: false };
  const now = Date.now();
  // Алармата се праща само от първата проверка — кешираният отговор не я повтаря.
  if (cache && cache.agentId === agentId && now - cache.at < CACHE_MS) {
    return { ...cache.result, freshOutage: false };
  }
  try {
    const headers = { "xi-api-key": key };
    const res = await fetch(`${API}?agent_id=${encodeURIComponent(agentId)}&page_size=2`, {
      headers,
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) return { state: "unknown", freshOutage: false };
    const data = (await res.json()) as { conversations?: ListedConversation[] };
    const [latest, previous] = data.conversations ?? [];

    let latestIsQuota = false;
    if (latest?.status === "failed") {
      const det = await fetch(`${API}/${encodeURIComponent(latest.conversation_id)}`, {
        headers,
        signal: AbortSignal.timeout(2500),
        cache: "no-store",
      });
      if (!det.ok) return { state: "unknown", freshOutage: false };
      const body = (await det.json()) as { metadata?: { error?: { reason?: string } | null } };
      latestIsQuota = isQuotaReason(body.metadata?.error?.reason);
    }

    const result = judgeCredits(latest, previous, latestIsQuota, now);
    cache = { at: now, agentId, result };
    return result;
  } catch (err) {
    console.error("[voice/credits] проверката падна, пускам разговора", err);
    return { state: "unknown", freshOutage: false };
  }
}

/** Какво чува/вижда човекът, когато агентът е без кредити. */
export const CREDITS_SPOKEN =
  "Гласовото демо почива точно сега. Данните ти са при нас — запази си час направо в календара на Ивайло, " +
  "безплатна среща до 45 минути.";
