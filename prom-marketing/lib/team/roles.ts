/**
 * Кой какво вижда в /ekip — чисти правила, без база.
 *
 * Ролята дава подразбирането; `permissions.modules` на човека го променя
 * (включва или изключва модул). Така „вариантите на профили“ са комбинации,
 * не нови роли: продавач, който вижда и опашката за звънене; изпълнение без
 * цени; маркетинг с комисионни.
 */
import {
  TEAM_MODULES,
  TEAM_MODULE_HREF,
  TEAM_MODULE_LABEL,
  type TeamMember,
  type TeamModule,
  type TeamPermissions,
  type TeamRole,
} from "./types";

const DEFAULTS: Record<TeamRole, TeamModule[]> = {
  owner: [...TEAM_MODULES],
  setter: ["zvanene", "zadachi", "saobshtenia", "materiali"],
  sales: ["prodazhbi", "zadachi", "saobshtenia", "materiali", "ceni", "komisioni"],
  delivery: ["proekti", "zadachi", "saobshtenia", "materiali"],
  marketing: ["proekti", "zadachi", "saobshtenia", "materiali"],
};

/** Модулите по подразбиране за роля. */
export function defaultModules(role: TeamRole): TeamModule[] {
  return [...(DEFAULTS[role] ?? DEFAULTS.setter)];
}

/** Вижда ли този човек модула — ролята, поправена от неговите права. */
export function canSee(
  member: Pick<TeamMember, "role" | "permissions"> | null | undefined,
  module: TeamModule
): boolean {
  if (!member) return false;
  if (member.role === "owner") return true;
  const override = member.permissions?.modules?.[module];
  if (typeof override === "boolean") return override;
  return DEFAULTS[member.role]?.includes(module) ?? false;
}

/** Всички модули, които човекът вижда, в реда на менюто. */
export function visibleModules(member: Pick<TeamMember, "role" | "permissions"> | null | undefined): TeamModule[] {
  return TEAM_MODULES.filter((m) => canSee(member, m));
}

/**
 * Къде го праща /ekip при вход: първият модул с „работа“ (опашка, продажби,
 * проекти, задачи). Продавач без опашка отива на продажбите, а не на чужд екран.
 */
export function homeFor(member: Pick<TeamMember, "role" | "permissions"> | null | undefined): string {
  if (!member || member.role === "owner") return "/ekip";
  const order: TeamModule[] = ["zvanene", "prodazhbi", "proekti", "zadachi", "saobshtenia", "materiali"];
  const first = order.find((m) => canSee(member, m));
  return first ? TEAM_MODULE_HREF[first] : "/ekip/zadachi";
}

export interface NavItem {
  module: TeamModule;
  href: string;
  label: string;
}

export function navFor(member: Pick<TeamMember, "role" | "permissions"> | null | undefined): NavItem[] {
  return visibleModules(member).map((m) => ({ module: m, href: TEAM_MODULE_HREF[m], label: TEAM_MODULE_LABEL[m] }));
}

/** Формата от /admin/ekip: "1" = вижда, "0" = не вижда, липсва = по ролята. */
export function permissionsFromForm(
  values: Partial<Record<TeamModule, string | null | undefined>>,
  role: TeamRole
): TeamPermissions {
  const modules: Partial<Record<TeamModule, boolean>> = {};
  const def = new Set(defaultModules(role));
  for (const m of TEAM_MODULES) {
    const v = values[m];
    if (v !== "0" && v !== "1") continue;
    const want = v === "1";
    // Пази се само разликата спрямо ролята — така смяна на ролята после дава
    // новото подразбиране, вместо стара снимка на старата роля.
    if (want !== def.has(m)) modules[m] = want;
  }
  return Object.keys(modules).length ? { modules } : {};
}

/** Ключът на участника в съобщенията: собственикът е „owner“, човекът — id-то му. */
export function participantKey(member: { id: string } | null): string {
  return member ? member.id : "owner";
}
