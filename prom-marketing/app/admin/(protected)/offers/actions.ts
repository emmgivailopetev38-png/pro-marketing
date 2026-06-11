"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { upsertOffer, setOfferStatus } from "@/lib/crm/repository";
import { OFFER_STATUSES, type OfferStatus } from "@/lib/crm/types";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function revalidateDelivery() {
  revalidatePath("/admin/offers");
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

/** Ръчно добавяне на оферта от UI. */
export async function createOfferAction(formData: FormData) {
  await requireAdmin();
  const title = str(formData.get("title"));
  if (!title) throw new Error("Заглавието е задължително");
  const res = await upsertOffer({
    title,
    client_email: str(formData.get("client_email")),
    description: str(formData.get("description")),
    amount_net: num(formData.get("amount_net")),
    amount_gross: num(formData.get("amount_gross")),
    vat_amount: num(formData.get("vat_amount")),
    currency: str(formData.get("currency")) ?? "EUR",
    valid_until: str(formData.get("valid_until")),
    url: str(formData.get("url")),
    notes: str(formData.get("notes")),
    source: "manual",
  });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}

/** Смяна на статус — „Приета" автоматично създава проект. */
export async function setOfferStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("offer_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !OFFER_STATUSES.includes(status as OfferStatus)) throw new Error("Invalid input");
  const res = await setOfferStatus({ id, status: status as OfferStatus });
  if (res.error) throw new Error(res.error);
  revalidateDelivery();
}
