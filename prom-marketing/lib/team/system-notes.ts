import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegram } from "@/lib/notifications/telegram";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { getMemberById } from "./repository";

/**
 * Бележки за системата. Всеки от екипа (и Ивайло) пише какво в CRM-а или в
 * процеса му пречи или може да е по-лесно — „тук ми трябва бутон…“, „тази
 * стъпка е излишна…“. Ивайло ги преглежда на едно място (/admin/belezhki),
 * отбелязва видяна / направено / отхвърлена и може да отговори.
 *
 * Известията са странични и никога не провалят записа: нова бележка от екипа →
 * Telegram до Ивайло; статус или отговор от Ивайло → писмо до автора, ако е
 * човек от екипа (имейлът му е в team_members).
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");
const OWNER_NAME = process.env.ADMIN_ACTOR || "Ивайло";

export const NOTE_AREAS = [
  { key: "crm", label: "CRM-ът · екрани и бутони" },
  { key: "process", label: "Процесът · как работим" },
  { key: "idea", label: "Идея" },
  { key: "bug", label: "Грешка / нещо счупено" },
  { key: "other", label: "Друго" },
] as const;
export type NoteArea = (typeof NOTE_AREAS)[number]["key"];
export const NOTE_AREA_LABEL = Object.fromEntries(NOTE_AREAS.map((a) => [a.key, a.label])) as Record<NoteArea, string>;

export const NOTE_STATUSES = ["new", "seen", "done", "dismissed"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];
export const NOTE_STATUS_LABEL: Record<NoteStatus, string> = {
  new: "Нова",
  seen: "Видяна",
  done: "Направено",
  dismissed: "Отхвърлена",
};

export function isNoteArea(v: unknown): v is NoteArea {
  return typeof v === "string" && NOTE_AREAS.some((a) => a.key === v);
}

export function isNoteStatus(v: unknown): v is NoteStatus {
  return typeof v === "string" && (NOTE_STATUSES as readonly string[]).includes(v);
}

export function areaLabel(area: string): string {
  return isNoteArea(area) ? NOTE_AREA_LABEL[area] : area;
}

export interface SystemNote {
  id: string;
  /** „owner“ за Ивайло, иначе team_members.id */
  author_key: string;
  author_name: string;
  area: NoteArea;
  text: string;
  status: NoteStatus;
  owner_reply: string | null;
  /** от кой екран е писана (href), по желание */
  page: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const COLS = "id, author_key, author_name, area, text, status, owner_reply, page, created_at, updated_at, resolved_at";
const MAX_TEXT = 4000;

/** Един ред, за тема на писмо. */
function short(text: string, max: number): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

/** Реже дългото, пази редовете — за Telegram. */
function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Бележките на един човек, най-новите най-горе. */
export async function listNotesFor(authorKey: string): Promise<SystemNote[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("system_notes")
    .select(COLS)
    .eq("author_key", authorKey)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as SystemNote[];
}

/** Всички бележки — за таблото на Ивайло. */
export async function listAllNotes(): Promise<SystemNote[]> {
  const sb = createServiceClient();
  const { data } = await sb.from("system_notes").select(COLS).order("created_at", { ascending: false }).limit(500);
  return (data ?? []) as SystemNote[];
}

export async function getNote(id: string): Promise<SystemNote | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("system_notes").select(COLS).eq("id", id).maybeSingle();
  return (data as SystemNote | null) ?? null;
}

/** Колко чакат поглед — за менюто и сутрешното писмо. */
export async function countNewNotes(): Promise<number> {
  const sb = createServiceClient();
  const { count } = await sb.from("system_notes").select("id", { count: "exact", head: true }).eq("status", "new");
  return count ?? 0;
}

export interface NewNote {
  authorKey: string;
  authorName: string;
  area?: string | null;
  text: string;
  page?: string | null;
}

/**
 * Нова бележка. Ивайло научава в Telegram веднага; за собствените си бележки
 * не звъни на себе си. Авторът не получава нищо — той току-що я е написал.
 */
export async function createNote(input: NewNote): Promise<{ id: string | null; error: string | null }> {
  const text = input.text.trim();
  if (!text) return { id: null, error: "Напиши какво ти пречи или какво би било по-лесно." };
  const area: NoteArea = isNoteArea(input.area) ? input.area : "crm";
  const page = input.page?.trim().slice(0, 300) || null;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("system_notes")
    .insert({
      author_key: input.authorKey,
      author_name: input.authorName.trim() || "—",
      area,
      text: text.slice(0, MAX_TEXT),
      page,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "insert failed" };

  if (input.authorKey !== "owner") {
    const lines = [
      `📝 <b>Бележка за системата</b> от <b>${escapeHtml(input.authorName)}</b>`,
      escapeHtml(NOTE_AREA_LABEL[area]),
      escapeHtml(clip(text, 600)),
      page ? `Екран: ${escapeHtml(page)}` : null,
    ].filter(Boolean) as string[];
    await sendTelegram(lines.join("\n"), { buttons: [{ text: "Бележките", url: `${SITE}/admin/belezhki` }] }).catch(() => false);
  }
  return { id: data.id as string, error: null };
}

/**
 * Статус (и по желание отговор) от Ивайло. `reply` = undefined оставя стария
 * отговор; празен низ го трие. Ако нещо реално се е променило, авторът от
 * екипа получава писмо.
 */
export async function setNoteStatus(
  id: string,
  status: NoteStatus,
  reply?: string | null
): Promise<{ error: string | null; note: SystemNote | null }> {
  if (!isNoteStatus(status)) return { error: "Непознат статус.", note: null };
  const prev = await getNote(id);
  if (!prev) return { error: "Бележката не е намерена.", note: null };
  const now = new Date().toISOString();
  const closed = status === "done" || status === "dismissed";
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
    resolved_at: closed ? prev.resolved_at ?? now : null,
  };
  if (reply !== undefined) patch.owner_reply = reply?.trim().slice(0, MAX_TEXT) || null;
  const sb = createServiceClient();
  const { data, error } = await sb.from("system_notes").update(patch).eq("id", id).select(COLS).single();
  if (error || !data) return { error: error?.message ?? "update failed", note: null };
  const note = data as SystemNote;
  const changed = note.status !== prev.status || (note.owner_reply ?? "") !== (prev.owner_reply ?? "");
  if (changed) await notifyAuthor(note, prev).catch(() => {});
  return { error: null, note };
}

/** Писмо до човека от екипа: Ивайло видя / направи / отговори. Никога не хвърля. */
async function notifyAuthor(note: SystemNote, prev: SystemNote): Promise<void> {
  if (note.author_key === "owner") return;
  const member = await getMemberById(note.author_key).catch(() => null);
  const to = member?.email?.trim();
  if (!to) return;

  const status: NoteStatus = isNoteStatus(note.status) ? note.status : "seen";
  const replied = !!note.owner_reply && note.owner_reply !== (prev.owner_reply ?? "");
  const snippet = short(note.text, 48);
  const lead: Record<NoteStatus, string> = {
    new: `${OWNER_NAME} върна бележката ти при новите — ще я гледа пак.`,
    seen: replied
      ? `${OWNER_NAME} видя бележката ти и ти отговори.`
      : `${OWNER_NAME} видя бележката ти. Щом има движение по нея, ще разбереш оттук.`,
    done: `Направено! ${OWNER_NAME} отметна бележката ти като свършена.`,
    dismissed: `${OWNER_NAME} я прегледа — засега остава както е.`,
  };
  const subjects: Record<NoteStatus, string> = {
    new: `📝 Бележката ти е пак при новите · „${snippet}“`,
    seen: replied ? `💬 ${OWNER_NAME} отговори на бележката ти · „${snippet}“` : `👀 ${OWNER_NAME} видя бележката ти · „${snippet}“`,
    done: `✅ Направено · „${snippet}“`,
    dismissed: `📝 Засега остава така · „${snippet}“`,
  };
  const link = `${SITE}/ekip/belezhki`;
  const quote = (t: string, color: string, bg: string) =>
    `<blockquote style="margin:0;padding:10px 14px;border-left:3px solid ${color};background:${bg};white-space:pre-wrap;">${escapeHtml(t)}</blockquote>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${escapeHtml(lead[status])}</strong></p>
<p style="margin-bottom:4px;color:#777;font-size:13px;">Твоята бележка · ${escapeHtml(areaLabel(note.area))}</p>
${quote(note.text, "#0891b2", "#f3f7fa")}
${note.owner_reply ? `<p style="margin:14px 0 4px;"><strong>${escapeHtml(OWNER_NAME)}:</strong></p>${quote(note.owner_reply, "#f59e0b", "#fff8e6")}` : ""}
<p style="margin-top:18px;"><a href="${link}" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Бележките ти</a></p>
<p style="color:#777;font-size:13px;">Благодаря, че го написа — така системата става по-удобна за всички. Има ли още нещо, пиши го пак там.</p>
</div>`;
  const text = [
    lead[status],
    "",
    `Твоята бележка (${areaLabel(note.area)}):`,
    note.text,
    ...(note.owner_reply ? ["", `${OWNER_NAME}:`, note.owner_reply] : []),
    "",
    link,
  ].join("\n");

  await sendEmail({ to, subject: subjects[status], html, text }).catch(() => null);
}
