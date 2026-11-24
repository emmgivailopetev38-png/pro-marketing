/**
 * Поканите за екипа — чистите правила.
 *
 * Човекът получава линк, отваря го и САМ въвежда името, имейла и паролата си:
 * паролата не минава през Ивайло, Viber или чат. Линкът важи за един човек и
 * един път; след срока или след „отмени“ не отваря нищо.
 */
import type { TeamRole } from "./types";

export const INVITE_DAYS = 7;
export const PASSWORD_MIN = 10;

export interface InviteLite {
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
}

export type InviteState = "open" | "used" | "revoked" | "expired";

export function inviteState(i: InviteLite, now: Date = new Date()): InviteState {
  if (i.used_at) return "used";
  if (i.revoked_at) return "revoked";
  const t = new Date(i.expires_at).getTime();
  if (!Number.isFinite(t) || t <= now.getTime()) return "expired";
  return "open";
}

export const INVITE_STATE_LABEL: Record<InviteState, string> = {
  open: "чака да бъде отворена",
  used: "приета",
  revoked: "отменена",
  expired: "изтекла",
};

/** Защо паролата не става; null = добра е. */
export function passwordProblem(password: string, again: string): string | null {
  if (password.length < PASSWORD_MIN) return `Паролата е поне ${PASSWORD_MIN} знака.`;
  if (!/[A-Za-zА-Яа-я]/.test(password) || !/\d/.test(password)) return "Паролата иска поне една буква и една цифра.";
  if (password !== again) return "Двете пароли не съвпадат.";
  return null;
}

/** Ролите, за които може да се праща покана (собственик не се кани). */
export const INVITE_ROLES: TeamRole[] = ["manager", "sales", "setter", "delivery", "marketing"];

/** Какво ще види човекът, с едно изречение — стои на страницата на поканата. */
export const INVITE_ROLE_HINT: Record<string, string> = {
  manager: "Виждаш целия екип по продажбите: хората, срещите, числата и сделките.",
  sales: "Виждаш своите хора и срещи, съобщенията за тях, материалите и своите числа.",
  setter: "Виждаш своята опашка за звънене, записваш срещите при клоузърите и следиш своите числа.",
  delivery: "Виждаш своите проекти и задачи.",
  marketing: "Виждаш своите проекти и задачи.",
};

export function expiresFrom(now: Date = new Date(), days = INVITE_DAYS): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}
