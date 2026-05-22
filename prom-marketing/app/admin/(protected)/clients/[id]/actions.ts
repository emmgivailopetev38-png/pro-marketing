"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { CONTACT_STAGES, type ContactStage } from "@/lib/contacts/types";

async function getAdminEmail(): Promise<string> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!user?.email || !allowed.includes(user.email.toLowerCase())) {
    throw new Error("Forbidden");
  }
  return user.email;
}

export async function updateStageAction(formData: FormData) {
  const email = await getAdminEmail();

  const contactId = String(formData.get("contact_id") ?? "");
  const stage = String(formData.get("stage") ?? "") as ContactStage;
  if (!contactId || !CONTACT_STAGES.includes(stage)) throw new Error("Invalid input");

  const svc = createServiceClient();
  const { data: prev } = await svc
    .from("contacts")
    .select("stage")
    .eq("id", contactId)
    .single();

  await svc.from("contacts").update({ stage }).eq("id", contactId);
  await svc.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "stage_change",
    title: `Статус: ${prev?.stage ?? "?"} → ${stage}`,
    created_by: email,
  });

  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/clients");
}

export async function updateContactFieldsAction(formData: FormData) {
  await getAdminEmail();

  const contactId = String(formData.get("contact_id") ?? "");
  if (!contactId) throw new Error("Invalid input");

  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dealValueRaw = String(formData.get("deal_value_eur") ?? "").trim();
  const dealValue = dealValueRaw ? Math.round(Number(dealValueRaw)) : null;
  const followupRaw = String(formData.get("next_followup_at") ?? "").trim();
  const followup = followupRaw ? new Date(followupRaw).toISOString() : null;

  const svc = createServiceClient();
  await svc
    .from("contacts")
    .update({
      full_name: fullName,
      company,
      notes,
      deal_value_eur: Number.isFinite(dealValue ?? NaN) ? dealValue : null,
      next_followup_at: followup,
    })
    .eq("id", contactId);

  revalidatePath(`/admin/clients/${contactId}`);
}

export async function addActivityAction(formData: FormData) {
  const email = await getAdminEmail();

  const contactId = String(formData.get("contact_id") ?? "");
  const type = String(formData.get("activity_type") ?? "").trim() || "note";
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim() || null;
  if (!contactId || !title) throw new Error("Invalid input");

  const svc = createServiceClient();
  await svc.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: type,
    title,
    body,
    created_by: email,
  });

  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/clients");
}

export async function addContactAction(formData: FormData) {
  const email = await getAdminEmail();

  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const contactEmail = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;

  if (!contactEmail && !phone) throw new Error("Имейл или телефон е задължителен");

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("contacts")
    .insert({
      full_name: fullName,
      email: contactEmail,
      phone,
      company,
      stage: "lead",
      source: "manual",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (data?.id) {
    await svc.from("contact_activities").insert({
      contact_id: data.id,
      activity_type: "note",
      title: "Контактът е добавен ръчно",
      created_by: email,
    });
  }

  revalidatePath("/admin/clients");
  return data?.id ?? null;
}
