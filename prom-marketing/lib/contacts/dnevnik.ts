/**
 * Дневникът на връзката — чистите правила, без база и без "server-only".
 *
 * Един запис = един разговор с човека: откъде (телефон, среща…), как се е
 * чувствал, какво сме говорили, какво е обещал той, какво съм обещал аз, какво
 * е станало и кога да го чуя пак. Записът стои в contact_activities като
 * metadata.kind = "dnevnik", за да е в същата хронология с всичко останало;
 * тук е само формата му и как се чете.
 */
import { TZ, nextWorkingDayAt } from "./followup";
import { sofiaLocalToIso } from "@/lib/team/time";

export const MOODS = [
  { key: "zapalen", emoji: "🔥", label: "Запален", score: 5, color: "#f97316" },
  { key: "pozitiven", emoji: "🙂", label: "Позитивен", score: 4, color: "#22c55e" },
  { key: "neutralen", emoji: "😐", label: "Неутрален", score: 3, color: "#a3a3a3" },
  { key: "kolebliv", emoji: "🤔", label: "Колеблив", score: 2, color: "#facc15" },
  { key: "studen", emoji: "🧊", label: "Студен / раздразнен", score: 1, color: "#60a5fa" },
] as const;
export type MoodKey = (typeof MOODS)[number]["key"];
export type Mood = (typeof MOODS)[number];

export function moodOf(key: string | null | undefined): Mood | null {
  return MOODS.find((m) => m.key === key) ?? null;
}

export const CHANNELS = [
  { key: "phone", emoji: "📞", label: "Телефон", activity: "call" },
  { key: "meet", emoji: "🎥", label: "Онлайн среща", activity: "meeting" },
  { key: "live", emoji: "🤝", label: "На живо", activity: "meeting" },
  { key: "chat", emoji: "💬", label: "Viber / Messenger", activity: "note" },
  { key: "email", emoji: "✉️", label: "Имейл", activity: "email_received" },
] as const;
export type ChannelKey = (typeof CHANNELS)[number]["key"];

export function channelOf(key: string | null | undefined) {
  return CHANNELS.find((c) => c.key === key) ?? CHANNELS[0];
}

/** „Да го чуя пак“ — бързите избори. Денят е работен, часът е 10:00 в София. */
export const REMIND_PRESETS = [
  { key: "tomorrow", label: "утре", days: 1 },
  { key: "3d", label: "след 3 дни", days: 3 },
  { key: "1w", label: "след седмица", days: 7 },
  { key: "2w", label: "след 2 седмици", days: 14 },
  { key: "1m", label: "след месец", days: 30 },
] as const;
export type RemindPreset = (typeof REMIND_PRESETS)[number]["key"];

/**
 * Кога да напомни: `now + days`, но никога в събота/неделя (тогава понеделник)
 * и винаги в 10:00 софийско време — така напомнянето влиза в сутрешния списък.
 */
export function remindAtFromPreset(preset: string, now: Date = new Date(), tz: string = TZ): Date | null {
  const p = REMIND_PRESETS.find((x) => x.key === preset);
  if (!p) return null;
  if (p.days === 1) return nextWorkingDayAt(now, 10, tz);
  const target = new Date(now.getTime() + (p.days - 1) * 86_400_000);
  return nextWorkingDayAt(target, 10, tz);
}

/** Напомняне от формата: избор от бутоните или точен ден/час (datetime-local, София). */
export function resolveRemindAt(preset: string, custom: string, now: Date = new Date()): string | null {
  if (custom.trim()) return sofiaLocalToIso(custom);
  if (!preset || preset === "none") return null;
  return remindAtFromPreset(preset, now)?.toISOString() ?? null;
}

/** Ред в contact_promises — кой какво дължи и дали е изпълнено. */
export interface PromiseRow {
  id: string;
  contact_id: string;
  who: "them" | "us";
  text: string;
  due_at: string | null;
  done_at: string | null;
  activity_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DnevnikEntry {
  kind: "dnevnik";
  channel: ChannelKey;
  mood: MoodKey | null;
  talked: string;
  they_promised: string;
  we_promised: string;
  happened: string;
  next_step: string;
  remind_at: string | null;
}

/** Всяка непразна редица (или част след „;“) е отделно обещание. Най-много 10. */
export function splitPromises(text: string): string[] {
  return text
    .split(/\r?\n|;/)
    .map((s) => s.replace(/^[\s•\-–*]+/, "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function entryFromMetadata(meta: Record<string, unknown> | null | undefined): DnevnikEntry | null {
  if (!meta || meta.kind !== "dnevnik") return null;
  const s = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string) : "");
  const mood = moodOf(s("mood"))?.key ?? null;
  return {
    kind: "dnevnik",
    channel: channelOf(s("channel")).key,
    mood,
    talked: s("talked"),
    they_promised: s("they_promised"),
    we_promised: s("we_promised"),
    happened: s("happened"),
    next_step: s("next_step"),
    remind_at: s("remind_at") || null,
  };
}

function short(s: string, n = 60): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** Заглавието в хронологията: „📞 Телефон · 🙂 Позитивен · среща в петък“. */
export function entryTitle(e: Pick<DnevnikEntry, "channel" | "mood" | "next_step" | "happened" | "talked">): string {
  const ch = channelOf(e.channel);
  const mood = moodOf(e.mood);
  const gist = e.next_step || e.happened || e.talked;
  return [`${ch.emoji} ${ch.label}`, mood ? `${mood.emoji} ${mood.label}` : null, gist ? short(gist) : null]
    .filter(Boolean)
    .join(" · ");
}

/** Тялото — четимо и за Хермес, и за човек, който гледа картона без интерфейса. */
export function entryBody(e: DnevnikEntry, remindLabel: string | null): string {
  const lines: string[] = [];
  const mood = moodOf(e.mood);
  if (mood) lines.push(`Как се чувстваше: ${mood.emoji} ${mood.label}`);
  if (e.talked) lines.push(`Какво говорихме: ${e.talked}`);
  if (e.they_promised) lines.push(`Той обеща: ${e.they_promised}`);
  if (e.we_promised) lines.push(`Аз обещах: ${e.we_promised}`);
  if (e.happened) lines.push(`Какво стана: ${e.happened}`);
  if (e.next_step) lines.push(`Следваща стъпка: ${e.next_step}`);
  if (remindLabel) lines.push(`Да го чуя пак: ${remindLabel}`);
  return lines.join("\n");
}

/** Средно настроение от последните записи — стрелка нагоре/надолу за картона. */
export function moodTrend(moods: Array<MoodKey | null>): { avg: number | null; arrow: "up" | "down" | "flat" | null } {
  const scores: number[] = [];
  for (const m of moods) {
    const score = moodOf(m)?.score;
    if (typeof score === "number") scores.push(score);
  }
  if (scores.length === 0) return { avg: null, arrow: null };
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (scores.length < 2) return { avg, arrow: null };
  const [last, prev] = scores;
  return { avg, arrow: last > prev ? "up" : last < prev ? "down" : "flat" };
}

/** Инициали за кръгчето, когато няма снимка: „Иван Петров“ → „ИП“. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
