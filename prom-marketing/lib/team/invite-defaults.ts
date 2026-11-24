/**
 * Какво НЕ вижда по подразбиране човек на партньор (не наш служител).
 *
 * Принципът е „най-малкото нужно“: външният сетър/клоузър/мениджър работи с
 * лийдовете и срещите, но ценоразписът ни, офертите към клиенти, вътрешните
 * наръчници и вътрешният чат не са за него. Ивайло включва каквото реши от
 * профила на човека в /admin/ekip.
 */
import type { TeamModule, TeamRole } from "./types";

// „Комисионни“ показва нашите вътрешни правила за начисляване — парите на партньора са в таблото на мениджъра.
const PARTNER_OFF: TeamModule[] = ["ceni", "oferti", "materiali", "saobshtenia", "proekti", "demo", "komisioni"];

export function partnerModules(role: TeamRole, org: string | null | undefined): Partial<Record<TeamModule, boolean>> {
  if (!org || org === "promarketing" || role === "owner") return {};
  const out: Partial<Record<TeamModule, boolean>> = {};
  for (const m of PARTNER_OFF) out[m] = false;
  return out;
}
