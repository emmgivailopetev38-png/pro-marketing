"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { MANUAL_REVIEW_STATUSES } from "@/lib/crm/types";

const CLOSED = new Set(["resolved", "ignored"]);

/** Set the lifecycle status of a manual-review item (open/needs_user/blocked/resolved/ignored). */
export async function resolveManualReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("item_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(MANUAL_REVIEW_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid input");

  const svc = createServiceClient();
  await svc
    .from("manual_review_items")
    // resolved_at is set only for terminal states; re-opening clears it.
    .update({ status, resolved_at: CLOSED.has(status) ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/admin/manual-review");
  revalidatePath("/admin");
}

/** Link the item (and its invoice, if any) to a contact found by email. */
export async function matchToContactByEmail(formData: FormData) {
  const adminEmail = await requireAdmin();
  const id = String(formData.get("item_id") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!id || !email) throw new Error("Имейл е задължителен");

  const svc = createServiceClient();
  const { data: contact } = await svc.from("contacts").select("id").eq("email", email).maybeSingle();
  if (!contact) throw new Error("Няма контакт с този имейл");

  const { data: item } = await svc.from("manual_review_items").select("*").eq("id", id).single();

  await svc
    .from("manual_review_items")
    .update({ related_contact_id: contact.id, status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (item?.related_invoice_id) {
    await svc.from("invoices").update({ contact_id: contact.id }).eq("id", item.related_invoice_id);
  }
  if (item?.related_payment_id) {
    await svc.from("payments").update({ contact_id: contact.id }).eq("id", item.related_payment_id);
  }

  await svc.from("contact_activities").insert({
    contact_id: contact.id,
    activity_type: "note",
    title: "Свързан от ръчна проверка",
    body: item?.title ?? null,
    created_by: adminEmail,
  });

  revalidatePath("/admin/manual-review");
  revalidatePath(`/admin/clients/${contact.id}`);
  revalidatePath("/admin");
}

/** Schedule a follow-up call on the linked contact (+2 days) and resolve. */
export async function createFollowupFromItem(formData: FormData) {
  const adminEmail = await requireAdmin();
  const id = String(formData.get("item_id") ?? "");
  if (!id) throw new Error("Invalid input");

  const svc = createServiceClient();
  const { data: item } = await svc.from("manual_review_items").select("*").eq("id", id).single();
  if (!item?.related_contact_id) throw new Error("Няма свързан контакт");

  const due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  await svc
    .from("contacts")
    .update({ next_followup_at: due, followup_status: "needs_call" })
    .eq("id", item.related_contact_id);
  await svc.from("contact_activities").insert({
    contact_id: item.related_contact_id,
    activity_type: "note",
    title: "Follow-up от ръчна проверка",
    body: item.title,
    created_by: adminEmail,
  });
  await svc
    .from("manual_review_items")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/manual-review");
  revalidatePath(`/admin/clients/${item.related_contact_id}`);
}
