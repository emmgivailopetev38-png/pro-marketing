import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import { loadNapredak } from "./napredak";
import { SYSTEM_GUIDE, CLIENT_LINKS } from "./klient-materiali";
import { DONE_FOR_YOU, OBUCHENIE, PRODAZHBA_PRAVILA } from "./oferti-katalog";
import { STRATEGIA, UEBINAR } from "./uebinar-strategia";
import { tbiTable } from "@/lib/tbi";
import { TEAM_ROLE_SHORT } from "./types";
import type { TeamActor } from "./session";

/**
 * AI асистентът в /ekip (24.11.2026, Ивайло: „направи им и на тях AI агент
 * вътре, за улеснение“). Знае системата, офертите и цените, TBI, уебинара и
 * числата на човека; по телефон или име поглежда лийд. Без вътрешни пари
 * (комисионни, сметката на Ивайло) — те не са в контекста.
 */

const fmt = (n: number) => n.toLocaleString("bg-BG", { maximumFractionDigits: 2 });

function knowledge(): string {
  const guide = SYSTEM_GUIDE.map((s) => `## ${s.title}\n${s.items.map(([k, v]) => `- ${k}: ${v}`).join("\n")}`).join("\n\n");
  const offer = (list: typeof OBUCHENIE) =>
    list
      .map((o) => `- ${o.title} — ${o.price}${o.vat ? ` ${o.vat}` : ""}${o.after ? ` (${o.after})` : ""}. За кого: ${o.forWho} Включва: ${o.what.join("; ")}.${o.tbi ? ` TBI: ${o.tbi}.` : ""}`)
      .join("\n");
  const tbi = tbiTable(3900)
    .map((r) => `${r.months} мес. = ${fmt(r.monthly)} €/мес (общо ${fmt(r.total)} €, ${r.scheme.label})`)
    .join("; ");
  const strat = STRATEGIA.map((s) => `### ${s.title}\n${s.points.map((p) => `- ${p}`).join("\n")}`).join("\n");
  const links = CLIENT_LINKS.map((l) => `- ${l.title}: ${l.url}${l.personal ? "?ime=<Име>" : ""} — ${l.when}`).join("\n");
  return [
    "# Как работи системата (CRM-ът на ProMarketing, /ekip)",
    guide,
    "# Правилата на продажбата",
    PRODAZHBA_PRAVILA.map((r) => `- ${r}`).join("\n"),
    "# Оферти · Обучение (правим го с човека)",
    offer(OBUCHENIE),
    "# Оферти · Done for You (ние правим всичко)",
    offer(DONE_FOR_YOU),
    `# Вноски TBI за 3 900 €\n${tbi}. Формулата е анюитет по ГПР 19,47 % (над 2 000 €, до 48 мес.) или 23,79 % (до 60 мес.). Заявката се пуска в портала bnkl.tbibank.bg (потребител BICZ; паролата я дава Ивайло лично).`,
    `# Уебинарът „${UEBINAR.ime}“ — ${UEBINAR.koga}, лендинг ${UEBINAR.lending}. Офертата: ${UEBINAR.oferta}.`,
    strat,
    "# Какво се праща на клиента",
    links,
    "# Числата",
    "- DQ (неквалифициран): вдигна, говорихте, но не е за програмата. DQ % = DQ / вдигнали; целта е нисък DQ.",
    "- Booking rate = записани срещи / вдигнали. Явяване = дошли / (дошли + не дошли).",
  ].join("\n\n");
}

/** Лийд по телефон или име (без личните контакти на Ивайло). */
async function lookupLeads(question: string): Promise<string | null> {
  const sb = createServiceClient();
  const digits = question.replace(/[^\d+]/g, " ").split(/\s+/).find((t) => t.replace(/\D/g, "").length >= 7);
  type C = { id: string; full_name: string | null; phone: string | null; company: string | null; business: string | null; stage: string; next_followup_at: string | null; source: string | null };
  let found: C[] = [];
  const cols = "id, full_name, phone, company, business, stage, next_followup_at, source";
  if (digits) {
    const { data } = await sb.from("contacts").select(cols).in("phone", phoneVariants(digits)).not("source", "in", "(hermes,manual)").limit(3);
    found = (data ?? []) as C[];
  } else {
    const m = /(?:лийд|клиент|човек|картон|за)\s+([А-ЯA-Z][\p{L}-]+(?:\s+[А-ЯA-Z][\p{L}-]+)?)/u.exec(question);
    if (m) {
      const { data } = await sb.from("contacts").select(cols).ilike("full_name", `%${m[1].trim()}%`).not("source", "in", "(hermes,manual)").limit(3);
      found = (data ?? []) as C[];
    }
  }
  if (found.length === 0) return null;
  const { data: acts } = await sb
    .from("contact_activities")
    .select("contact_id, title, occurred_at, created_by")
    .in("contact_id", found.map((c) => c.id))
    .in("activity_type", ["call", "meeting", "meeting_outcome", "note", "voice_call", "offer_created", "stage_change"])
    .order("occurred_at", { ascending: false })
    .limit(30);
  return found
    .map((c) => {
      const h = ((acts ?? []) as Array<{ contact_id: string; title: string | null; occurred_at: string; created_by: string | null }>)
        .filter((a) => a.contact_id === c.id)
        .slice(0, 8)
        .map((a) => `  - ${a.occurred_at.slice(0, 16).replace("T", " ")} · ${a.title ?? ""}${a.created_by ? ` (${a.created_by})` : ""}`)
        .join("\n");
      return `Лийд: ${c.full_name ?? "без име"} · ${c.phone ?? ""} · ${c.company ?? c.business ?? ""} · етап ${c.stage}${c.next_followup_at ? ` · чуване ${c.next_followup_at.slice(0, 16).replace("T", " ")}` : ""}\n${h || "  - няма записани действия"}`;
    })
    .join("\n");
}

async function myNumbers(actor: TeamActor): Promise<string> {
  if (actor.kind !== "member") return "";
  try {
    const d = await loadNapredak({ days: 7, actorName: actor.member.full_name, actorKind: "member", memberId: actor.member.id, memberRole: actor.member.role });
    const v = d.me.cur.volume;
    const today = d.me.daily[0];
    return `Числата на ${actor.member.full_name} за последните 7 дни: ${v.calls} обаждания, ${v.reached} вдигнали, ${d.me.cur.meetings.booked} записани срещи, води срещи: ${d.me.cur.closer.held} дошли / ${d.me.cur.closer.noShow} не дошли, предстоят ${d.me.cur.closer.upcoming}, DQ ${v.dq + v.meetingDq}. Днес: ${today?.calls ?? 0} обаждания, ${today?.booked ?? 0} записани, ${today?.held ?? 0} дошли.`;
  } catch {
    return "";
  }
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export async function asistentPrompt(actor: TeamActor, turns: ChatTurn[]): Promise<{ system: string; user: string }> {
  const last = turns.filter((t) => t.role === "user").at(-1)?.text ?? "";
  const [nums, lead] = await Promise.all([myNumbers(actor), lookupLeads(last).catch(() => null)]);
  const who = actor.kind === "member" ? `${actor.member.full_name} (${TEAM_ROLE_SHORT[actor.member.role]})` : "Ивайло (собственикът)";
  const system = [
    `Ти си AI асистентът в CRM-а на ProMarketing (Ивайло Петев, AI маркетинг и автоматизации). Говориш с ${who} от екипа по продажбите.`,
    "Отговаряй на български, кратко и конкретно — като опитен колега по продажбите. Стъпки — номерирани. Без измислени цени, числа и обещания: ползвай само знанието долу. Ако нещо го няма — кажи го и препоръчай бутона „🛠 Корекция / въпрос към Ивайло“ вдясно.",
    "Никога не обещавай доход, гаранции извън записаното и отстъпки извън правилата. Не говори за вътрешни комисионни и сметки.",
    "Можеш да пишеш готови реплики за разговор, отговори на възражения, съобщения по Viber до лийд (кратки, на „Вие“ ако не е казано друго, с линка за записване), и да обясняваш как се прави нещо в системата.",
    knowledge(),
    nums ? `# Числата на човека\n${nums}` : "",
    lead ? `# Лийдовете, за които пита (от CRM-а, на живо)\n${lead}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const user = turns
    .slice(-10)
    .map((t) => `${t.role === "user" ? "Въпрос" : "Твой отговор"}: ${t.text.slice(0, 2000)}`)
    .join("\n\n");
  return { system, user };
}
