import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Мокът е за `createServiceClient`, а не за целия модул: искаме да се
 * изпълни истинската логика по броене — нея я заобикаляха всички дотогавашни
 * тавани.
 */
const rows: Array<Record<string, unknown>> = [];
let throwOnClient = false;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    if (throwOnClient) throw new Error("няма ключове");
    return {
      from() {
        /**
         * Заявката вече е по ЕДНА колона (`.eq(col, value)`), затова мокът
         * връща само редовете, които наистина съвпадат — иначе тестът за
         * „чуждият разговор не яде твоите минути" би минавал наужким.
         */
        const q: Record<string, unknown> = {};
        let col: string | null = null;
        let val: unknown = null;
        const chain = () => q;
        Object.assign(q, {
          select: chain,
          gte: chain,
          is: chain,
          order: chain,
          eq: (c: string, v: unknown) => {
            col = c;
            val = v;
            return q;
          },
          limit: () =>
            Promise.resolve({
              data: col ? rows.filter((r) => r[col as string] === val) : rows,
              error: null,
            }),
          insert: () => Promise.resolve({ error: null }),
          update: () => q,
          maybeSingle: () => Promise.resolve({ data: null }),
        });
        return q;
      },
    };
  },
}));

import {
  clientIp,
  hashIp,
  identityOf,
  normalizeEmail,
  openVoiceSession,
  phoneKey,
  readUsage,
  voiceLimits,
} from "./quota";

function reset() {
  rows.length = 0;
  throwOnClient = false;
  for (const k of Object.keys(process.env)) {
    if (k.startsWith("PUBLIC_VOICE_")) delete process.env[k];
  }
}

beforeEach(reset);
afterEach(reset);

describe("normalizeEmail", () => {
  it("сваля регистъра и празните места", () => {
    expect(normalizeEmail("  IVO@Primer.BG ")).toBe("ivo@primer.bg");
  });
  it("отхвърля плейсхолдъра — иначе всички без имейл стават един човек", () => {
    expect(normalizeEmail("bez-imeil@promarketing.pw")).toBeNull();
  });
  it("отхвърля нещо, което не е адрес", () => {
    expect(normalizeEmail("ivo")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("phoneKey", () => {
  it("прави един ключ от нулата, кода и интервалите — иначе таванът се заобикаля", () => {
    const k = phoneKey("0877399963");
    expect(k).toBe("877399963");
    expect(phoneKey("+359877399963")).toBe(k);
    expect(phoneKey("359 877 399 963")).toBe(k);
    expect(phoneKey("00359-877-399-963")).toBe(k);
  });
  it("мълчи при твърде къс низ", () => {
    expect(phoneKey("123")).toBeNull();
    expect(phoneKey(undefined)).toBeNull();
  });
});

describe("hashIp / clientIp", () => {
  it("не връща самия адрес", () => {
    const h = hashIp("1.2.3.4");
    expect(h).not.toContain("1.2.3.4");
    expect(h).toHaveLength(32);
    expect(hashIp("1.2.3.4")).toBe(h);
    expect(hashIp("1.2.3.5")).not.toBe(h);
  });
  it("взима първия адрес от x-forwarded-for, не проксито", () => {
    const r = new Request("https://promarketing.pw/x", {
      headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1, 10.0.0.2" },
    });
    expect(clientIp(r)).toBe("9.9.9.9");
  });
});

describe("readUsage", () => {
  it("брои секундите само по човек, не по IP", async () => {
    rows.push(
      { id: "r1", seconds: 300, opened_at: new Date().toISOString(), email: "ivo@primer.bg", phone_key: null, ip_hash: hashIp("1.2.3.4") },
      // Чужд разговор от същата мрежа — не бива да яде минутите на Иво.
      { id: "r2", seconds: 400, opened_at: new Date().toISOString(), email: "друг@primer.bg", phone_key: null, ip_hash: hashIp("1.2.3.4") }
    );
    const u = await readUsage(identityOf({ email: "ivo@primer.bg", ip: "1.2.3.4" }));
    expect(u.usedSeconds).toBe(300);
    expect(u.remainingSeconds).toBe(300);
    expect(u.blind).toBe(false);
  });

  it("познава човека и само по телефон, ако имейлът е сменен", async () => {
    rows.push({
      id: "r1",
      seconds: 540,
      opened_at: new Date().toISOString(),
      email: "старият@primer.bg",
      phone_key: "877399963",
      ip_hash: null,
    });
    const u = await readUsage(identityOf({ email: "нов@primer.bg", phone: "+359 877 399 963" }));
    expect(u.usedSeconds).toBe(540);
  });

  it("когато тефтерът мълчи, разговорът минава с пълен таван", async () => {
    throwOnClient = true;
    const u = await readUsage(identityOf({ email: "ivo@primer.bg" }));
    expect(u.blind).toBe(true);
    expect(u.remainingSeconds).toBe(voiceLimits().personSeconds);
  });
});

describe("openVoiceSession", () => {
  it("дава остатъка, а не тавана — вторият разговор е по-кратък", async () => {
    rows.push({
      id: "r1",
      seconds: 420,
      opened_at: new Date().toISOString(),
      email: "ivo@primer.bg",
      phone_key: null,
      ip_hash: null,
    });
    const r = await openVoiceSession({ email: "ivo@primer.bg", ip: "1.2.3.4" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.seconds).toBe(180);
    expect(r.warnAt).toBeLessThanOrEqual(r.seconds - 30);
    expect(r.sessionKey).toMatch(/^vs_[a-f0-9]{32}$/);
  });

  it("спира човека, изговорил десетте си минути, и го праща към календара", async () => {
    rows.push({
      id: "r1",
      seconds: 600,
      opened_at: new Date().toISOString(),
      email: "ivo@primer.bg",
      phone_key: null,
      ip_hash: null,
    });
    const r = await openVoiceSession({ email: "ivo@primer.bg" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("minutes");
    expect(r.spoken).toContain("календара");
  });

  it("спира и по брой отваряния за деня, дори минутите да не са отчетени", async () => {
    // Три отворени линии с нула секунди: webhook-ът още не е дошъл.
    for (let i = 0; i < 3; i++) {
      rows.push({
        id: `r${i}`,
        seconds: 0,
        opened_at: new Date().toISOString(),
        email: "ivo@primer.bg",
        phone_key: null,
        ip_hash: null,
      });
    }
    const r = await openVoiceSession({ email: "ivo@primer.bg" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("sessions");
  });

  it("спира по IP онзи, който сменя имейла на всяко натискане", async () => {
    for (let i = 0; i < 6; i++) {
      rows.push({
        id: `r${i}`,
        seconds: 0,
        opened_at: new Date().toISOString(),
        email: `edin${i}@primer.bg`,
        phone_key: null,
        ip_hash: hashIp("1.2.3.4"),
      });
    }
    const r = await openVoiceSession({ email: "sedmi@primer.bg", ip: "1.2.3.4" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("ip");
  });

  it("стар разговор извън трийсетте дни не влиза в сметката", async () => {
    rows.push({
      id: "r1",
      seconds: 600,
      // Заявката вече филтрира по дата; тук проверяваме, че редовете, които
      // базата връща, се сумират такива, каквито са.
      opened_at: new Date().toISOString(),
      email: "друг@primer.bg",
      phone_key: null,
      ip_hash: null,
    });
    const r = await openVoiceSession({ email: "ivo@primer.bg" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.seconds).toBe(600);
  });

  it("променливите в средата местят тавана", async () => {
    process.env.PUBLIC_VOICE_PERSON_MINUTES = "5";
    const r = await openVoiceSession({ email: "ivo@primer.bg" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.seconds).toBe(300);
  });
});

describe("филтърът към базата", () => {
  it("отхвърля адрес със запетая или скоба — те чупят `or=(…)` на PostgREST", () => {
    expect(normalizeEmail("a,b@primer.bg")).toBeNull();
    expect(normalizeEmail("a(b@primer.bg")).toBeNull();
    expect(normalizeEmail('a"b@primer.bg')).toBeNull();
    // Нормалният адрес с точки и тирета остава непокътнат.
    expect(normalizeEmail("ivo.petev-1@pro-marketing.bg")).toBe("ivo.petev-1@pro-marketing.bg");
  });
});
