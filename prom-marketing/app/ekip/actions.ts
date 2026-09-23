"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireTeamActor, type TeamActor } from "@/lib/team/session";
import { alignStage, nextWorkingDayAt } from "@/lib/contacts/followup";
import { defaultRetryAt, fmtSofia, sofiaLocalToIso } from "@/lib/team/time";
import { retryFromPreset, talkedRetryAt } from "@/lib/team/retry-rules";
import { upsertBooking } from "@/lib/crm/repository";
import { MEETING_MINUTES } from "@/lib/cal/types";
import { createCalBooking, isCalWriteConfigured } from "@/lib/cal/create-booking";
import { notifyOwnerBooking, notifyOwnerHandoff } from "@/lib/team/notify";
import { EKIP_ACTIONS, type EkipActionKind, type EkipActionResult } from "@/lib/team/types";
import { joinBusiness } from "@/lib/team/business";
import type { ContactStage } from "@/lib/contacts/types";

/** Плейсхолдър за NOT NULL колоната в bookings — на наш домейн, за да не тръгне писмо към чужд човек. */
const NO_EMAIL = "bez-imeil@promarketing.pw";
const ATTEMPT_TYPES = ["call", "meeting", "viber_sent"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function revalidateAll(contactId: string) {
  revalidatePath("/ekip");
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin");
}

/**
 * Единственият вход на опашката за звънене. Всяко натискане записва
 * активност в картона (created_by = човекът) и оправя състоянието на
 * контакта по същите правила като бутоните на /admin/follow-up.
 */
export async function ekipAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor: TeamActor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }

  const contactId = str(formData, "contact_id");
  const action = str(formData, "action") as EkipActionKind;
  if (!contactId || !EKIP_ACTIONS.includes(action)) return { ok: false, error: "Невалидно действие" };

  const business = joinBusiness(str(formData, "business"), str(formData, "business_detail"));
  const note = str(formData, "note");

  const sb = createServiceClient();
  const { data: c } = await sb
    .from("contacts")
    .select("id, full_name, email, phone, stage, business")
    .eq("id", contactId)
    .maybeSingle();
  if (!c) return { ok: false, error: "Картонът не е намерен" };

  const stage = (c.stage ?? "lead") as ContactStage;
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  if (business && business !== c.business) patch.business = business;

  const meta: Record<string, unknown> = {
    team: true,
    team_member_id: actor.member?.id ?? null,
    team_member_slug: actor.slug,
    outcome: action,
    business: business || null,
  };
  let activity: { type: string; title: string; body: string | null; occurred_at?: string };
  let message: string;

  try {
    switch (action) {
      case "no_answer": {
        // Бързите избори („след 3 часа“, „утре“, „след 3 дни“, „след 7 дни“, точен
        // час) бият полето; без избор важи старото правило (3 ч / утре в 10:00).
        const preset = str(formData, "retry_preset");
        const fromPreset = preset ? retryFromPreset(preset, str(formData, "retry_at_custom")) : null;
        if (preset === "custom" && !fromPreset) return { ok: false, error: "Избери точния час за повторното звънене." };
        const raw = str(formData, "retry_at");
        const retryIso = fromPreset?.toISOString() ?? ((raw && sofiaLocalToIso(raw)) || defaultRetryAt().toISOString());
        patch.followup_status = "needs_call";
        patch.next_followup_at = retryIso;
        meta.retry_at = retryIso;
        meta.retry_preset = preset || null;
        activity = { type: "call", title: `Не вдигна · пак на ${fmtSofia(retryIso)}`, body: note || null };
        message = `Отбелязано. Картата остава в „чакат обратно обаждане“; за повторно излиза на ${fmtSofia(retryIso)}. След 7 дни без резултат се връща на Ивайло сама.`;
        break;
      }
      case "callback": {
        const retryIso = sofiaLocalToIso(str(formData, "retry_at"));
        if (!retryIso) return { ok: false, error: "Избери кога да звъннеш пак." };
        patch.last_heard_from_at = nowIso;
        patch.followup_status = "needs_call";
        patch.next_followup_at = retryIso;
        if (stage === "lead") patch.stage = "contacted";
        meta.retry_at = retryIso;
        activity = { type: "call", title: `Говорихме · чуване пак на ${fmtSofia(retryIso)}`, body: note || null };
        message = `Записано. Ще излезе пак на ${fmtSofia(retryIso)}.`;
        break;
      }
      case "talked": {
        // „Говорихме, но не насрочихме среща“ — човекът не знае кога ще му е
        // удобно. Не се губи: излиза пак след избраните дни (по подразбиране 3).
        const retryAt = talkedRetryAt(str(formData, "talked_after"));
        const retryIso = retryAt.toISOString();
        patch.last_heard_from_at = nowIso;
        patch.followup_status = "needs_call";
        patch.next_followup_at = retryIso;
        if (stage === "lead") patch.stage = "contacted";
        meta.retry_at = retryIso;
        activity = {
          type: "call",
          title: `Говорихме · без среща засега · пак на ${fmtSofia(retryIso)}`,
          body: [business ? `Дейност: ${business}` : null, note || null].filter(Boolean).join("\n") || null,
        };
        message = `Записано. Картата остава под ръка; за повторно излиза на ${fmtSofia(retryIso)}. Обади ли се преди това — намираш го с търсачката.`;
        break;
      }
      case "meeting": {
        const meetingIso = sofiaLocalToIso(str(formData, "meeting_at"));
        if (!meetingIso) return { ok: false, error: "Избери кога е срещата." };
        if (new Date(meetingIso).getTime() < Date.now() - 60 * 60 * 1000) {
          return { ok: false, error: "Срещата е в миналото — провери датата." };
        }
        const typedEmail = str(formData, "email").toLowerCase();
        const email = c.email ?? (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(typedEmail) ? typedEmail : null);
        if (!c.email && email) patch.email = email;
        const name = c.full_name ?? c.phone ?? "Без име";

        // Покана с Meet линк — през Cal.com, който държи календара на Ивайло.
        // Първо Cal.com, после CRM-ът със същия ключ (uid): така webhook-ът
        // на Cal.com попада в същия ред, а не прави втора среща.
        const wantInvite = str(formData, "invite") === "1";
        let inviteNote = "";
        let meetingUrl: string | null = null;
        let calUid: string | null = null;
        if (wantInvite && email && isCalWriteConfigured()) {
          const cal = await createCalBooking({
            name,
            email,
            startISO: meetingIso,
            phone: c.phone,
            notes: [business ? `Дейност: ${business}` : null, note || null, `Записа: ${actor.name}`].filter(Boolean).join(" · "),
          });
          if (cal.ok) {
            meetingUrl = cal.meetingUrl;
            calUid = cal.uid;
            inviteNote = meetingUrl
              ? " Човекът получи покана с Meet линка на имейла си; готовото съобщение за Viber с линка е в „Съобщения за срещите“."
              : " Поканата е пратена по имейл.";
          } else {
            inviteNote = ` Поканата през Cal.com не мина (${cal.error ?? "грешка"}) — срещата е записана само в CRM-а; Ивайло ще я сложи в календара.`;
          }
        } else if (wantInvite && !email) {
          inviteNote = " Без имейл няма покана и Meet линк — Ивайло ще звънне по телефона в уговорения час. Готовото съобщение за Viber е в „Съобщения за срещите“.";
        }

        const booking = await upsertBooking({
          cal_booking_id: calUid ?? undefined,
          attendee_name: name,
          attendee_email: email ?? NO_EMAIL,
          attendee_phone: c.phone ?? undefined,
          scheduled_at: meetingIso,
          duration_minutes: MEETING_MINUTES,
          status: "accepted",
          business: business ?? undefined,
          meeting_url: meetingUrl ?? undefined,
          cal_uid: calUid ?? undefined,
          notes: [note, `Записа: ${actor.name}`].filter(Boolean).join(" · "),
          source: "ekip",
          log_activity: false,
        });
        if (booking.error) return { ok: false, error: `Срещата не се записа: ${booking.error}` };

        patch.last_heard_from_at = nowIso;
        patch.followup_status = null;
        patch.next_followup_at = null;
        if (stage === "lead" || stage === "contacted") patch.stage = "discovery";
        meta.booking_id = booking.id;
        meta.meeting_at = meetingIso;
        meta.meeting_url = meetingUrl;
        activity = {
          type: "meeting",
          title: `Среща · ${fmtSofia(meetingIso)} · записа ${actor.name}`,
          body:
            [business ? `Дейност: ${business}` : null, meetingUrl ? `Линк: ${meetingUrl}` : null, note || null]
              .filter(Boolean)
              .join("\n") || null,
          occurred_at: meetingIso,
        };
        message = `Срещата е записана за ${fmtSofia(meetingIso)}. Ивайло е уведомен.${inviteNote}`;
        await notifyOwnerBooking({
          actorName: actor.name,
          contactId: c.id,
          contactName: name,
          phone: c.phone,
          email,
          business,
          note: [note || null, meetingUrl ? `Meet: ${meetingUrl}` : null].filter(Boolean).join("\n") || null,
          scheduledAtIso: meetingIso,
        }).catch(() => {});
        break;
      }
      case "handoff": {
        // Човекът иска да говори направо с Ивайло (ще дойде на място, иска цени…):
        // излиза от списъка на екипа и влиза в сутрешния списък на Ивайло.
        const raw = str(formData, "retry_at");
        const whenIso = (raw && sofiaLocalToIso(raw)) || nextWorkingDayAt(new Date(), 10).toISOString();
        patch.last_heard_from_at = nowIso;
        patch.followup_status = "needs_call";
        patch.next_followup_at = whenIso;
        if (stage === "lead") patch.stage = "contacted";
        meta.handoff = true;
        meta.handoff_to = "ivailo";
        meta.retry_at = whenIso;
        activity = {
          type: "call",
          title: `Говорихме · Ивайло да му звънне · ${fmtSofia(whenIso)}`,
          body: [business ? `Дейност: ${business}` : null, note || null].filter(Boolean).join("\n") || null,
        };
        message = `Предадено на Ивайло — той ще му звънне (${fmtSofia(whenIso)}). Картата излиза от твоя списък.`;
        await notifyOwnerHandoff({
          actorName: actor.name,
          contactId: c.id,
          contactName: c.full_name ?? c.phone ?? "Без име",
          phone: c.phone,
          email: c.email,
          business,
          note: note || null,
          whenIso,
        }).catch(() => {});
        break;
      }
      case "not_interested": {
        patch.last_heard_from_at = nowIso;
        patch.followup_status = "not_interested";
        patch.next_followup_at = null;
        patch.stage = alignStage(stage, "not_interested");
        activity = { type: "call", title: "Не се интересува", body: note || null };
        message = "Отбелязано като „не се интересува“.";
        break;
      }
      case "wrong_number": {
        patch.followup_status = "not_interested";
        patch.next_followup_at = null;
        patch.stage = alignStage(stage, "not_interested");
        activity = { type: "call", title: "Грешен или несъществуващ номер", body: note || null };
        message = "Отбелязано като грешен номер.";
        break;
      }
      case "note": {
        if (!note && !business) return { ok: false, error: "Напиши бележка или избери дейност." };
        activity = {
          type: "note",
          title: `Бележка от ${actor.name}`,
          body: [business ? `Дейност: ${business}` : null, note || null].filter(Boolean).join("\n") || null,
        };
        message = "Бележката е в картона.";
        break;
      }
      case "hide": {
        // Само флаг върху последния опит — без нова активност и без промяна
        // на картона. Насроченото чуване си стои и излиза, когато му дойде часът.
        const { data: last } = await sb
          .from("contact_activities")
          .select("id, metadata")
          .eq("contact_id", contactId)
          .in("activity_type", ATTEMPT_TYPES)
          .order("occurred_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!last) return { ok: false, error: "Няма какво да се скрие." };
        const prev = (last.metadata ?? {}) as Record<string, unknown>;
        const { error } = await sb
          .from("contact_activities")
          .update({ metadata: { ...prev, hidden: true, hidden_at: nowIso, hidden_by: actor.slug } })
          .eq("id", last.id);
        if (error) return { ok: false, error: `Не се скри: ${error.message}` };
        revalidatePath("/ekip");
        return { ok: true, message: "Скрито. Ще излезе пак в „за повторно“, когато му дойде часът; дотогава го намираш с търсачката." };
      }
      default:
        return { ok: false, error: "Непознато действие" };
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await sb.from("contacts").update(patch).eq("id", contactId);
      if (error) return { ok: false, error: `Картонът не се обнови: ${error.message}` };
    }
    const { error: actErr } = await sb.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: activity.type,
      title: activity.title,
      body: activity.body,
      occurred_at: activity.occurred_at ?? nowIso,
      metadata: meta,
      created_by: actor.name,
    });
    if (actErr) return { ok: false, error: `Активността не се записа: ${actErr.message}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка при записа" };
  }

  revalidateAll(contactId);
  return { ok: true, message };
}
