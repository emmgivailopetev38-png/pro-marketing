import "server-only";
import { unreadTotal } from "./messages";
import { canSee, navFor, participantKey, type NavItem } from "./roles";
import type { TeamActor } from "./session";
import type { TeamModule } from "./types";

/** Шапката на /ekip за този човек: модулите, които вижда, и непрочетените. */
export async function ekipNav(actor: TeamActor): Promise<{ items: NavItem[]; unread: number; key: string }> {
  const member = actor.kind === "owner" ? { role: "owner" as const, permissions: null } : actor.member;
  const key = participantKey(actor.member);
  const unread = await unreadTotal(key).catch(() => 0);
  return { items: navFor(member), unread, key };
}

/** Може ли човекът да отвори този модул — иначе страницата го праща у дома. */
export function allowed(actor: TeamActor, module: TeamModule): boolean {
  if (actor.kind === "owner") return true;
  return canSee(actor.member, module);
}
