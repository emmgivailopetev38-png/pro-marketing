import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, readSession } from "@/lib/admin/session";
import { getMemberById } from "./repository";
import type { TeamMember } from "./types";

/**
 * Кой действа: собственикът (общата парола на /admin) или човек от екипа
 * (/ekip). Името влиза в `created_by` на активностите — както „Ивайло“ досега.
 * Човек от екипа, който е спрян (active = false), губи достъпа веднага,
 * дори бисквитката му да е още валидна.
 */
export type TeamActor =
  | { kind: "owner"; name: string; slug: string; member: null }
  | { kind: "member"; name: string; slug: string; member: TeamMember };

export async function getTeamActor(): Promise<TeamActor | null> {
  const store = await cookies();
  const session = readSession(store.get(ADMIN_COOKIE)?.value ?? null);
  if (!session) return null;
  if (session.kind === "owner") {
    return { kind: "owner", name: process.env.ADMIN_ACTOR || "Ивайло", slug: "ivailo", member: null };
  }
  const member = await getMemberById(session.memberId);
  if (!member || !member.active) return null;
  return { kind: "member", name: member.full_name, slug: member.slug, member };
}

export async function requireTeamActor(): Promise<TeamActor> {
  const actor = await getTeamActor();
  if (!actor) throw new Error("Unauthorized");
  return actor;
}
