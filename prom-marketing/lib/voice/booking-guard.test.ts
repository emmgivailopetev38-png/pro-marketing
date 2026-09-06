import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Мокът имитира само двете заявки, които пазачът прави: броенето на
 * гласовите часове за денонощието (head + count) и списъка за трийсет дни.
 */
let bookings: Array<Record<string, unknown>> = [];
let dayCount = 0;
let explode = false;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    if (explode) throw new Error("няма ключове");
    return {
      from() {
        const q: Record<string, unknown> = {};
        Object.assign(q, {
          select: (_cols: string, opts?: { head?: boolean }) => {
            if (opts?.head) {
              // Пътят за общия таван свършва на .gte() и връща count.
              const head: Record<string, unknown> = {};
              Object.assign(head, {
                like: () => head,
                gte: () => Promise.resolve({ count: dayCount, error: null }),
              });
              return head;
            }
            return q;
          },
          like: () => q,
          gte: () => q,
          order: () => q,
          limit: () => Promise.resolve({ data: bookings, error: null }),
        });
        return q;
      },
    };
  },
}));

import { checkBookingAllowed } from "./booking-guard";

const speakExisting = (when: Date) => `вече имаш час на ${when.toISOString()}`;
const inDays = (n: number) => new Date(Date.now() + n * 24 * 3600_000).toISOString();
const agoDays = (n: number) => new Date(Date.now() - n * 24 * 3600_000).toISOString();

function reset() {
  bookings = [];
  dayCount = 0;
  explode = false;
  for (const k of Object.keys(process.env)) {
    if (k.startsWith("PUBLIC_VOICE_")) delete process.env[k];
  }
}
beforeEach(reset);
afterEach(reset);

describe("checkBookingAllowed", () => {
  it("пуска първия час", async () => {
    const r = await checkBookingAllowed({ email: "ivo@primer.bg", phone: "0877399963", speakExisting });
    expect(r.ok).toBe(true);
  });

  it("не записва втори час, а предлага да мести живия", async () => {
    bookings = [
      { id: "b1", attendee_email: "ivo@primer.bg", attendee_phone: null, scheduled_at: inDays(2), status: "accepted", created_at: agoDays(1) },
    ];
    const r = await checkBookingAllowed({ email: "IVO@primer.bg", phone: null, speakExisting });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("has_upcoming");
    expect(r.existingId).toBe("b1");
    expect(r.spoken).toContain("вече имаш час");
  });

  it("познава човека по телефон, дори имейлът да е нов", async () => {
    bookings = [
      { id: "b1", attendee_email: "старият@primer.bg", attendee_phone: "087 7399963", scheduled_at: inDays(3), status: "accepted", created_at: agoDays(1) },
    ];
    const r = await checkBookingAllowed({ email: "нов@primer.bg", phone: "+359877399963", speakExisting });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("has_upcoming");
  });

  it("отменената среща не е жива и не пречи на нова", async () => {
    bookings = [
      { id: "b1", attendee_email: "ivo@primer.bg", attendee_phone: null, scheduled_at: inDays(2), status: "cancelled", created_at: agoDays(1) },
    ];
    const r = await checkBookingAllowed({ email: "ivo@primer.bg", phone: null, speakExisting });
    expect(r.ok).toBe(true);
  });

  it("минала среща не пречи, но се брои към месечния таван", async () => {
    bookings = [
      { id: "b1", attendee_email: "ivo@primer.bg", attendee_phone: null, scheduled_at: agoDays(3), status: "accepted", created_at: agoDays(4) },
      { id: "b2", attendee_email: "ivo@primer.bg", attendee_phone: null, scheduled_at: agoDays(1), status: "accepted", created_at: agoDays(2) },
    ];
    const r = await checkBookingAllowed({ email: "ivo@primer.bg", phone: null, speakExisting });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("too_many");
    expect(r.spoken).toContain("Ивайло");
  });

  it("чуждите часове не се броят за твои", async () => {
    bookings = [
      { id: "b1", attendee_email: "друг@primer.bg", attendee_phone: "0888111222", scheduled_at: inDays(1), status: "accepted", created_at: agoDays(1) },
      { id: "b2", attendee_email: "трети@primer.bg", attendee_phone: null, scheduled_at: inDays(2), status: "accepted", created_at: agoDays(1) },
    ];
    const r = await checkBookingAllowed({ email: "ivo@primer.bg", phone: "0877399963", speakExisting });
    expect(r.ok).toBe(true);
  });

  it("общият дневен таван спира и непознат — това е стената при подменена самоличност", async () => {
    dayCount = 8;
    const r = await checkBookingAllowed({ email: null, phone: null, speakExisting });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("day_cap");
  });

  it("без имейл и без телефон, но под дневния таван — минава (телефонните обаждания)", async () => {
    const r = await checkBookingAllowed({ email: null, phone: null, speakExisting });
    expect(r.ok).toBe(true);
  });

  it("паднала проверка не изяжда истинска среща", async () => {
    explode = true;
    const r = await checkBookingAllowed({ email: "ivo@primer.bg", phone: null, speakExisting });
    expect(r.ok).toBe(true);
  });

  it("таваните се местят от средата", async () => {
    process.env.PUBLIC_VOICE_BOOKINGS_PER_DAY = "2";
    dayCount = 2;
    const r = await checkBookingAllowed({ email: "ivo@primer.bg", phone: null, speakExisting });
    expect(r.ok).toBe(false);
  });
});
