"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireTeamActor, type TeamActor } from "@/lib/team/session";
import { canTouchContact } from "@/lib/team/sales";
import { commissionForDeal } from "@/lib/team/commissions";
import { notifyOwnerHandoff, notifyWon } from "@/lib/team/notify";
import { fmtSofia, sofiaLocalToIso } from "@/lib/team/time";
import { nextWorkingDayAt } from "@/lib/contacts/followup";
import { CHANNELS, MOODS, resolveRemindAt, type ChannelKey, type MoodKey } from "@/lib/contacts/dnevnik";
import { recordDnevnik } from "@/lib/contacts/dnevnik-repository";
import type { DnevnikResult } from "@/app/admin/(protected)/clients/[id]/actions";
import { CONTACT_STAGES, type ContactStage } from "@/lib/contacts/types";
import { isServiceType, labelFor } from "@/lib/team/service-types";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Действията на продавача по неговите картони. Всяко оставя активност с
 * неговото име. „Спечелен“ начислява комисионната по правилото за вида услуга
 * и известява Ивайло. Собственикът минава по същите пътища.
 */

function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function revalidate(contactId: string) {
  revalidatePath("/ekip/prodazhbi");
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/komisioni");
  revalidatePath("/ekip/komisioni");
}

async function actorOrNull(): Promise<TeamActor | null> {
  try {
    return await requireTeamActor();
  } catch {
    return null;
  }
}

/** „Записах разговор“ — същата форма като в картона, но с името на продавача. */
export async function salesDnevnikAction(_prev: DnevnikResult | null, formData: FormData): Promise<DnevnikResult> {
  const actor = await actorOrNull();
  if (!actor) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const contactId = s(formData, "contact_id");
  const { ok } = await canTouchContact(actor, contactId);
  if (!ok) return { ok: false, error: "Този картон не е при теб." };

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
  const occurredAt = occurredRaw ? (sofiaLocalToIso(occurredRaw) ?? null) : null;

  const res = await recordDnevnik({
    contactId,
    actor: actor.name,
    occurredAt,
    entry: { kind: "dnevnik", channel, mood, talked, they_promised: they, we_promised: we, happened, next_step: next, remind_at: remindAt },
  });
  if (!res.ok) return res;
  revalidate(contactId);
  const parts = ["Записано."];
  if (res.promises > 0) parts.push(`${res.promises} обещани${res.promises === 1 ? "е" : "я"} за отмятане.`);
  if (res.remindAt) parts.push(`Ще ти напомня ${fmtSofia(res.remindAt)}.`);
  return { ok: true, message: parts.join(" ") };
}

const SALES_ACTIONS = ["stage", "offer", "won", "lost", "handoff", "remind", "value"] as const;
type SalesKind = (typeof SALES_ACTIONS)[number];

export async function salesAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const actor = await actorOrNull();
  if (!actor) return { ok: false, error: "Сесията е изтекла — влез отново." };
  const contactId = s(formData, "contact_id");
  const kind = s(formData, "action") as SalesKind;
  if (!contactId || !SALES_ACTIONS.includes(kind)) return { ok: false, error: "Невалидно действие" };
  const { ok, contact } = await canTouchContact(actor, contactId);
  if (!ok || !contact) return { ok: false, error: "Този картон не е при теб." };

  const sb = createServiceClient();
  const nowIso = new Date().toISOString();
  const note = s(formData, "note");
  const patch: Record<string, unknown> = {};
  let activity: { type: string; title: string; body: string | null; metadata?: Record<string, unknown> } | null = null;
  let message = "Записано.";
  const meta = { team: true, team_member_id: actor.member?.id ?? null, team_member_slug: actor.slug };

  switch (kind) {
    case "stage": {
      const stage = s(formData, "stage") as ContactStage;
      if (!CONTACT_STAGES.includes(stage) || stage === "won" || stage === "lost") return { ok: false, error: "Избери етап." };
      if (stage === contact.stage) return { ok: true, message: "Етапът е същият." };
      patch.stage = stage;
      activity = { type: "stage_change", title: `Етап: ${contact.stage} → ${stage}`, body: note || null, metadata: { ...meta, from: contact.stage, to: stage } };
      message = `Етапът е „${stage}“.`;
      break;
    }
    case "value": {
      const v = Number(s(formData, "deal_value").replace(",", "."));
      if (!Number.isFinite(v) || v < 0) return { ok: false, error: "Напиши сума." };
      patch.deal_value_eur = Math.round(v);
      activity = { type: "note", title: `💶 Стойност на сделката: ${Math.round(v)} €`, body: note || null, metadata: meta };
      message = "Стойността е записана.";
      break;
    }
    case "offer": {
      const v = Number(s(formData, "deal_value").replace(",", "."));
      patch.stage = contact.stage === "negotiating" ? "negotiating" : "offer_sent";
      patch.followup_status = "sent_offer";
      patch.last_heard_from_at = nowIso;
      if (Number.isFinite(v) && v > 0) patch.deal_value_eur = Math.round(v);
      const remind = resolveRemindAt(s(formData, "remind_preset") || "3d", "");
      if (remind) patch.next_followup_at = remind;
      activity = {
        type: "offer_sent",
        title: `💎 Оферта изпратена${Number.isFinite(v) && v > 0 ? ` · ${Math.round(v)} €` : ""}`,
        body: note || null,
        metadata: { ...meta, amount: Number.isFinite(v) && v > 0 ? Math.round(v) : null },
      };
      message = remind ? `Офертата е отбелязана. Напомняне за ${fmtSofia(remind)}.` : "Офертата е отбелязана.";
      break;
    }
    case "won": {
      const serviceType = s(formData, "service_type");
      if (!isServiceType(serviceType)) return { ok: false, error: "Избери вид услуга — по нея се смята комисионната." };
      const v = Number(s(formData, "deal_value").replace(",", "."));
      const amount = Number.isFinite(v) && v > 0 ? Math.round(v) : contact.deal_value_eur;
      patch.stage = "won";
      patch.followup_status = null;
      patch.next_followup_at = null;
      patch.last_heard_from_at = nowIso;
      if (amount != null) patch.deal_value_eur = amount;
      activity = {
        type: "stage_change",
        title: `🏆 Спечелен · ${labelFor(serviceType)}${amount != null ? ` · ${amount} €` : ""}`,
        body: note || null,
        metadata: { ...meta, from: contact.stage, to: "won", service_type: serviceType, amount },
      };
      // Комисионната — на продавача, който е затворил (или на този, който Ивайло посочи).
      const creditTo = actor.member?.id ?? s(formData, "credit_member_id") ?? "";
      let commissionNote = "";
      if (creditTo) {
        const { data: m } = await sb.from("team_members").select("id, role").eq("id", creditTo).maybeSingle();
        if (m) {
          const c = await commissionForDeal({
            memberId: m.id as string,
            memberRole: m.role as string,
            contactId,
            serviceType,
            dealAmount: amount,
            createdBy: actor.name,
          });
          if (c.amount != null) commissionNote = ` Комисионна: ${c.amount} €${c.created ? "" : " (вече беше начислена)"}.`;
          await notifyWon({
            actorName: actor.name,
            contactId,
            contactName: contact.full_name ?? contact.company ?? "клиент",
            serviceType: labelFor(serviceType),
            amount,
            commission: c.amount,
          }).catch(() => {});
        }
      }
      message = `Честито — спечелен.${commissionNote}`;
      break;
    }
    case "lost": {
      patch.stage = "lost";
      patch.followup_status = "not_interested";
      patch.next_followup_at = null;
      patch.last_heard_from_at = nowIso;
      activity = { type: "stage_change", title: "Загубен", body: note || null, metadata: { ...meta, from: contact.stage, to: "lost", reason: note || null } };
      message = "Отбелязан като загубен.";
      break;
    }
    case "handoff": {
      const raw = s(formData, "retry_at");
      const whenIso = (raw && sofiaLocalToIso(raw)) || nextWorkingDayAt(new Date(), 10).toISOString();
      patch.followup_status = "needs_call";
      patch.next_followup_at = whenIso;
      patch.owner_id = null;
      activity = { type: "call", title: `Говорихме · Ивайло да му звънне · ${fmtSofia(whenIso)}`, body: note || null, metadata: { ...meta, handoff: true, handoff_to: "ivailo", retry_at: whenIso } };
      message = `Предадено на Ивайло за ${fmtSofia(whenIso)}.`;
      await notifyOwnerHandoff({
        actorName: actor.name,
        contactId,
        contactName: contact.full_name ?? contact.phone ?? "Без име",
        phone: contact.phone,
        email: contact.email,
        business: contact.business,
        note: note || null,
        whenIso,
      }).catch(() => {});
      break;
    }
    case "remind": {
      const remind = resolveRemindAt(s(formData, "remind_preset"), s(formData, "remind_at"));
      if (!remind) return { ok: false, error: "Избери кога." };
      patch.next_followup_at = remind;
      patch.followup_status = "needs_call";
      activity = { type: "note", title: `🔔 Да го чуя пак: ${fmtSofia(remind)}`, body: note || null, metadata: meta };
      message = `Напомняне за ${fmtSofia(remind)}.`;
      break;
    }
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await sb.from("contacts").update(patch).eq("id", contactId);
    if (error) return { ok: false, error: `Картонът не се обнови: ${error.message}` };
  }
  if (activity) {
    const { error } = await sb.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: activity.type,
      title: activity.title,
      body: activity.body,
      occurred_at: nowIso,
      metadata: activity.metadata ?? meta,
      created_by: actor.name,
    });
    if (error) return { ok: false, error: `Активността не се записа: ${error.message}` };
  }
  revalidate(contactId);
  return { ok: true, message };
}
