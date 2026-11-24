import "server-only";
import { randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { createMember } from "./repository";
import { expiresFrom, inviteState, passwordProblem, INVITE_ROLES, type InviteState } from "./invite-rules";
import { TEAM_MODULES, type TeamMember, type TeamModule, type TeamRole } from "./types";

/** Поканите за екипа (правилата и защо — invite-rules.ts). */

export interface TeamInvite {
  id: string;
  token: string;
  role: TeamRole;
  org: string;
  title: string | null;
  full_name: string | null;
  modules: Partial<Record<TeamModule, boolean>>;
  intake: boolean;
  note: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  created_by: string | null;
  created_at: string;
}

const COLS = "id, token, role, org, title, full_name, modules, intake, note, expires_at, used_at, used_by, revoked_at, created_by, created_at";

function cleanModules(raw: unknown): Partial<Record<TeamModule, boolean>> {
  const out: Partial<Record<TeamModule, boolean>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const m of TEAM_MODULES) {
    const v = (raw as Record<string, unknown>)[m];
    if (typeof v === "boolean") out[m] = v;
  }
  return out;
}

export async function listInvites(): Promise<Array<TeamInvite & { state: InviteState }>> {
  const sb = createServiceClient();
  const { data } = await sb.from("team_invites").select(COLS).order("created_at", { ascending: false }).limit(100);
  return ((data ?? []) as TeamInvite[]).map((i) => ({ ...i, modules: cleanModules(i.modules), state: inviteState(i) }));
}

export async function getInviteByToken(token: string): Promise<(TeamInvite & { state: InviteState }) | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const sb = createServiceClient();
  const { data } = await sb.from("team_invites").select(COLS).eq("token", token).maybeSingle();
  if (!data) return null;
  const i = data as TeamInvite;
  return { ...i, modules: cleanModules(i.modules), state: inviteState(i) };
}

export async function createInvite(input: {
  role: TeamRole;
  org?: string | null;
  title?: string | null;
  full_name?: string | null;
  modules?: Partial<Record<TeamModule, boolean>>;
  intake?: boolean;
  note?: string | null;
  createdBy?: string | null;
}): Promise<{ invite: TeamInvite } | { error: string }> {
  if (!INVITE_ROLES.includes(input.role)) return { error: "За тази роля не се праща покана" };
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("team_invites")
    .insert({
      token: randomBytes(24).toString("base64url"),
      role: input.role,
      org: (input.org ?? "").trim() || "promarketing",
      title: input.title?.trim() || null,
      full_name: input.full_name?.trim() || null,
      modules: cleanModules(input.modules ?? {}),
      intake: input.intake ?? true,
      note: input.note?.trim() || null,
      expires_at: expiresFrom(),
      created_by: input.createdBy ?? null,
    })
    .select(COLS)
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };
  return { invite: data as TeamInvite };
}

export async function revokeInvite(id: string): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("team_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("used_at", null);
  return { error: error?.message ?? null };
}

/**
 * Приема поканата: първо я „заключва“ (за да не я приемат двама наведнъж), после
 * създава човека с паролата, която той е избрал. Падне ли създаването (напр.
 * имейлът вече го има), поканата се отключва и човекът опитва пак.
 */
export async function acceptInvite(input: {
  token: string;
  full_name: string;
  email: string;
  phone?: string | null;
  password: string;
  password2: string;
  meet_url?: string | null;
}): Promise<{ member: TeamMember } | { error: string }> {
  const invite = await getInviteByToken(input.token);
  if (!invite) return { error: "Поканата не е намерена." };
  if (invite.state !== "open") return { error: "Тази покана вече не важи — поискай нова от Ивайло." };
  const bad = passwordProblem(input.password, input.password2);
  if (bad) return { error: bad };
  if (!input.full_name.trim()) return { error: "Напиши името си." };

  const sb = createServiceClient();
  const nowIso = new Date().toISOString();
  const { data: locked } = await sb
    .from("team_invites")
    .update({ used_at: nowIso })
    .eq("id", invite.id)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", nowIso)
    .select("id");
  if (!locked || locked.length === 0) return { error: "Тази покана вече не важи — поискай нова от Ивайло." };

  const res = await createMember({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    role: invite.role,
    title: invite.title,
    notes: invite.note,
    notify_new_leads: invite.role === "setter" && invite.intake,
    permissions: Object.keys(invite.modules).length ? { modules: invite.modules } : {},
    org: invite.org,
    intake: invite.intake,
    meet_url: input.meet_url ?? null,
    password: input.password,
  });
  if ("error" in res) {
    await sb.from("team_invites").update({ used_at: null }).eq("id", invite.id);
    return { error: res.error };
  }
  await sb.from("team_invites").update({ used_by: res.member.id }).eq("id", invite.id);
  return { member: res.member };
}
