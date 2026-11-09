import "server-only";
import { sendEmail } from "./resend";
import { CLOSING_KEY, WARM_SEQUENCE, subjectFor, trackFor, warmStepsFor, type WarmTrack } from "./warm-steps";
import { firstName, type BuildCtx, type SequenceStep } from "./sequence-layout";
import { unsubscribeUrl } from "./unsubscribe-token";
import { loadClientMap } from "./klienti";
import { normEmail, type ClientWhy } from "./klienti-rules";
import type { createServiceClient } from "@/lib/supabase/service";
import { AUTOMATION_EXCLUDED_STAGES, automationSkipReason } from "./sequence-guard";
import { chunks } from "@/lib/array";
import { allRows } from "@/lib/supabase/all-rows";

type Sb = ReturnType<typeof createServiceClient>;

/**
 * ТОПЛИЯТ КРЪГ — автоматичните писма след като човекът вече е реагирал.
 *
 * Студената поредица (`lead-sequence.ts`) спира при първия признак на живот:
 * обаждане, среща или отговор. Дотогава беше и краят на автоматиката, тоест
 * всеки, с когото Ивайло се е чул веднъж, изпадаше в тишина между обажданията.
 * Тук поредицата поема нататък и НЕ спира при разговор — целта е човекът да
 * стои топъл между чуванията, с полезни неща вместо с напомняния.
 *
 * Кой влиза:
 *   • всеки, който вече е говорил с нас (разговор, среща или чуване), И
 *   • всеки, при когото студената поредица е изтекла (12 дни след влизането),
 * стига да е бил докоснат в последните `MAX_SILENCE_DAYS` дни.
 *
 * Кой НЕ влиза:
 *   • клиентите и хората в програмата — `won`, платили, Академията, ръчният
 *     знак `no_auto_email`, проформа (виж klienti-rules.ts). Ивайло, 16.10.2026:
 *     „Моите клиенти, аз си комуникирам с тях, няма нужда да им пращаме
 *     повече имейли.“ Важи и за другите им картони със същия имейл;
 *   • отписалите се — един клик в подписа и повече нищо не тръгва;
 *   • `lost` върви на половин темпо (виж `paceFor`), а не спира: „не сега"
 *     почти никога не значи „никога", но значи „по-рядко".
 *
 * Кое писмо получава — решава пътеката (`trackFor` в `warm-steps.ts`): човек
 * с оферта на масата получава писмата след оферта, човек с презентация —
 * писмата след презентация, човек, с когото само сме се чули — какво обещах.
 * После всички минават през общия кръг. Пътеката се сменя от етапа и статуса
 * в CRM-а, тоест Ивайло я управлява с едно кликване в картона.
 */

/** Дни след последното докосване, преди топлият кръг да проговори. */
const QUIET_DAYS = 3;

/** Минимум дни между две наши писма — важи и за ръчно пратените. */
const MIN_GAP_DAYS = 7;

/** След толкова дни студената поредица е изтекла и топлата поема. */
const COLD_TAIL_DAYS = 12;

/**
 * Контакт, който не е докосван от толкова дни, е архив, а не топъл лийд.
 * Предпазителят пази 147-те исторически лийда, внесени наведнъж през август,
 * от това да получат писмо заради един деплой.
 */
const MAX_SILENCE_DAYS = 45;

/** Таван за едно пускане — крон-ът е дневен, така пикът се разстила. */
const MAX_PER_RUN = 25;

/** Етапи, при които автоматиката мълчи — won и lost (sequence-guard.ts, 25.10.2026). */
const EXCLUDED_STAGES = AUTOMATION_EXCLUDED_STAGES;

/** Активности, които броим за „докоснахме се" — meta_lead/website_form не са. */
const TOUCH_TYPES = ["call", "meeting", "email_sent"];

interface WarmContact {
  id: string;
  full_name: string | null;
  email: string | null;
  stage: string;
  followup_status: string | null;
  created_at: string;
  last_heard_from_at: string | null;
}

interface Touches {
  /** Първи истински контакт с човека — оттук се мери кръгът. */
  firstTalk: number | null;
  /** Последно докосване от която и да е страна. */
  lastTouch: number | null;
  /** Последното НАШЕ писмо. */
  lastEmail: number | null;
  /** Изпратените стъпки — по ключ. */
  sentKeys: Set<string>;
  /** Човекът е казал „стига". */
  optedOut: boolean;
}

const DAY = 86_400_000;

/**
 * Незаинтересованите (followup_status) получават същото съдържание, но на
 * половин темпо. Загубените (stage=lost) от 25.10.2026 не получават нищо —
 * sequence-guard.ts ги спира преди да стигнат дотук. „Не сега" почти никога не значи „никога" — значи „по-рядко". Спира се
 * само с отписване, което е решение на човека отсреща, не наша преценка.
 */
function paceFor(c: Pick<WarmContact, "stage" | "followup_status">): number {
  return c.stage === "lost" || c.followup_status === "not_interested" ? 2 : 1;
}

/**
 * Началото на топлия кръг за един контакт.
 *
 * Първо истинско докосване, ако има такова. Ако няма — 12 дни след влизането,
 * тоест точно когато студената поредица си е казала думата и е замълчала.
 */
export function warmStartAt(c: WarmContact, t: Touches): number {
  const candidates = [
    t.firstTalk,
    c.last_heard_from_at ? new Date(c.last_heard_from_at).getTime() : null,
    new Date(c.created_at).getTime() + COLD_TAIL_DAYS * DAY,
  ].filter((x): x is number => x !== null);
  return Math.min(...candidates);
}

/**
 * Следващата стъпка за този контакт — или причината да мълчим.
 *
 * Върви по РЕДА на писмата, а не по календара: който влиза късно, пак минава
 * през цялото съдържание отначало. Календарът решава само КОГА, не КОЕ.
 * Редът е: пътеката за неговия етап, после общият кръг. Смени ли се етапът
 * (оферта след разговор), следващото писмо е първото от новата пътека —
 * ключовете са различни, така че нищо вече пратено не се повтаря.
 */
export function nextWarmStep(
  c: WarmContact,
  t: Touches,
  now: number
): { step: SequenceStep; track: WarmTrack } | { skip: string } {
  // Дубликати и won/lost — никога, дори ако са минали през заявката (25.10.2026).
  const guard = automationSkipReason(c);
  if (guard) return { skip: guard };
  if (t.optedOut) return { skip: "opted_out" };
  if (!c.email) return { skip: "no_email" };

  const pace = paceFor(c);

  const lastTouch = t.lastTouch ?? 0;
  if (lastTouch && now - lastTouch > MAX_SILENCE_DAYS * DAY) return { skip: "too_cold" };
  if (!lastTouch && now - new Date(c.created_at).getTime() > MAX_SILENCE_DAYS * DAY) {
    return { skip: "too_cold" };
  }

  // Току-що сме говорили — човекът няма нужда от писмо утре сутрин.
  if (lastTouch && now - lastTouch < QUIET_DAYS * DAY) return { skip: "just_talked" };

  const track = trackFor(c, t.firstTalk !== null);
  const steps = warmStepsFor(track);
  const ctx: BuildCtx = { stage: c.stage, followupStatus: c.followup_status };

  const start = warmStartAt(c, t);
  if (now - start < steps[0].afterDays * pace * DAY) return { skip: "not_started" };

  const step = steps.find((s) => !t.sentKeys.has(s.key) && !s.skipFor?.(ctx));
  if (!step) return { skip: "sequence_done" };

  // Между две наши писма стои разстояние, независимо кой ги е пратил — ръчният
  // имейл на Ивайло също се брои, иначе автоматиката говори върху него.
  // Писмата след оферта вървят по-начесто (`gapDays`); след „трите врати"
  // темпото пада наполовина — оттам идва само новото, по-рядко.
  const slow = t.sentKeys.has(CLOSING_KEY) ? 2 : 1;
  const gap = (step.gapDays ?? MIN_GAP_DAYS) * pace * slow;
  if (t.lastEmail && now - t.lastEmail < gap * DAY) return { skip: "too_soon" };

  return { step, track };
}

/** Изпраща една топла стъпка. Идемпотентно по (contact_id, step.key). */
export async function sendWarmStep(args: {
  supabase: Sb;
  contactId: string;
  to: string;
  fullName: string | null;
  stage: string;
  followupStatus?: string | null;
  track?: WarmTrack;
  step: SequenceStep;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const { supabase, contactId, to, fullName, stage, followupStatus, track, step } = args;

  // .limit(1), не .maybeSingle(): при два записа за една стъпка maybeSingle
  // връща грешка без данни — и писмото тръгваше пак (10.11.2026).
  const { data: already, error: alreadyErr } = await supabase
    .from("contact_activities")
    .select("id")
    .eq("contact_id", contactId)
    .eq("activity_type", "email_sent")
    .contains("metadata", { seq_step: step.key })
    .limit(1);
  if (alreadyErr) return { sent: false, skipped: "already_check_failed" };
  if (already && already.length > 0) return { sent: false, skipped: "already_sent" };

  const ctx: BuildCtx = { contactId, stage, followupStatus, unsubscribeUrl: unsubscribeUrl(contactId) };
  const { html, text } = step.build(firstName(fullName), ctx);
  const subject = subjectFor(step, ctx);

  // Тестовият режим праща всичко на един адрес — така целият кръг се чете от
  // истинска пощенска кутия, преди да тръгне към хора.
  const testTo = process.env.WARM_SEQUENCE_TEST_TO;
  const recipient = testTo || to;
  const finalSubject = testTo ? `[тест → ${to}] ${subject}` : subject;

  const res = await sendEmail({
    to: recipient,
    subject: finalSubject,
    html,
    text,
    replyTo: process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com",
  });

  if (res.error) {
    await supabase.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "note",
      title: `Топлият имейл не тръгна (${step.key})`,
      body: res.error,
      metadata: { warm_step_failed: step.key },
      created_by: "warm_sequence",
    });
    return { sent: false, error: res.error };
  }

  await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "email_sent",
    title: `Топъл кръг · ${subject}`,
    body: `Автоматично писмо до ${to}. Отговорите идват в Gmail-а.`,
    metadata: { seq_step: step.key, warm: true, warm_track: track ?? null, resend_id: res.id, to: recipient, auto: true },
    created_by: "warm_sequence",
  });
  return { sent: true };
}

/**
 * Един такт на топлия кръг. Върви в дневния крон, след студената поредица.
 *
 * Праща наистина. `WARM_SEQUENCE_ENABLED=false` го спира изцяло, `=dry` го
 * връща в пробен режим — смята кого би докоснал и не праща нищо. До 05.09.2026
 * пробният режим беше по подразбиране, докато Ивайло не прочете 24-те писма;
 * прочете ги и каза „довърши на 100%", затова редът се обърна тук, в кода —
 * ключът във Vercel не можеше да бъде сложен от тази страна.
 */
export async function runWarmSequence(supabase: Sb): Promise<{
  mode: "off" | "dry" | "live";
  checked: number;
  sent: number;
  skipped: Record<string, number>;
  details: Array<{ contact_id: string; name: string | null; step: string; track: WarmTrack }>;
}> {
  const enabled = (process.env.WARM_SEQUENCE_ENABLED ?? "").toLowerCase();
  const mode: "off" | "dry" | "live" = enabled === "false" ? "off" : enabled === "dry" ? "dry" : "live";
  const out = {
    mode,
    checked: 0,
    sent: 0,
    skipped: {} as Record<string, number>,
    details: [] as Array<{ contact_id: string; name: string | null; step: string; track: WarmTrack }>,
  };
  if (mode === "off") return out;

  const floor = new Date(Date.now() - MAX_SILENCE_DAYS * DAY).toISOString();
  const excluded = `(${EXCLUDED_STAGES.join(",")})`;

  // Всичко се чете на страници (allRows, lib/supabase/all-rows.ts). До 10.11.2026
  // тук имаше .limit(300) за хората и ЕДНА заявка за активностите им (4 263 реда),
  // от които Supabase връщаше само първите 1 000 → кръгът не виждаше пратените
  // писма и стоеше на първото (374 души с 1-во, 3 с 3-то, никой нататък), а
  // не виждаше и част от отказите (5 писма до отписали се). Не се прочете ли
  // нещо — грешката се хвърля ПРЕДИ първото писмо: днес не тръгва нищо, а
  // сутрешният отчет казва „Топлият кръг: грешка — …“ вместо тих празен ден.
  const contacts = await rowsOrThrow<WarmContact>("хората", (from, to) =>
    supabase
      .from("contacts")
      .select("id, full_name, email, stage, followup_status, created_at, last_heard_from_at, updated_at")
      .not("stage", "in", excluded)
      .not("email", "is", null)
      // Тригерът contact_activities_bump_parent мести updated_at при всяка нова
      // активност (вкл. нашите писма) — затова този прозорец не изпуска никого.
      .gte("updated_at", floor)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
  );
  if (contacts.length === 0) return out;
  const acts: WarmActivity[] = [];
  for (const part of chunks(contacts.map((c) => c.id), ID_CHUNK)) {
    acts.push(
      ...(await rowsOrThrow<WarmActivity>("активностите", (from, to) =>
        supabase
          .from("contact_activities")
          .select("id, contact_id, activity_type, occurred_at, created_at, metadata")
          .in("contact_id", part)
          .in("activity_type", TOUCH_TYPES)
          .order("occurred_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to)
      ))
    );
  }
  const optOut = await loadOptOuts(supabase);

  // Клиентите не получават автоматични писма. Не се знае ли кои са — днес
  // не тръгва нищо, утре пак: пропуснато писмо е по-евтино от писмо до клиент.
  // Грешката се хвърля, за да я покаже сутрешният отчет (10.11.2026).
  let clients: Map<string, ClientWhy>;
  try {
    clients = await loadClientMap(contacts, supabase);
  } catch (e) {
    throw new Error(`топлият кръг не провери кои са клиенти: ${e instanceof Error ? e.message : String(e)}`);
  }

  const byContact = new Map<string, Touches>();
  for (const c of contacts) {
    const email = normEmail(c.email);
    const optedOut = optOut.ids.has(c.id) || (email !== "" && optOut.emails.has(email));
    byContact.set(c.id, { firstTalk: null, lastTouch: null, lastEmail: null, sentKeys: new Set(), optedOut });
  }
  for (const a of acts) {
    const t = byContact.get(a.contact_id);
    if (!t) continue;
    const meta = (a.metadata ?? {}) as Record<string, unknown>;
    if (meta.email_opt_out === true) t.optedOut = true;
    if (typeof meta.seq_step === "string") t.sentKeys.add(meta.seq_step);
    if (!TOUCH_TYPES.includes(a.activity_type)) continue;
    const at = new Date(a.occurred_at ?? a.created_at).getTime();
    if (Number.isNaN(at)) continue;
    if (a.activity_type === "call" || a.activity_type === "meeting") {
      t.firstTalk = t.firstTalk === null ? at : Math.min(t.firstTalk, at);
    }
    if (a.activity_type === "email_sent") {
      t.lastEmail = t.lastEmail === null ? at : Math.max(t.lastEmail, at);
    }
    t.lastTouch = t.lastTouch === null ? at : Math.max(t.lastTouch, at);
  }

  // Най-дълго чакалите първи: таванът е 25 на ден, а чакащите са стотици —
  // старата подредба по updated_at даваше реда винаги на едни и същи картони.
  contacts.sort((a, b) => (byContact.get(a.id)!.lastEmail ?? 0) - (byContact.get(b.id)!.lastEmail ?? 0));

  const now = Date.now();
  const sentTo = new Set<string>();
  for (const c of contacts) {
    if (out.sent >= MAX_PER_RUN) break;
    out.checked++;

    // Отказът е по човек, не по картон: отписал се от един — мълчим и на другите.
    if (byContact.get(c.id)!.optedOut) {
      out.skipped.opted_out = (out.skipped.opted_out ?? 0) + 1;
      continue;
    }
    // Два картона с един имейл → едно писмо, не две в една сутрин.
    const email = normEmail(c.email);
    if (email && sentTo.has(email)) {
      out.skipped.same_email_today = (out.skipped.same_email_today ?? 0) + 1;
      continue;
    }

    const clientWhy = clients.get(c.id);
    if (clientWhy) {
      const key = `client_${clientWhy}`;
      out.skipped[key] = (out.skipped[key] ?? 0) + 1;
      continue;
    }

    const t = byContact.get(c.id)!;
    const decision = nextWarmStep(c, t, now);
    if ("skip" in decision) {
      out.skipped[decision.skip] = (out.skipped[decision.skip] ?? 0) + 1;
      continue;
    }

    if (mode === "dry") {
      out.details.push({ contact_id: c.id, name: c.full_name, step: decision.step.key, track: decision.track });
      out.skipped.dry_run = (out.skipped.dry_run ?? 0) + 1;
      if (email) sentTo.add(email);
      continue;
    }

    const res = await sendWarmStep({
      supabase,
      contactId: c.id,
      to: c.email!,
      fullName: c.full_name,
      stage: c.stage,
      followupStatus: c.followup_status,
      track: decision.track,
      step: decision.step,
    });
    if (res.sent) {
      out.sent++;
      if (email) sentTo.add(email);
      out.details.push({ contact_id: c.id, name: c.full_name, step: decision.step.key, track: decision.track });
    } else {
      const why = res.skipped ?? res.error ?? "unknown";
      out.skipped[why] = (out.skipped[why] ?? 0) + 1;
    }
  }

  return out;
}

interface WarmActivity {
  id: string;
  contact_id: string;
  activity_type: string;
  occurred_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/** Колко id-та в един `.in()` — иначе адресът на заявката става твърде дълъг (150 ≈ 6 KB). */
const ID_CHUNK = 150;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Всички страници (allRows) — или грешка с името на заявката, без нищо пратено. */
async function rowsOrThrow<T>(what: string, page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const { rows, error } = await allRows<T>(page);
  if (error) throw new Error(`топлият кръг не прочете ${what}: ${error}`);
  return rows;
}

/**
 * Отказите — отделна малка заявка, независима от всичко друго, и по ИМЕЙЛ:
 * отказ от един картон спира всеки картон на същия човек (дубликатите от формите).
 */
async function loadOptOuts(supabase: Sb): Promise<{ ids: Set<string>; emails: Set<string> }> {
  const rows = await rowsOrThrow<{ contact_id: string }>("отказите", (from, to) =>
    supabase
      .from("contact_activities")
      .select("contact_id")
      .eq("metadata->>email_opt_out", "true")
      .order("id", { ascending: true })
      .range(from, to)
  );
  const ids = new Set(rows.map((r) => r.contact_id));
  const emails = new Set<string>();
  for (const part of chunks([...ids], ID_CHUNK)) {
    const { data, error } = await supabase.from("contacts").select("email").in("id", part);
    if (error) throw new Error(`топлият кръг не прочете имейлите на отписалите се: ${error.message}`);
    for (const r of (data ?? []) as Array<{ email: string | null }>) {
      const e = normEmail(r.email);
      if (e) emails.add(e);
    }
  }
  return { ids, emails };
}

/** Обратна съвместимост за тестовете и прегледа. */
export { WARM_SEQUENCE };
