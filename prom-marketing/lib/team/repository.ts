import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { generatePassword, hashPassword } from "./password";
import { TEAM_ROLES, type TeamMember, type TeamRole } from "./types";

const COLS = "id, slug, full_name, email, phone, role, active, notify_new_leads, notes, last_login_at, created_at";

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

/** „Димитър Пенков“ → `dimitar-penkov`; влиза в metadata на всяка активност. */
export function slugify(name: string): string {
  const latin = name
    .toLowerCase()
    .split("")
    .map((ch) => CYR[ch] ?? ch)
    .join("");
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "chlen";
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function listMembers(): Promise<TeamMember[]> {
  const sb = createServiceClient();
  const { data } = await sb.from("team_members").select(COLS).order("created_at", { ascending: true });
  return (data ?? []) as TeamMember[];
}

export async function getMemberById(id: string): Promise<TeamMember | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("team_members").select(COLS).eq("id", id).maybeSingle();
  return (data as TeamMember | null) ?? null;
}

/** За входа: само активни, с хеша на паролата. */
export async function findMemberForLogin(
  email: string
): Promise<(TeamMember & { password_hash: string | null }) | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("team_members")
    .select(`${COLS}, password_hash`)
    .eq("email", normEmail(email))
    .eq("active", true)
    .maybeSingle();
  return (data as (TeamMember & { password_hash: string | null }) | null) ?? null;
}

export async function touchLogin(id: string): Promise<void> {
  const sb = createServiceClient();
  await sb.from("team_members").update({ last_login_at: new Date().toISOString() }).eq("id", id);
}

export async function createMember(input: {
  full_name: string;
  email: string;
  phone?: string | null;
  role?: TeamRole;
  notes?: string | null;
  notify_new_leads?: boolean;
}): Promise<{ member: TeamMember; password: string } | { error: string }> {
  const full_name = input.full_name.trim();
  const email = normEmail(input.email);
  if (!full_name) return { error: "Липсва име" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Невалиден имейл" };
  const role: TeamRole = input.role && TEAM_ROLES.includes(input.role) ? input.role : "setter";

  const sb = createServiceClient();
  // Уникален slug: dimitar, dimitar-2, …
  const base = slugify(full_name);
  const { data: taken } = await sb.from("team_members").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.slug as string));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;

  const password = generatePassword(12);
  const { data, error } = await sb
    .from("team_members")
    .insert({
      slug,
      full_name,
      email,
      phone: input.phone?.trim() || null,
      role,
      password_hash: hashPassword(password),
      notes: input.notes?.trim() || null,
      notify_new_leads: input.notify_new_leads ?? true,
    })
    .select(COLS)
    .single();
  if (error || !data) {
    const msg = error?.message ?? "insert failed";
    return { error: /duplicate|unique/i.test(msg) ? "Вече има човек с този имейл" : msg };
  }
  return { member: data as TeamMember, password };
}

export async function resetMemberPassword(id: string): Promise<{ password: string } | { error: string }> {
  const sb = createServiceClient();
  const password = generatePassword(12);
  const { error } = await sb
    .from("team_members")
    .update({ password_hash: hashPassword(password), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return { password };
}

export async function updateMember(
  id: string,
  patch: Partial<Pick<TeamMember, "active" | "notify_new_leads" | "phone" | "notes" | "role" | "full_name">>
): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("team_members")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

/** Кой от екипа иска писмо при нов лийд (активен + включено известие). */
export async function newLeadNotifyEmails(): Promise<string[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("team_members")
    .select("email")
    .eq("active", true)
    .eq("notify_new_leads", true);
  return [...new Set((data ?? []).map((r) => normEmail(String(r.email))).filter(Boolean))];
}
