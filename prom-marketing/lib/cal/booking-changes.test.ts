import { describe, expect, it } from "vitest";
import { applyCalCancel, applyCalReschedule } from "./booking-changes";

/**
 * Фалшива база в паметта — колкото да минат заявките на booking-changes.ts:
 * select · eq (и по `raw_payload->>ключ`) · gte · lte · limit · maybeSingle · update.
 */
type Row = Record<string, unknown> & { id: string };

function fakeDb(rows: Row[]) {
  const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const read = (r: Row, col: string): unknown => {
    if (!col.includes("->>")) return r[col];
    const [json, key] = col.split("->>");
    return ((r[json] ?? {}) as Record<string, unknown>)[key];
  };
  const sb = {
    from() {
      const filters: Array<(r: Row) => boolean> = [];
      let patch: Record<string, unknown> | null = null;
      let single = false;
      let max = Infinity;
      const run = () => {
        const hits = rows.filter((r) => filters.every((f) => f(r))).slice(0, max);
        if (patch) {
          for (const r of hits) {
            Object.assign(r, patch);
            updates.push({ id: r.id, patch });
          }
          return { data: null, error: null };
        }
        return { data: single ? (hits[0] ?? null) : hits, error: null };
      };
      const q = {
        select: () => q,
        update: (p: Record<string, unknown>) => ((patch = p), q),
        eq: (c: string, v: unknown) => (filters.push((r) => read(r, c) === v), q),
        gte: (c: string, v: string) => (filters.push((r) => String(read(r, c)) >= v), q),
        lte: (c: string, v: string) => (filters.push((r) => String(read(r, c)) <= v), q),
        limit: (n: number) => ((max = n), q),
        maybeSingle: () => ((single = true), Promise.resolve(run())),
        then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve(run()).then(ok, bad),
      };
      return q;
    },
  };
  return { sb: sb as never, updates };
}

const iso = (s: string) => new Date(s).toISOString();
const maria = { email: "maria@example.com", phone: "+359888111222" };
const calData = { triggerEvent: "X", payload: { uid: "u" } };

function booking(id: string, over: Partial<Row> = {}): Row {
  return {
    id,
    cal_booking_id: `manual:${id}`,
    status: "accepted",
    scheduled_at: iso("2026-10-02T13:30:00+03:00"),
    attendee_email: "maria@example.com",
    attendee_phone: "0888 111 222",
    meeting_url: null,
    raw_payload: { source: "hermes", notes: "Внесена от синхрона" },
    ...over,
  };
}

describe("отмяна през Cal.com", () => {
  it("срещата от синхрона (ключ manual:…) се намира по човек + час и става отменена", async () => {
    const rows = [booking("sync"), booking("ivan", { attendee_email: "ivan@example.com", attendee_phone: "+359877000111" })];
    const { sb } = fakeDb(rows);
    const r = await applyCalCancel(sb, { uid: "calUid1", startIso: iso("2026-10-02T13:30:00+03:00"), who: maria, calData, reason: "болен съм" });
    expect(r).toMatchObject({ matched: true, id: "sync", wasLive: true, error: null });
    expect(rows[0].status).toBe("cancelled");
    expect((rows[0].raw_payload as Record<string, unknown>).source).toBe("hermes"); // нашите ключове остават
    expect((rows[0].raw_payload as Record<string, { reason: string }>).cal_cancel.reason).toBe("болен съм");
    expect(rows[1].status).toBe("accepted"); // чужда среща — не се пипа
  });

  it("по uid — и когато uid-ът е само в raw_payload.cal_uid (записана от екипа)", async () => {
    const rows = [booking("ekip", { cal_booking_id: "manual:x", raw_payload: { source: "ekip", cal_uid: "calUid2" } })];
    const { sb } = fakeDb(rows);
    const r = await applyCalCancel(sb, { uid: "calUid2", startIso: iso("2026-10-09T10:00:00Z"), who: maria, calData, reason: null });
    expect(r).toMatchObject({ matched: true, id: "ekip", wasLive: true });
    expect(rows[0].status).toBe("cancelled");
  });

  it("вече отменена/преместена — статусът не се пипа и „отказаха срещата“ не тръгва пак", async () => {
    const rows = [booking("moved", { status: "cancelled", raw_payload: { moved_to: { at: "x" } } })];
    const { sb } = fakeDb(rows);
    const r = await applyCalCancel(sb, { uid: "calUid3", startIso: iso("2026-10-02T13:30:00+03:00"), who: maria, calData, reason: null });
    expect(r).toMatchObject({ matched: true, wasLive: false });
    expect(rows[0].status).toBe("cancelled");
  });

  it("няма такава среща в CRM-а — webhook-ът прави ред по uid, както досега", async () => {
    const { sb } = fakeDb([]);
    const r = await applyCalCancel(sb, { uid: "calUid4", startIso: iso("2026-10-02T13:30:00+03:00"), who: maria, calData, reason: null });
    expect(r.matched).toBe(false);
  });
});

describe("преместване през Cal.com", () => {
  it("срещата на екипа се мести на място: новият час, кой я записа и бележката остават, напомнянията тръгват отначало", async () => {
    const oldIso = iso("2026-10-02T13:30:00+03:00");
    const rows = [
      booking("ekip", {
        cal_booking_id: "oldUid",
        raw_payload: {
          source: "ekip",
          notes: "Иска реклами · Записа: Димитър",
          cal_uid: "oldUid",
          msgs: { confirm: { at: "2026-09-30T10:00:00Z", by: "Димитър" } },
        },
      }),
    ];
    const { sb } = fakeDb(rows);
    const r = await applyCalReschedule(sb, {
      uid: "newUid",
      oldUid: "oldUid",
      oldStartIso: oldIso,
      startIso: iso("2026-10-05T11:00:00+03:00"),
      durationMinutes: 45,
      meetingUrl: "https://meet.google.com/new-link",
      who: maria,
      calData,
    });
    expect(r).toMatchObject({ matched: true, id: "ekip", fromIso: oldIso, error: null });
    const row = rows[0];
    expect(row.scheduled_at).toBe(iso("2026-10-05T11:00:00+03:00"));
    expect(row.status).toBe("accepted");
    expect(row.meeting_url).toBe("https://meet.google.com/new-link");
    const raw = row.raw_payload as Record<string, unknown>;
    expect(raw.source).toBe("ekip");
    expect(raw.notes).toBe("Иска реклами · Записа: Димитър");
    expect(raw.cal_uid).toBe("newUid");
    expect((raw.moved_from as { at: string }).at).toBe(oldIso);
    // пратеното потвърждение е за стария час — за новия излиза пак
    expect((raw.msgs as Record<string, { for: string }>).confirm.for).toBe(oldIso);
  });

  it("без uid — по човек и стария час (срещата е от синхрона на календара)", async () => {
    const rows = [booking("sync")];
    const { sb } = fakeDb(rows);
    const r = await applyCalReschedule(sb, {
      uid: "newUid",
      oldUid: null,
      oldStartIso: iso("2026-10-02T13:30:00+03:00"),
      startIso: iso("2026-10-06T15:00:00+03:00"),
      durationMinutes: 45,
      meetingUrl: null,
      who: maria,
      calData,
    });
    expect(r).toMatchObject({ matched: true, id: "sync" });
    expect(rows[0].scheduled_at).toBe(iso("2026-10-06T15:00:00+03:00"));
  });

  it("ако вече има ред и за новия uid — той става живият, старият се затваря като преместен", async () => {
    const rows = [
      booking("old", { cal_booking_id: "oldUid" }),
      booking("new", { cal_booking_id: "newUid", status: "confirmed", scheduled_at: iso("2026-10-06T15:00:00+03:00") }),
    ];
    const { sb } = fakeDb(rows);
    await applyCalReschedule(sb, {
      uid: "newUid",
      oldUid: "oldUid",
      oldStartIso: iso("2026-10-02T13:30:00+03:00"),
      startIso: iso("2026-10-06T15:00:00+03:00"),
      durationMinutes: 45,
      meetingUrl: null,
      who: maria,
      calData,
    });
    expect(rows[1].status).toBe("confirmed");
    expect(rows[0].status).toBe("cancelled");
    expect((rows[0].raw_payload as Record<string, { booking_id: string }>).moved_to.booking_id).toBe("new");
  });

  it("нищо не е намерено — webhook-ът прави нов жив ред", async () => {
    const { sb } = fakeDb([]);
    const r = await applyCalReschedule(sb, {
      uid: "newUid",
      oldUid: "oldUid",
      oldStartIso: null,
      startIso: iso("2026-10-06T15:00:00+03:00"),
      durationMinutes: 45,
      meetingUrl: null,
      who: maria,
      calData,
    });
    expect(r.matched).toBe(false);
  });
});
