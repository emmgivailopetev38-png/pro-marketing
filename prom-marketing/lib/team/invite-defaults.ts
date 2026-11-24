/**
 * Какво НЕ вижда по подразбиране човек на партньор (не наш служител).
 *
 * 24.11.2026 вечерта (Ивайло, след срещата с RevStream): „както Жорката има
 * пълен достъп“ — хората на партньора виждат всичко, което вижда нашият
 * клоузър: лийдовете, срещите, цените и вноските TBI, материалите, видеата и
 * отзивите, демото, съобщенията. Единственото изключение са „Комисионни“ —
 * там стоят нашите вътрешни правила и уговорката на Георги; парите на
 * партньора са в таблото на мениджъра, по договора му.
 */
import type { TeamModule, TeamRole } from "./types";

const PARTNER_OFF: TeamModule[] = ["komisioni"];

export function partnerModules(role: TeamRole, org: string | null | undefined): Partial<Record<TeamModule, boolean>> {
  if (!org || org === "promarketing" || role === "owner") return {};
  const out: Partial<Record<TeamModule, boolean>> = {};
  for (const m of PARTNER_OFF) out[m] = false;
  return out;
}
