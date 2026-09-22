"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createMember, resetMemberPassword, updateMember } from "@/lib/team/repository";
import { permissionsFromForm } from "@/lib/team/roles";
import { TEAM_MODULES, TEAM_ROLES, type TeamModule, type TeamRole } from "@/lib/team/types";

export interface TeamAdminResult {
  ok: boolean;
  error?: string;
  /** Паролата се показва ЕДИН път — в базата стои само хешът. */
  password?: string;
  email?: string;
  name?: string;
}

function roleOf(raw: string): TeamRole {
  return (TEAM_ROLES as readonly string[]).includes(raw) && raw !== "owner" ? (raw as TeamRole) : "setter";
}

function modulesFromForm(formData: FormData): Partial<Record<TeamModule, string | null>> {
  const out: Partial<Record<TeamModule, string | null>> = {};
  for (const m of TEAM_MODULES) {
    const v = formData.get(`mod_${m}`);
    if (v === "0" || v === "1") out[m] = String(v);
  }
  return out;
}

export async function createMemberAction(_prev: TeamAdminResult | null, formData: FormData): Promise<TeamAdminResult> {
  await requireAdmin();
  const role = roleOf(String(formData.get("role") ?? "setter"));
  const res = await createMember({
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role,
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    notify_new_leads: formData.get("notify_new_leads") === "1",
    permissions: permissionsFromForm(modulesFromForm(formData), role),
  });
  if ("error" in res) return { ok: false, error: res.error };
  revalidatePath("/admin/ekip");
  return { ok: true, password: res.password, email: res.member.email, name: res.member.full_name };
}

export async function resetPasswordAction(_prev: TeamAdminResult | null, formData: FormData): Promise<TeamAdminResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!id) return { ok: false, error: "Липсва id" };
  const res = await resetMemberPassword(id);
  if ("error" in res) return { ok: false, error: res.error };
  revalidatePath("/admin/ekip");
  return { ok: true, password: res.password, email, name };
}

export async function toggleMemberAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "") === "1";
  if (!id || (field !== "active" && field !== "notify_new_leads")) throw new Error("Invalid input");
  await updateMember(id, { [field]: value });
  revalidatePath("/admin/ekip");
}

/** Профилът на човека: роля, длъжност, телефон и кои модули вижда. */
export async function updateProfileAction(_prev: TeamAdminResult | null, formData: FormData): Promise<TeamAdminResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Липсва id" };
  const role = roleOf(String(formData.get("role") ?? "setter"));
  const res = await updateMember(id, {
    role,
    title: String(formData.get("title") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    full_name: String(formData.get("full_name") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || null,
    permissions: permissionsFromForm(modulesFromForm(formData), role),
  });
  if (res.error) return { ok: false, error: res.error };
  revalidatePath("/admin/ekip");
  revalidatePath("/ekip");
  return { ok: true, name: String(formData.get("full_name") ?? "") };
}
