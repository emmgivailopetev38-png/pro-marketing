import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "@/lib/crm/fake-supabase";
import { NA_ZHIVO } from "./na-zhivo";

/* Цялата вечер на уебинара без база и без Notifier: синхронът след края →
   приблизителният час на офертата → групите → опашката на сетъра → фунията. */

const h = vi.hoisted(() => ({
  fake: null as unknown as FakeSupabase,
  offerPut: [] as Array<string | undefined>,
  offerMinute: null as number | null,
}));

vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => h.fake }));
vi.mock("@/lib/team/routing", () => ({ loadRotationPool: async () => [] }));
vi.mock("@/lib/team/ivailo", () => ({ loadIvailoClaims: async () => new Map() }));
vi.mock("@/lib/team/queue", () => ({
  loadLeadCards: async (ids: string[]) =>
    ids.map((id) => ({ id, full_name: id, phone: "0888", stage: "lead", source: "uebinar-x", form_answers: [], attempts: 0, last_attempt: null })),
}));

import { sinhroniziraiPrisastvie, zarediFuniyata, zarediUebinarOpashka } from "./prisastvie";

const START = Date.parse(NA_ZHIVO.dateISO);
const at = (min: number) => new Date(START + min * 60_000).toISOString();
const ENDED = at(150);

const lead = (id: string, email: string, joinedMin: number | null, watchMin: number, heard: boolean) => ({
  webinarRegistrantId: `r-${id}`,
  name: id,
  phone: "",
  email,
  clickedAt: null,
  joinedAt: joinedMin === null ? null : at(joinedMin),
  watchSeconds: watchMin * 60,
  heardOffer: heard,
  segment: joinedMin === null ? "noShow" : "partial",
  warmth: { score: watchMin, tier: watchMin > 60 ? "hot" : "cold" },
});

function statistics() {
  // Офертата е зададена (90-ата минута) → Иван и Гергана са я чули, Мария е излязла преди нея.
  const heard = h.offerMinute !== null;
  return {
    tracksLeads: true,
    current: {
      webinar: { id: "w1", name: "Тест", startAt: new Date(START).toISOString(), endedAt: ENDED },
      rates: { showUpRate: 75 },
      statistics: {
        registeredCount: 4,
        joinedCount: 3,
        heardOfferCount: heard ? 2 : null,
        completedCount: 2,
        averageWatchMinutes: 90,
        curve: Array.from({ length: 150 }, (_, i) => (i < 40 ? 3 : 2)),
        peakCount: 3,
        peakAt: at(10),
        startedAt: new Date(START).toISOString(),
        worstDrop: { fromMinute: 38, toMinute: 41, lost: 1 },
        offerMinute: h.offerMinute,
        leads: [
          lead("ivan", "ivan@x.bg", 1, 140, heard),
          lead("maria", "maria@x.bg", 2, 40, false),
          lead("petar", "petar@x.bg", null, 0, false),
          lead("gergana", "gergana@x.bg", 1, 145, heard),
        ],
        guests: [],
      },
    },
  };
}

beforeEach(() => {
  resetFakeIds();
  h.offerPut = [];
  h.offerMinute = null;
  process.env.NOTIFIER_API_KEY = "test";
  const reg = (id: string) => ({
    id: `a-${id}`,
    contact_id: id,
    activity_type: "uebinar_registration",
    occurred_at: at(-3000),
    metadata: { date_iso: NA_ZHIVO.dateISO },
  });
  h.fake = createFakeSupabase({
    contacts: ["ivan", "maria", "petar", "gergana"].map((id) => ({
      id,
      full_name: id,
      email: `${id}@x.bg`,
      phone: null,
      source: "uebinar-x",
      created_at: at(-3000),
      routed_to: null,
      stage: "lead",
    })),
    contact_activities: ["ivan", "maria", "petar", "gergana"].map(reg),
    // Гергана си записа час по време на офертата.
    bookings: [{ id: "b1", attendee_email: "gergana@x.bg", attendee_phone: null, created_at: at(100), status: "accepted", scheduled_at: at(60 * 40) }],
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
      if (String(url).endsWith("/offer") && init?.method === "PUT") {
        const body = JSON.parse(init.body ?? "{}") as { offerAt?: string };
        h.offerPut.push(body.offerAt);
        h.offerMinute = body.offerAt ? Math.round((Date.parse(body.offerAt) - START) / 60_000) : 0;
        return new Response(JSON.stringify({ id: "w1", offerAt: body.offerAt ?? null }), { status: 200 });
      }
      return new Response(JSON.stringify(statistics()), { status: 200 });
    })
  );
});

describe("вечерта на уебинара", () => {
  it("след края: приблизителна оферта, групите, ред в картона", async () => {
    // 10 мин след края — още се чака някой да зададе офертата
    let r = await sinhroniziraiPrisastvie({ now: new Date(Date.parse(ENDED) + 10 * 60_000), sila: true });
    expect(r.ok).toBe(true);
    expect(h.offerPut).toEqual([]);
    expect(r.segmenti).toEqual({ zapisal: 1, oferta: 0, rano: 2, ne_doshal: 1 });
    expect(h.fake.store.contact_activities.filter((a) => a.activity_type === "uebinar_prisastvie")).toHaveLength(0);

    // 25 мин след края — слага се 90-ата минута
    r = await sinhroniziraiPrisastvie({ now: new Date(Date.parse(ENDED) + 25 * 60_000), sila: true });
    expect(h.offerPut).toEqual([at(90)]);
    expect(r.segmenti).toEqual({ zapisal: 1, oferta: 1, rano: 1, ne_doshal: 1 });
    const st = h.fake.store.uebinar_statistika[0];
    expect(st.oferta_izvor).toBe("priblizitelno");
    expect(st.doshli).toBe(3);
    expect(st.chuli_ofertata).toBe(2);

    const red = h.fake.store.contact_activities.filter((a) => a.activity_type === "uebinar_prisastvie");
    expect(red).toHaveLength(4);
    expect(red.find((a) => a.contact_id === "ivan")?.title).toMatch(/Беше на уебинара .* · 140 мин · чу офертата/);
    expect(red.find((a) => a.contact_id === "petar")?.title).toMatch(/Не дойде на уебинара/);

    // повторно — без втори ред в картона и без нов PUT
    await sinhroniziraiPrisastvie({ now: new Date(Date.parse(ENDED) + 60 * 60_000), sila: true });
    expect(h.fake.store.contact_activities.filter((a) => a.activity_type === "uebinar_prisastvie")).toHaveLength(4);
    expect(h.offerPut).toHaveLength(1);
    expect(h.fake.store.uebinar_prisastvie).toHaveLength(4);
  });

  it("в понеделник сетърът вижда групите по реда; набраният излиза от опашката", async () => {
    await sinhroniziraiPrisastvie({ now: new Date(Date.parse(ENDED) + 25 * 60_000), sila: true });
    const ponedelnik = new Date(START + 14 * 3_600_000);

    let o = await zarediUebinarOpashka(null, "Сезер", ponedelnik);
    expect(o.sastoyanie).toBe("sled");
    expect(o.ofertaPriblizitelno).toBe(true);
    expect(o.zapisaliChas).toBe(1);
    expect(o.grupi.map((g) => [g.seg, g.leads.map((l) => l.id)])).toEqual([
      ["oferta", ["ivan"]],
      ["rano", ["maria"]],
      ["ne_doshal", ["petar"]],
    ]);
    expect(o.zaZvanene).toBe(3);
    expect(o.grupi[0].leads[0].opener_override).toMatch(/^Здравейте, Сезер съм от екипа на Ивайло Петев\. Видях, че в неделя бяхте на обучението до края/);
    expect(o.grupi[0].leads[0].given_reason).toBe("🔥 Стояха до офертата, без час · 140 мин на обучението · горещ");

    // Сезер звъни на Иван — не вдига
    h.fake.store.contact_activities.push({
      id: "call1",
      contact_id: "ivan",
      activity_type: "call",
      occurred_at: new Date(START + 13 * 3_600_000).toISOString(),
      metadata: { outcome: "no_answer", team: "true" },
    });
    o = await zarediUebinarOpashka(null, "Сезер", ponedelnik);
    expect(o.grupi[0].leads).toHaveLength(0);
    expect(o.grupi[0].progres).toEqual({ obshto: 1, obadeni: 1, vdignali: 0, zapisali: 0 });
    expect(o.zaZvanene).toBe(2);
  });

  it("преди уебинара опашките стоят празни", async () => {
    const o = await zarediUebinarOpashka(null, "Сезер", new Date(START - 86_400_000));
    expect(o.sastoyanie).toBe("predi");
    expect(o.zapisani).toBe(4);
    expect(o.grupi).toEqual([]);
  });

  it("фунията: дошли, до офертата, час — с целите", async () => {
    await sinhroniziraiPrisastvie({ now: new Date(Date.parse(ENDED) + 25 * 60_000), sila: true });
    const f = await zarediFuniyata(new Date(START + 14 * 3_600_000));
    const p = Object.fromEntries(f.stapki.map((s) => [s.key, [s.a, s.b, s.p]]));
    expect(p.doshli).toEqual([3, 4, 75]);
    expect(p.do_ofertata).toEqual([2, 3, 67]);
    expect(p.chas).toEqual([1, 2, 50]);
    expect(f.tyasno).toBe("do_ofertata");
    expect(f.hora.map((x) => x.contact_id)).toEqual(["gergana", "ivan", "maria", "petar"]);
    expect(f.st?.kriva).toHaveLength(150);
  });
});
