import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { dayKey } from "./followup";
import type { ContactStage } from "./types";
import { channelOf, entryBody, entryTitle, moodOf, splitPromises, type DnevnikEntry, type PromiseRow } from "./dnevnik";
export type { PromiseRow };
import { fmtSofia } from "@/lib/team/time";

/**
 * Дневникът на връзката — записът в базата.
 *
 * Един разговор = една активност (metadata.kind = "dnevnik") + настроението и
 * напомнянето върху картона + обещанията като редове, които се отмятат.
 * Снимките са в частния бъкет contact-photos и се раздават само с подписан линк.
 */

export const PHOTO_BUCKET = "contact-photos";
export const PHOTO_URL_TTL = 60 * 60; // 1 час — колкото живее една отворена страница
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type Sb = ReturnType<typeof createServiceClient>;

function contactedIfLead(stage: ContactStage, activityType: string): ContactStage | null {
  return stage === "lead" && (activityType === "call" || activityType === "meeting") ? "contacted" : null;
}

export async function recordDnevnik(input: {
  contactId: string;
  actor: string;
  entry: DnevnikEntry;
  occurredAt?: string | null;
}): Promise<{ ok: true; activityId: string; promises: number; remindAt: string | null } | { ok: false; error: string }> {
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("id, stage, next_followup_at").eq("id", input.contactId).maybeSingle();
  if (!c) return { ok: false, error: "Картонът не е намерен" };

  const e = input.entry;
  const nowIso = new Date().toISOString();
  const occurredAt = input.occurredAt && !Number.isNaN(new Date(input.occurredAt).getTime()) ? input.occurredAt : nowIso;
  const type = channelOf(e.channel).activity;
  const remindLabel = e.remind_at ? fmtSofia(e.remind_at) : null;

  const { data: act, error: actErr } = await sb
    .from("contact_activities")
    .insert({
      contact_id: c.id,
      activity_type: type,
      title: entryTitle(e),
      body: entryBody(e, remindLabel) || null,
      occurred_at: occurredAt,
      metadata: {
        kind: "dnevnik",
        channel: e.channel,
        mood: e.mood,
        talked: e.talked,
        they_promised: e.they_promised,
        we_promised: e.we_promised,
        happened: e.happened,
        next_step: e.next_step,
        remind_at: e.remind_at,
      },
      created_by: input.actor,
    })
    .select("id")
    .single();
  if (actErr || !act) return { ok: false, error: `Разговорът не се записа: ${actErr?.message ?? "insert failed"}` };

  // Картонът: чут е сега; настроението; напомнянето „да го чуя пак“.
  const patch: Record<string, unknown> = { last_heard_from_at: nowIso };
  if (moodOf(e.mood)) {
    patch.mood = e.mood;
    patch.mood_updated_at = nowIso;
  }
  if (e.remind_at) {
    patch.next_followup_at = e.remind_at;
    patch.followup_status = "needs_call";
  } else if (typeof c.next_followup_at === "string" && dayKey(c.next_followup_at) <= dayKey(nowIso)) {
    // Обещаното обаждане е направено — напомнянето си свърши работата.
    patch.next_followup_at = null;
  }
  const nextStage = contactedIfLead((c.stage ?? "lead") as ContactStage, type);
  if (nextStage) patch.stage = nextStage;
  const { error: patchErr } = await sb.from("contacts").update(patch).eq("id", c.id);
  if (patchErr) return { ok: false, error: `Картонът не се обнови: ${patchErr.message}` };

  // Обещанията — по едно на ред, за да се отмятат поотделно.
  const rows = [
    ...splitPromises(e.they_promised).map((text) => ({ who: "them" as const, text })),
    ...splitPromises(e.we_promised).map((text) => ({ who: "us" as const, text })),
  ].map((p) => ({ ...p, contact_id: c.id, activity_id: act.id, created_by: input.actor, due_at: e.remind_at }));
  if (rows.length > 0) {
    const { error } = await sb.from("contact_promises").insert(rows);
    if (error) return { ok: false, error: `Обещанията не се записаха: ${error.message}` };
  }

  return { ok: true, activityId: act.id, promises: rows.length, remindAt: e.remind_at };
}

export async function setPromiseDone(id: string, done: boolean): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("contact_promises")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function addPromise(input: {
  contactId: string;
  who: "them" | "us";
  text: string;
  dueAt?: string | null;
  actor: string;
}): Promise<{ error: string | null }> {
  const text = input.text.trim();
  if (!text) return { error: "Празно обещание" };
  const sb = createServiceClient();
  const { error } = await sb.from("contact_promises").insert({
    contact_id: input.contactId,
    who: input.who,
    text,
    due_at: input.dueAt ?? null,
    created_by: input.actor,
  });
  return { error: error?.message ?? null };
}

export async function listPromises(contactId: string): Promise<PromiseRow[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("contact_promises")
    .select("*")
    .eq("contact_id", contactId)
    .order("done_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as PromiseRow[];
}

/** Отворените обещания на много хора наведнъж — за списъка за проследяване. */
export async function openPromisesByContact(contactIds: string[]): Promise<Map<string, PromiseRow[]>> {
  const out = new Map<string, PromiseRow[]>();
  if (contactIds.length === 0) return out;
  const sb = createServiceClient();
  const { data } = await sb
    .from("contact_promises")
    .select("*")
    .in("contact_id", contactIds)
    .is("done_at", null)
    .order("created_at", { ascending: true })
    .limit(2000);
  for (const p of (data ?? []) as PromiseRow[]) {
    const list = out.get(p.contact_id) ?? [];
    list.push(p);
    out.set(p.contact_id, list);
  }
  return out;
}

// ── Снимки ──────────────────────────────────────────────────────────────────

export function isHttpUrl(s: string | null | undefined): boolean {
  return !!s && /^https?:\/\//i.test(s);
}

/** Линкът, който браузърът може да покаже: външен адрес както е, път в бъкета → подписан. */
export async function photoSrc(photoUrl: string | null | undefined): Promise<string | null> {
  if (!photoUrl) return null;
  if (isHttpUrl(photoUrl)) return photoUrl;
  const sb = createServiceClient();
  const { data } = await sb.storage.from(PHOTO_BUCKET).createSignedUrl(photoUrl, PHOTO_URL_TTL);
  return data?.signedUrl ?? null;
}

/** Същото за списък — един заявка за всички пътища. */
export async function photoSrcMany(photoUrls: Array<string | null | undefined>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const paths = [...new Set(photoUrls.filter((p): p is string => !!p))];
  for (const p of paths) if (isHttpUrl(p)) out.set(p, p);
  const stored = paths.filter((p) => !isHttpUrl(p));
  if (stored.length === 0) return out;
  const sb = createServiceClient();
  const { data } = await sb.storage.from(PHOTO_BUCKET).createSignedUrls(stored, PHOTO_URL_TTL);
  for (const row of data ?? []) {
    if (row.signedUrl && row.path) out.set(row.path, row.signedUrl);
  }
  return out;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Сваля снимка от адрес (профил, сайт, кадър от Fathom) — само картинки, до 10 MB. */
export async function fetchPhotoFromUrl(url: string): Promise<{ buf: Buffer; mime: string } | { error: string }> {
  if (!isHttpUrl(url)) return { error: "Невалиден адрес" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return { error: `Адресът върна ${res.status}` };
    const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!EXT_BY_MIME[mime]) return { error: `Не е картинка (${mime || "без тип"})` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return { error: "Празен файл" };
    if (buf.length > MAX_PHOTO_BYTES) return { error: "Снимката е над 10 MB" };
    return { buf, mime };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Неуспешно сваляне" };
  } finally {
    clearTimeout(timer);
  }
}

export async function storeContactPhoto(input: {
  contactId: string;
  buf: Buffer;
  mime: string;
  source: "upload" | "url" | "fathom";
  actor: string;
  note?: string | null;
}): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const ext = EXT_BY_MIME[input.mime];
  if (!ext) return { ok: false, error: `Неподдържан формат: ${input.mime}` };
  if (input.buf.length > MAX_PHOTO_BYTES) return { ok: false, error: "Снимката е над 10 MB" };
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("id, photo_url").eq("id", input.contactId).maybeSingle();
  if (!c) return { ok: false, error: "Картонът не е намерен" };

  const path = `${c.id}/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from(PHOTO_BUCKET).upload(path, input.buf, { contentType: input.mime, upsert: false });
  if (upErr) return { ok: false, error: `Качването не мина: ${upErr.message}` };

  const nowIso = new Date().toISOString();
  const { error } = await sb
    .from("contacts")
    .update({ photo_url: path, photo_source: input.source, photo_updated_at: nowIso })
    .eq("id", c.id);
  if (error) {
    await sb.storage.from(PHOTO_BUCKET).remove([path]).catch(() => null);
    return { ok: false, error: `Картонът не се обнови: ${error.message}` };
  }
  await removeStoredPhoto(sb, c.photo_url);
  await sb
    .from("contact_activities")
    .insert({
      contact_id: c.id,
      activity_type: "note",
      title: input.source === "fathom" ? "🖼️ Снимка от срещата във Fathom" : "🖼️ Нова снимка на картона",
      body: input.note ?? null,
      occurred_at: nowIso,
      created_by: input.actor,
      metadata: { kind: "photo", source: input.source, path },
    })
    .then(() => null, () => null);
  return { ok: true, path };
}

export async function removeContactPhoto(contactId: string): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("id, photo_url").eq("id", contactId).maybeSingle();
  if (!c) return { error: "Картонът не е намерен" };
  const { error } = await sb
    .from("contacts")
    .update({ photo_url: null, photo_source: null, photo_updated_at: new Date().toISOString() })
    .eq("id", c.id);
  if (error) return { error: error.message };
  await removeStoredPhoto(sb, c.photo_url);
  return { error: null };
}

async function removeStoredPhoto(sb: Sb, previous: string | null | undefined): Promise<void> {
  if (!previous || isHttpUrl(previous)) return;
  await sb.storage.from(PHOTO_BUCKET).remove([previous]).catch(() => null);
}
