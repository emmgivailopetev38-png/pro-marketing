"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor } from "@/lib/team/session";
import { buildSchema, describeIssues } from "@/lib/oferti/schema";
import { buildOffer, sendOffer } from "@/lib/oferti/repository";
import { SELLERS, type SellerKey } from "@/lib/oferti/katalog";
import { shortSummary } from "@/lib/oferti/view";
import type { BuilderState } from "@/lib/oferti/builder-types";

function sellerOf(actor: Awaited<ReturnType<typeof requireTeamActor>>): SellerKey {
  if (actor.kind === "member" && actor.member.id === SELLERS.georgi.team_member_id) return "georgi";
  return "ivailo";
}

/** Оферта от човек от екипа: от негово име, без отстъпка и без игра с ДДС — това е на Ивайло. */
export async function ekipBuildOfferAction(_prev: BuilderState, formData: FormData): Promise<BuilderState> {
  const actor = await requireTeamActor();
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    raw = null;
  }
  const parsed = buildSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: `Невалидни данни — ${describeIssues(parsed.error.issues, raw).join("; ")}` };
  const seller = sellerOf(actor);
  const input = actor.kind === "owner" ? parsed.data : { ...parsed.data, discount: undefined, discount_note: undefined, vat_mode: undefined, seller };
  const r = await buildOffer(
    { ...input, seller },
    { created_by: actor.kind === "owner" ? actor.name : `ekip:${actor.slug}`, owner_id: actor.kind === "member" ? actor.member.id : SELLERS[seller].team_member_id, seller }
  );
  if (r.error || !r.offer || !r.view) return { ok: false, error: r.error ?? "записът не мина" };
  revalidatePath("/ekip/oferti");
  revalidatePath("/admin/offers");
  return { ok: true, id: r.offer.id, url: r.view.url, pdf_url: r.view.pdfUrl, number: r.view.number, title: r.offer.title, summary: shortSummary(r.view) };
}

/** Човекът натиска „Изпрати“ сам → тръгва с прикачения PDF; отговорите стигат до него и до Ивайло. */
export async function ekipSendOfferAction(_prev: BuilderState, formData: FormData): Promise<BuilderState> {
  const actor = await requireTeamActor();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "липсва офертата" };
  const to = String(formData.get("to") ?? "").trim() || undefined;
  const text = String(formData.get("text") ?? "").trim() || undefined;
  const cc = String(formData.get("cc") ?? "").trim() || undefined;
  const r = await sendOffer({ id, to, cc, text, approved: true }, actor.kind === "owner" ? actor.name : `ekip:${actor.slug}`);
  if (!r.ok || !r.sent) return { ok: false, error: r.error ?? "не тръгна" };
  revalidatePath("/ekip/oferti");
  revalidatePath("/admin/offers");
  return { ok: true, id, sent: { to: r.sent.to }, url: r.sent.url, pdf_url: r.sent.pdf_url };
}
