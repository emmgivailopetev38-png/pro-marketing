"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createMember, resetMemberPassword, updateMember } from "@/lib/team/repository";
import { TEAM_ROLES, type TeamRole } from "@/lib/team/types";

export interface TeamAdminResult {
  ok: boolean;
  error?: string;
  /** Паролата се показва ЕДИН път — в базата стои само хешът. */
  password?: string;
  email?: string;
  name?: string;
}

export async function createMemberAction(_prev: TeamAdminResult | null, formData: FormData): Promise<TeamAdminResult> {
  await requireAdmin();
  const roleRaw = String(formData.get("role") ?? "setter");
  const role = (TEAM_ROLES as readonly string[]).includes(roleRaw) ? (roleRaw as TeamRole) : "setter";
  const res = await createMember({
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role,
    notes: String(formData.get("notes") ?? ""),
    notify_new_leads: formData.get("notify_new_leads") !== "0",
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
