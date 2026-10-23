import "server-only";
import { getTeamActor } from "@/lib/team/session";
import { canSee } from "@/lib/team/roles";

/**
 * Кой е пред /admin: собственикът или човек от екипа с модул „Демо“.
 * Човек без този модул (или спрян) е `null` — /admin не е за него.
 * Пътят се пази от middleware-а (lib/supabase/middleware.ts): член на екипа
 * стига само до DEMO_ADMIN_PATHS, дори с модула.
 */
export type AdminViewer = { kind: "owner"; name: string } | { kind: "demo"; name: string; memberId: string };

export async function getAdminViewer(): Promise<AdminViewer | null> {
  const actor = await getTeamActor();
  if (!actor) return null;
  if (actor.kind === "owner") return { kind: "owner", name: actor.name };
  if (!canSee(actor.member, "demo")) return null;
  return { kind: "demo", name: actor.name, memberId: actor.member.id };
}

export async function isDemoViewer(): Promise<boolean> {
  return (await getAdminViewer())?.kind === "demo";
}
