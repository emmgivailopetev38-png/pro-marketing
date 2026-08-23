import { checkVoiceAuth } from "./auth";
import { callerFromRequest } from "./caller";

/**
 * Двете врати пред всеки гласов инструмент, на едно място.
 *
 * 1. Bearer токенът — „това е нашият агент".
 * 2. Обаждащият се — „и слушалката е вдигната от Ивайло".
 *
 * Отказът заради номер връща 200 с изречение, а не 403. Нарочно: ElevenLabs
 * превръща HTTP грешка в общо „инструментът се провали" и агентът започва да
 * импровизира. При 200 казва точно нашето изречение — „не разпознавам номера".
 */
export type VoiceGuard =
  | { ok: true; via: "web" | "allowlist" | "pin"; caller: string | null }
  | { ok: false; status: number; body: Record<string, unknown> };

export function guardVoice(request: Request, body?: unknown): VoiceGuard {
  const auth = checkVoiceAuth(request);
  if (!auth.ok) {
    return { ok: false, status: 403, body: { error: "Forbidden" } };
  }
  const caller = callerFromRequest(request, body);
  if (!caller.ok) {
    console.warn("[voice/guard] отказан обаждащ се:", caller.reason);
    return { ok: false, status: 200, body: { ok: false, denied: caller.reason, spoken: caller.spoken } };
  }
  return { ok: true, via: caller.via, caller: caller.caller };
}
