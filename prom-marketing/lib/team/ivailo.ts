import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import { realEmail, samePerson } from "./sreshti-zastapvane";
import {
  AKADEMIA_SOURCE,
  CLAIM_ACTIVITY_TYPES,
  indexBookings,
  isAkademiaSignal,
  ivailoClaim,
  rowsByContact,
  type BookingIndex,
  type BookingRef,
  type ClaimOptions,
  type ContactRef,
  type IvailoClaim,
  type SignalRow,
} from "./ivailo-rules";
import { chunks } from "@/lib/array";
import { allRows } from "@/lib/supabase/all-rows";

/**
 * Базата за ivailo-rules.ts: чий е човекът — на екипа или вече на Ивайло
 * (Академията, разговор с него, среща в календара му). Правилата и защо са
 * там; тук е само четенето.
 */

type Sb = ReturnType<typeof createServiceClient>;

const COLS = "contact_id, activity_type, title, body, occurred_at, created_at, created_by, metadata";
/**
 * id-та на заявка: дългият списък в адреса се реже на парчета, а Supabase връща
 * най-много 1000 реда на заявка — 60 картона × до 13 реда остават под тавана.
 */
const CHUNK = 60;
/** За loadAkademiaIds — редовете се четат на страници по 1000, затова тавана не го е грижа. */
const AKADEMIA_CHUNK = 100;

async function loadSignalRows(sb: Sb, ids: string[]): Promise<SignalRow[]> {
  const parts = await Promise.all(
    chunks(ids, CHUNK).map((part) =>
      Promise.all([
        sb.from("contact_activities").select(COLS).in("contact_id", part).in("activity_type", [...CLAIM_ACTIVITY_TYPES]).limit(1000),
        sb.from("contact_activities").select(COLS).in("contact_id", part).eq("created_by", "akademia").limit(1000),
        // Бележка на Ивайло или Клод за Академията („Регистрира се в Академията…“).
        sb.from("contact_activities").select(COLS).in("contact_id", part).eq("activity_type", "note").ilike("title", "%Академи%").limit(1000),
        // Формите от рекламата — заявка в Академията веднага след тях не е „човек на Ивайло“ (12.11.2026).
        sb.from("contact_activities").select(COLS).in("contact_id", part).eq("activity_type", "meta_lead").limit(1000),
      ])
    )
  );
  const out: SignalRow[] = [];
  for (const res of parts.flat()) {
    if (res.error) throw new Error(`ivailo: ${res.error.message}`);
    out.push(...((res.data ?? []) as SignalRow[]));
  }
  return out;
}

/**
 * Кои от тези картони са от Академията — за продажбените имейли, които не
 * бива да стигат до хора от менторската. Хвърля при грешка в базата.
 */
export async function loadAkademiaIds(ids: string[], sb: Sb = createServiceClient()): Promise<Set<string>> {
  const out = new Set<string>();
  // Две заявки на парче (вместо четири), всички парчета наведнъж (вместо едно
  // след друго). Трите сигнала за активностите — уеб форма, създадено от
  // „akademia“, бележка „Академи…“ — са едно `.or`; после всеки ред пак минава
  // през isAkademiaSignal, точно както преди.
  await Promise.all(
    chunks(ids, AKADEMIA_CHUNK).map(async (part) => {
      const [bySource, signals] = await Promise.all([
        allRows<{ id: string }>((from, to) =>
          sb.from("contacts").select("id").in("id", part).eq("source", AKADEMIA_SOURCE).order("id").range(from, to)
        ),
        allRows<SignalRow>((from, to) =>
          sb
            .from("contact_activities")
            .select(COLS)
            .in("contact_id", part)
            .or("activity_type.eq.website_form,created_by.eq.akademia,and(activity_type.eq.note,title.ilike.%Академи%)")
            .order("id")
            .range(from, to)
        ),
      ]);
      if (bySource.error) throw new Error(`akademia: ${bySource.error}`);
      if (signals.error) throw new Error(`akademia: ${signals.error}`);
      for (const c of bySource.rows) out.add(String(c.id));
      for (const r of signals.rows) if (isAkademiaSignal(r)) out.add(r.contact_id);
    })
  );
  return out;
}

/** Срещите, които са стояли или стоят в календара (без отменените преди часа). */
async function loadBookingIndex(sb: Sb): Promise<BookingIndex> {
  const { data, error } = await sb
    .from("bookings")
    // source = откъде е срещата: „ekip“ от 23.10 е на клоузъра, не на Ивайло (isCloserBooking).
    .select("id, status, scheduled_at, created_at, attendee_email, attendee_phone, source:raw_payload->>source")
    .not("status", "in", "(cancelled,rejected)")
    .order("scheduled_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`ivailo bookings: ${error.message}`);
  return indexBookings((data ?? []) as BookingRef[]);
}

/**
 * Кои от тези хора са на Ивайло — id → защо. Който липсва в отговора, е на екипа.
 * Хвърля при грешка в базата: викащият решава дали да покаже всичко или нищо.
 */
export async function loadIvailoClaims(
  contacts: ContactRef[],
  opts: ClaimOptions,
  sb: Sb = createServiceClient()
): Promise<Map<string, IvailoClaim>> {
  const out = new Map<string, IvailoClaim>();
  const unique = [...new Map(contacts.map((c) => [c.id, c])).values()];
  if (unique.length === 0) return out;
  const [rows, bookings] = await Promise.all([loadSignalRows(sb, unique.map((c) => c.id)), loadBookingIndex(sb)]);
  const byContact = rowsByContact(rows);
  for (const c of unique) {
    const claim = ivailoClaim(c, byContact.get(c.id) ?? [], bookings, opts);
    if (claim) out.set(c.id, claim);
  }
  return out;
}

/** Един картон — за отказаната и пропуснатата среща и за писмото „нов лийд“. Никога не хвърля: при грешка null. */
export async function ivailoClaimFor(contactId: string, opts: ClaimOptions): Promise<IvailoClaim | null> {
  try {
    const sb = createServiceClient();
    const { data } = await sb.from("contacts").select("id, email, phone, source, created_at").eq("id", contactId).maybeSingle();
    if (!data) return null;
    const claims = await loadIvailoClaims([data as ContactRef], opts, sb);
    return claims.get(contactId) ?? null;
  } catch {
    return null;
  }
}

export interface PersonRef {
  /** ключът, с който викащият го познава — напр. id на срещата */
  key: string;
  email: string | null;
  phone: string | null;
  /** тази среща не е знак — напомнянето е за нея */
  ignoreBookingId?: string | null;
}

/**
 * Хора без картон в ръката (срещите в „💜 Срещите“): намира картоните им по имейл
 * или телефон и казва кои са на Ивайло. Ключ → защо.
 */
export async function loadIvailoClaimsForPeople(
  people: PersonRef[],
  opts: Omit<ClaimOptions, "ignoreBookingId">
): Promise<Map<string, IvailoClaim>> {
  const out = new Map<string, IvailoClaim>();
  if (people.length === 0) return out;
  const sb = createServiceClient();
  const emails = [...new Set(people.map((p) => realEmail(p.email)).filter((e): e is string => !!e))];
  const phones = [...new Set(people.flatMap((p) => (p.phone ? phoneVariants(p.phone) : [])))];
  const cols = "id, email, phone, source, created_at";
  const [byEmail, byPhone] = await Promise.all([
    emails.length ? sb.from("contacts").select(cols).in("email", emails).limit(500) : Promise.resolve({ data: [], error: null }),
    phones.length ? sb.from("contacts").select(cols).in("phone", phones).limit(500) : Promise.resolve({ data: [], error: null }),
  ]);
  if (byEmail.error || byPhone.error) throw new Error(`ivailo people: ${(byEmail.error ?? byPhone.error)?.message}`);
  const contacts = [...new Map([...(byEmail.data ?? []), ...(byPhone.data ?? [])].map((c) => [c.id, c as ContactRef])).values()];
  if (contacts.length === 0) return out;

  const [rows, bookings] = await Promise.all([loadSignalRows(sb, contacts.map((c) => c.id)), loadBookingIndex(sb)]);
  const byContact = rowsByContact(rows);
  for (const p of people) {
    for (const c of contacts) {
      if (!samePerson(p, c)) continue;
      const claim = ivailoClaim(c, byContact.get(c.id) ?? [], bookings, { ...opts, ignoreBookingId: p.ignoreBookingId ?? null });
      if (claim) {
        out.set(p.key, claim);
        break;
      }
    }
  }
  return out;
}
