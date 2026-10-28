import { dayKey } from "@/lib/contacts/followup";
import { remindAtFromPreset } from "@/lib/contacts/dnevnik";
import type { FollowupStatus, ContactStage } from "@/lib/contacts/types";

/**
 * „📞 Звънене“ — кого да чуе Ивайло сега и как се записва резултатът.
 *
 * Ивайло, 28.10.2026: „кажи ми на кой друг да звънна — новите лийдове, с които не сме се
 * чували, на които сме писали, но нямаме контакт, и старите … направи ми специално готова
 * страница за звънене“. Тук е чистата логика (без база), за да се тества.
 */

const TZ = "Europe/Sofia";

export const LEAD_TYPES = ["meta_lead", "website_form", "voice_web_session"];
export const WRITE_TYPES = ["viber_sent", "whatsapp_sent", "email", "offer_sent"];
export const REPLY_TYPES = ["viber_received", "whatsapp_received", "email_received", "email_reply"];
export const OFFER_TYPES = ["offer_created", "offer_sent", "offer"];
export const ZV_ACTIVITY_TYPES = Array.from(
  new Set([...LEAD_TYPES, ...WRITE_TYPES, ...REPLY_TYPES, ...OFFER_TYPES, "call", "meeting", "note"])
);

/** Обаждане/бележка, което значи „чухме се“ (не само опит). */
const TALK = /(Говорих|Разговор|Чухме|Обадихме се|Поискахме обратна|интерес|Чут през)/i;
/** Човекът каза „не“ или номерът е грешен — не се звъни (освен ако пак остави данни после). */
const REFUSAL = /(Не се интересува|Не е заинтересован|Грешен номер|Несъществуващ номер|не звъни повече)/i;
const NO_ANSWER = /(Не вдигна|не вдига|Заето|изключен|без отговор|Не отговаря)/i;
/** Автоматичните пишещи — те не са „ние сме писали“ и не са история за четене. */
const AUTO_AUTHORS = new Set(["warm_sequence", "lead_sequence", "meta_webhook", "website", "meta_csv_import", "система"]);

const FUNNEL: ContactStage[] = ["discovery", "presentation_sent", "offer_sent", "negotiating"];
const HOT_STATUS = new Set(["interested", "called_waiting_feedback", "ready_to_close", "sent_offer", "sent_presentation", "sent_proforma"]);
const STAGE_RANK: Record<string, number> = {
  negotiating: 0,
  offer_sent: 1,
  presentation_sent: 2,
  discovery: 3,
  contacted: 4,
  lead: 5,
};

export type ZvKat = "nov" | "topal" | "pisano" | "star";

export interface ZvContact {
  id: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  stage: string;
  followup_status: string | null;
  next_followup_at: string | null;
  created_at: string;
}

export interface ZvAct {
  contact_id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  created_by: string | null;
}

export interface ZvRow {
  id: string;
  name: string;
  company: string | null;
  tel: string | null;
  phone_pretty: string;
  stage: string;
  kat: ZvKat;
  /** По-малкото е по-нагоре в списъка. */
  sort: number;
  lead_at: string;
  zashto: string;
  posledno: string[];
  nevdigna: number;
  oferta: boolean;
  due: "today" | "overdue" | null;
  called_today: { title: string; at: string } | null;
}

export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/[^\d+]/g, "");
  if (d.replace(/\D/g, "").length < 9) return null;
  if (d.startsWith("+")) return d;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("359")) return "+" + d;
  if (d.startsWith("0") && d.length === 10) return "+359" + d.slice(1);
  return d;
}

/** „+359897483801“ → „0897 483 801“; чуждите номера остават както са. */
export function phonePretty(tel: string | null): string {
  if (!tel) return "";
  if (tel.startsWith("+359") && tel.length === 13) {
    const n = "0" + tel.slice(4);
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  }
  return tel;
}

function ddmm(iso: string, withTime = false): string {
  return new Date(iso).toLocaleString("bg-BG", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function leadInfo(a: ZvAct | undefined): string {
  if (!a) return "";
  const poiska = a.body?.split("\n").find((l) => l.startsWith("Поиска:"));
  if (poiska) return poiska.replace("Поиска:", "поиска").trim();
  if (a.activity_type === "voice_web_session") return "отвори гласовия агент";
  return (a.title ?? "").replace(/^Meta lead · /, "").slice(0, 80);
}

/**
 * Един човек → в коя купчина е, защо и какво пише последно. `acts` са на този контакт,
 * най-новите първи. `null` = не се звъни (среща напред, отказ, чухме се току-що).
 */
export function classify(c: ZvContact, acts: ZvAct[], now: Date): ZvRow | null {
  const tel = telHref(c.phone);
  if (!tel) return null;
  const nowMs = now.getTime();
  const today = dayKey(now);
  const past = acts.filter((a) => new Date(a.occurred_at).getTime() <= nowMs);

  if (acts.some((a) => a.activity_type === "meeting" && new Date(a.occurred_at).getTime() > nowMs)) return null;

  const leadAct = past.find((a) => LEAD_TYPES.includes(a.activity_type));
  const leadAt = [c.created_at, leadAct?.occurred_at]
    .filter((x): x is string => !!x)
    .sort()
    .at(-1)!;
  const leadMs = new Date(leadAt).getTime();
  const afterLead = past.filter((a) => new Date(a.occurred_at).getTime() >= leadMs - 86_400_000);

  if (afterLead.some((a) => (a.activity_type === "call" || a.activity_type === "note") && REFUSAL.test(a.title ?? ""))) {
    return null;
  }

  const isTalk = (a: ZvAct) =>
    REPLY_TYPES.includes(a.activity_type) ||
    a.activity_type === "meeting" ||
    ((a.activity_type === "call" || a.activity_type === "note") && TALK.test(a.title ?? "") && !NO_ANSWER.test(a.title ?? ""));
  const lastTalk = past.find(isTalk);
  const talkAfterLead = afterLead.find(isTalk);
  const lastWrite = past.find((a) => WRITE_TYPES.includes(a.activity_type) && !AUTO_AUTHORS.has(a.created_by ?? ""));
  const nevdigna = afterLead.filter((a) => a.activity_type === "call" && NO_ANSWER.test(a.title ?? "")).length;
  const oferta = past.some((a) => OFFER_TYPES.includes(a.activity_type));
  const todayCall = past.find((a) => a.activity_type === "call" && dayKey(a.occurred_at) === today);

  const due: ZvRow["due"] = c.next_followup_at
    ? dayKey(c.next_followup_at) < today
      ? "overdue"
      : dayKey(c.next_followup_at) === today
        ? "today"
        : null
    : null;

  // Чухме се преди по-малко от 2 дни и никой не е поискал обаждане днес — няма смисъл пак.
  if (!todayCall && lastTalk && nowMs - new Date(lastTalk.occurred_at).getTime() < 2 * 86_400_000 && !due) return null;

  const fresh = nowMs - leadMs < 14 * 86_400_000;
  const hot =
    !!lastTalk && (FUNNEL.includes(c.stage as ContactStage) || oferta || HOT_STATUS.has(c.followup_status ?? ""));

  let kat: ZvKat;
  let zashto: string;
  let sort: number;
  if (fresh && !talkAfterLead) {
    kat = "nov";
    const info = leadInfo(leadAct);
    zashto = `🆕 лийд ${ddmm(leadAt, true)}${info ? ` · ${info}` : ""}${lastWrite ? ` · писахме ${ddmm(lastWrite.occurred_at)}, без отговор` : ""}`;
    sort = -leadMs;
  } else if (hot) {
    kat = "topal";
    const st = c.stage === "negotiating" ? "преговори" : c.stage === "offer_sent" ? "оферта пратена" : c.stage === "presentation_sent" ? "презентация" : c.stage === "discovery" ? "проучване" : "говорили сме";
    zashto = `🔥 ${st}${oferta ? " · има оферта" : ""} · последно се чухме ${ddmm(lastTalk!.occurred_at)}`;
    sort = (STAGE_RANK[c.stage] ?? 6) * 1e13 + (oferta ? 0 : 5e12) - new Date(lastTalk!.occurred_at).getTime();
  } else if (!lastTalk && lastWrite) {
    kat = "pisano";
    const ch = lastWrite.activity_type === "viber_sent" ? "Viber" : lastWrite.activity_type === "whatsapp_sent" ? "WhatsApp" : "имейл";
    zashto = `✉️ писахме ${ddmm(lastWrite.occurred_at)} (${ch}) · никога не сме се чували · лийд ${ddmm(leadAt)}`;
    sort = -new Date(lastWrite.occurred_at).getTime();
  } else {
    kat = "star";
    zashto = lastTalk
      ? `🗂 чухме се ${ddmm(lastTalk.occurred_at)} · лийд ${ddmm(leadAt)}`
      : `🗂 лийд ${ddmm(leadAt)} · никога не сме се чували`;
    sort = -leadMs;
  }
  // Каквото е за днес (блоковете от календара) — най-горе в купчината си.
  if (due) sort -= 1e15;

  const posledno = past
    .filter(
      (a) =>
        !AUTO_AUTHORS.has(a.created_by ?? "") &&
        !LEAD_TYPES.includes(a.activity_type) &&
        !(a.title ?? "").startsWith("Корекция")
    )
    .slice(0, 2)
    .map((a) => {
      const body = (a.body ?? "").replace(/\s+/g, " ").trim().slice(0, 170);
      return `${ddmm(a.occurred_at)} · ${(a.title ?? a.activity_type).slice(0, 110)}${body ? ` — ${body}` : ""}`;
    });

  return {
    id: c.id,
    name: c.full_name?.trim() || "(без име)",
    company: c.company,
    tel,
    phone_pretty: phonePretty(tel),
    stage: c.stage,
    kat,
    sort,
    lead_at: leadAt,
    zashto,
    posledno,
    nevdigna,
    oferta,
    due,
    called_today: todayCall ? { title: todayCall.title ?? "Обаждане", at: todayCall.occurred_at } : null,
  };
}

// ── записът ─────────────────────────────────────────────────────────────────

export const ZV_OUTCOMES = ["govorihme", "interes", "nevdigna", "ne_iska", "belezhka"] as const;
export type ZvOutcome = (typeof ZV_OUTCOMES)[number];

export interface ZvPlan {
  activity_type: "call" | "note";
  title: string;
  followup_status?: FollowupStatus;
  stage?: ContactStage;
  mark_heard: boolean;
  /** Кога пак, ако Ивайло не е избрал. */
  default_preset: string | null;
}

export function outcomePlan(o: ZvOutcome): ZvPlan {
  switch (o) {
    case "govorihme":
      return { activity_type: "call", title: "Говорихме", followup_status: "called_waiting_feedback", mark_heard: true, default_preset: "3d" };
    case "interes":
      return { activity_type: "call", title: "Говорихме · интерес", followup_status: "interested", mark_heard: true, default_preset: "tomorrow" };
    case "nevdigna":
      return { activity_type: "call", title: "Не вдигна", followup_status: "needs_call", mark_heard: false, default_preset: "tomorrow" };
    case "ne_iska":
      return { activity_type: "call", title: "Не се интересува", followup_status: "not_interested", stage: "lost", mark_heard: true, default_preset: null };
    case "belezhka":
      return { activity_type: "note", title: "📝 Бележка от звъненето", mark_heard: false, default_preset: null };
  }
}

/** Петък е почивка за Ивайло, събота и неделя също — денят се мести на понеделник. */
export function skipRestDays(iso: string, tz: string = TZ): string {
  const d = new Date(iso);
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d);
  const add = wd === "Fri" ? 3 : wd === "Sat" ? 2 : wd === "Sun" ? 1 : 0;
  return new Date(d.getTime() + add * 86_400_000).toISOString();
}

/** „auto“ = според резултата; „none“ = без дата; иначе бутоните от дневника (утре, 3 дни…). */
export function nextCallAt(preset: string, outcome: ZvOutcome, now: Date): string | null {
  const p = preset === "auto" ? outcomePlan(outcome).default_preset : preset === "none" ? null : preset;
  if (!p) return null;
  const at = remindAtFromPreset(p, now);
  return at ? skipRestDays(at.toISOString()) : null;
}
