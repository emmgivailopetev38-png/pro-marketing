/**
 * Ротацията на новите лийдове — чисти правила, без база.
 *
 * 26.09.2026 (Ивайло): „като влезе нов лийд, един да влиза при Елена и един при
 * Димитър — 50 на 50“. В кръга е всеки активен човек (не собственикът), който
 * вижда модула „Звънене“ — така нов акаунт със звънене влиза в ротацията сам,
 * без отделна отметка. Редът е по дата на създаване; следващият лийд отива при
 * човека след последния получил.
 *
 * Лийд без човек (влязъл преди ротацията или от източник, който не минава през
 * нея) е на първия в кръга — както беше, когато звънеше само един. Лийд на човек,
 * който вече не е в кръга (спрян достъп, махнато звънене), също отива при първия.
 */
import { canSee } from "./roles";
import type { TeamMember } from "./types";

export type RotationMember = Pick<TeamMember, "id" | "role" | "permissions" | "active" | "created_at">;

/** Хората, между които се редуват новите лийдове, в реда на кръга. */
export function rotationPool<T extends RotationMember>(members: T[]): T[] {
  return members
    .filter((m) => m.active && m.role !== "owner" && canSee(m, "zvanene"))
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "") || a.id.localeCompare(b.id));
}

/** Следващият в кръга след последния получил; без последен — първият. */
export function nextInRotation<T extends { id: string }>(pool: T[], lastId: string | null | undefined): T | null {
  if (pool.length === 0) return null;
  const i = lastId ? pool.findIndex((m) => m.id === lastId) : -1;
  return pool[(i + 1) % pool.length];
}

/** Чий е лийдът в екипа: при когото е влязъл, ако той още е в кръга; иначе на първия. */
export function leadOwner(routedTo: string | null | undefined, pool: Array<{ id: string }>): string | null {
  if (routedTo && pool.some((m) => m.id === routedTo)) return routedTo;
  return pool[0]?.id ?? null;
}

/** Вижда ли човекът картата в опашката си. Собственикът (viewer = null) вижда всичко. */
export function seesLead(
  viewerId: string | null,
  routedTo: string | null | undefined,
  pool: Array<{ id: string }>
): boolean {
  if (!viewerId) return true;
  return leadOwner(routedTo, pool) === viewerId;
}

/**
 * Даден от Ивайло / отказал срещата / неявил се картон: при човека от маркера,
 * ако той още е в кръга; иначе при човека на лийда.
 */
export function seesGiven(
  viewerId: string | null,
  markerTo: string | null | undefined,
  routedTo: string | null | undefined,
  pool: Array<{ id: string }>
): boolean {
  if (!viewerId) return true;
  const target = markerTo && pool.some((m) => m.id === markerTo) ? markerTo : leadOwner(routedTo, pool);
  return target === viewerId;
}

/**
 * Кой получава писмо за картон: хората с включено известие, които НЕ са в кръга
 * (наблюдават всичко), плюс човекът на лийда. Без картон (`ownerId === undefined`)
 * — всички с известие, както преди ротацията.
 */
export function recipientsFor<T extends { id: string }>(
  notify: T[],
  pool: Array<{ id: string }>,
  ownerId: string | null | undefined
): T[] {
  if (ownerId === undefined) return notify;
  const inPool = new Set(pool.map((m) => m.id));
  return notify.filter((m) => !inPool.has(m.id) || m.id === ownerId);
}
