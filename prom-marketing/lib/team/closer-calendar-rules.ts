/**
 * Поканата към календара на клоузъра — правилата, без мрежа и без база.
 *
 * Среща, записана от екипа, трябва да е в календара на човека, който я води,
 * в мига на записването — за ВСЕКИ час. Cal.com приема само свободните си
 * слотове, затова когато откаже (или изобщо не е викан), клоузърът получава
 * поканата направо от нас (lib/cal/ics.ts). Тук е паметта за тази покана и
 * какво следва от промяна в срещата: преместена → нова покана със същия UID,
 * отменена → отмяна, проведена / „не се яви“ → нищо.
 */
import { isLiveBooking, sameInstant } from "@/lib/crm/booking-status";

/** Срещите на клоузъра са по 60 минути (Ивайло, 01.11.2026) — колкото е и събитието му в Cal.com. */
export const CLOSER_MEETING_MINUTES = 60;

/** Какво помним за пратената покана — стои в `bookings.raw_payload.closer_invite`. */
export interface CloserInviteState {
  uid: string;
  seq: number;
  /** на кой адрес е пратена */
  to: string;
  /** за кой час (UTC ISO) — различи ли се от часа на срещата, тя е преместена */
  start: string;
  sent_at: string;
  cancelled_at?: string | null;
  /** защо не е минала през Cal.com — за следата */
  why?: string | null;
}

export function inviteUid(bookingId: string, test = false): string {
  return `sreshta-${bookingId}${test ? "-proba" : ""}@promarketing.pw`;
}

export function readInviteState(raw: unknown): CloserInviteState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = (raw as Record<string, unknown>).closer_invite;
  if (!s || typeof s !== "object") return null;
  const o = s as Record<string, unknown>;
  if (typeof o.uid !== "string" || !o.uid || typeof o.to !== "string" || !o.to || typeof o.start !== "string") return null;
  return {
    uid: o.uid,
    seq: typeof o.seq === "number" && Number.isFinite(o.seq) ? o.seq : 0,
    to: o.to,
    start: o.start,
    sent_at: typeof o.sent_at === "string" ? o.sent_at : "",
    cancelled_at: typeof o.cancelled_at === "string" ? o.cancelled_at : null,
    why: typeof o.why === "string" ? o.why : null,
  };
}

export type InviteStep = { kind: "none" } | { kind: "cancel"; seq: number } | { kind: "move"; seq: number };

/**
 * Какво да стигне до календара след промяна в срещата.
 * Минала среща не се пипа — „проведена“ и „не се яви“ остават в календара.
 */
export function nextInviteStep(args: {
  state: CloserInviteState | null;
  status: string | null | undefined;
  scheduledIso: string;
  now: Date;
}): InviteStep {
  const { state } = args;
  if (!state) return { kind: "none" };
  const startMs = new Date(args.scheduledIso).getTime();
  if (Number.isNaN(startMs)) return { kind: "none" };
  const live = isLiveBooking(args.status);
  const future = startMs > args.now.getTime();

  if (state.cancelled_at) {
    // Върната среща (отменена по грешка, после пак „приета“) — поканата тръгва наново.
    return live && future ? { kind: "move", seq: state.seq + 1 } : { kind: "none" };
  }
  if (!live) {
    const dropped = args.status === "cancelled" || args.status === "rejected";
    // Часът в поканата може да е старият — отменя се, докато той не е минал.
    const stillAhead = new Date(state.start).getTime() > args.now.getTime() || future;
    return dropped && stillAhead ? { kind: "cancel", seq: state.seq + 1 } : { kind: "none" };
  }
  if (!sameInstant(state.start, args.scheduledIso)) return { kind: "move", seq: state.seq + 1 };
  return { kind: "none" };
}

/**
 * Отказът на Cal.com с човешки думи. Най-честият е „няма такъв слот“: часът е
 * извън графика на събитието, не е на кръгъл час или календарът е зает.
 */
export function calRefusalReason(error: string | null | undefined): string {
  const e = (error ?? "").trim();
  if (!e) return "няма отговор от Cal.com";
  if (/phone_required|attendeePhoneNumber/i.test(e)) return "липсва телефон";
  if (
    /not available|no_available_users|already has booking|booking_time_out_of_bounds|time is not available|slot|unavailable|busy/i.test(
      e
    )
  ) {
    return "часът не е свободен слот в Cal.com — там са пон–пет 12–18 на кръгъл час и само при свободен календар";
  }
  if (/timeout|aborted|fetch failed|network/i.test(e)) return "Cal.com не отговори навреме";
  return e.slice(0, 160);
}

/** Последните 9 цифри — така /ekip?q= намира картона независимо как е записан номерът. */
export function phoneKey(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
}

/** Адресите-заместители не са имейл на човека — в поканата не се показват. */
export function realEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || /^(bez-imeil@promarketing\.pw|unknown@unknown)$|\+glas-/.test(e)) return null;
  return e;
}
