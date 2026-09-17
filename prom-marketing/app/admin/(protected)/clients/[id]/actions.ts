"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CONTACT_STAGES, type ContactStage } from "@/lib/contacts/types";

export async function updateStageAction(formData: FormData) {
  const email = await requireAdmin();

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
  await requireAdmin();

  const contactId = String(formData.get("contact_id") ?? "");
  if (!contactId) throw new Error("Invalid input");

  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const business = String(formData.get("business") ?? "").trim() || null;
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
      business,
      notes,
      deal_value_eur: Number.isFinite(dealValue ?? NaN) ? dealValue : null,
      next_followup_at: followup,
    })
    .eq("id", contactId);

  revalidatePath(`/admin/clients/${contactId}`);
}

export async function addActivityAction(formData: FormData) {
  const email = await requireAdmin();

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
  const email = await requireAdmin();

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

// ── Дневникът на връзката ───────────────────────────────────────────────────

import { CHANNELS, MOODS, resolveRemindAt, type ChannelKey, type MoodKey } from "@/lib/contacts/dnevnik";
import { addPromise, recordDnevnik, setPromiseDone } from "@/lib/contacts/dnevnik-repository";
import { fmtSofia } from "@/lib/team/time";

export interface DnevnikResult {
  ok: boolean;
  message?: string;
  error?: string;
}

function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function revalidateContact(contactId: string) {
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

/**
 * „Записах разговор“: как се е чувствал, какво говорихме, какво обеща той,
 * какво обещах аз, какво стана и кога да го чуя пак. Всичко в един запис.
 */
export async function recordDnevnikAction(_prev: DnevnikResult | null, formData: FormData): Promise<DnevnikResult> {
  let actor: string;
  try {
    actor = await requireAdmin();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  const contactId = s(formData, "contact_id");
  if (!contactId) return { ok: false, error: "Липсва картон" };

  const channelRaw = s(formData, "channel");
  const channel = (CHANNELS.some((c) => c.key === channelRaw) ? channelRaw : "phone") as ChannelKey;
  const moodRaw = s(formData, "mood");
  const mood = (MOODS.some((m) => m.key === moodRaw) ? moodRaw : null) as MoodKey | null;
  const talked = s(formData, "talked");
  const they = s(formData, "they_promised");
  const we = s(formData, "we_promised");
  const happened = s(formData, "happened");
  const next = s(formData, "next_step");
  if (!talked && !they && !we && !happened && !next && !mood) {
    return { ok: false, error: "Напиши поне едно нещо — какво говорихте или как се чувстваше." };
  }
  const remindAt = resolveRemindAt(s(formData, "remind_preset"), s(formData, "remind_at"));
  const occurredRaw = s(formData, "occurred_at");
  const occurredAt = occurredRaw ? (resolveRemindAt("", occurredRaw) ?? null) : null;

  const res = await recordDnevnik({
    contactId,
    actor,
    occurredAt,
    entry: {
      kind: "dnevnik",
      channel,
      mood,
      talked,
      they_promised: they,
      we_promised: we,
      happened,
      next_step: next,
      remind_at: remindAt,
    },
  });
  if (!res.ok) return res;
  revalidateContact(contactId);
  const parts = ["Записано."];
  if (res.promises > 0) parts.push(`${res.promises} обещани${res.promises === 1 ? "е" : "я"} за отмятане.`);
  if (res.remindAt) parts.push(`Ще ти напомня ${fmtSofia(res.remindAt)}.`);
  return { ok: true, message: parts.join(" ") };
}

export async function togglePromiseAction(formData: FormData) {
  await requireAdmin();
  const id = s(formData, "promise_id");
  const contactId = s(formData, "contact_id");
  const done = s(formData, "done") === "1";
  if (!id) throw new Error("Липсва обещание");
  const { error } = await setPromiseDone(id, done);
  if (error) throw new Error(error);
  if (contactId) revalidateContact(contactId);
}

export async function addPromiseAction(formData: FormData) {
  const actor = await requireAdmin();
  const contactId = s(formData, "contact_id");
  const who = s(formData, "who") === "us" ? "us" : "them";
  const text = s(formData, "text");
  if (!contactId || !text) throw new Error("Празно обещание");
  const dueAt = resolveRemindAt(s(formData, "due_preset"), s(formData, "due_at"));
  const { error } = await addPromise({ contactId, who, text, dueAt, actor });
  if (error) throw new Error(error);
  revalidateContact(contactId);
}
