import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase, tg: [] as unknown[][] }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => h.fake }));
vi.mock("@/lib/notifications/telegram", () => ({
  tgNotify: {
    emailReply: (...a: unknown[]) => {
      h.tg.push(a);
      return Promise.resolve(true);
    },
  },
}));

import {
  cleanSubject,
  engagementSummary,
  recordInboundReplies,
  replyExcerpt,
  senderEmail,
  watchlistEmails,
} from "./email-replies";

const DAY = 86_400_000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

function autoMail(contact_id: string, msAgo = 2 * DAY) {
  return { contact_id, activity_type: "email_sent", occurred_at: iso(msAgo), metadata: { auto: true, seq_step: "s1_lichno" } };
}

beforeEach(() => {
  resetFakeIds();
  h.tg = [];
  h.fake = createFakeSupabase();
});

describe("senderEmail / cleanSubject", () => {
  it("вади адреса от „Име <адрес>“ и го смалява", () => {
    expect(senderEmail("Стефан Христов <PremiumAutoService2022@Gmail.com>")).toBe("premiumautoservice2022@gmail.com");
    expect(senderEmail("slavirich1811@gmail.com")).toBe("slavirich1811@gmail.com");
    expect(senderEmail("Без адрес")).toBeNull();
  });

  it("маха Re:/Отг:/AW: отпред", () => {
    expect(cleanSubject("Re: RE: Отг: Ето ти демотата")).toBe("Ето ти демотата");
    expect(cleanSubject("AW: Колко струва още един месец така")).toBe("Колко струва още един месец така");
    expect(cleanSubject(null)).toBe("");
  });
});

describe("replyExcerpt — само новото, без цитата", () => {
  it("реже българския цитат на Gmail", () => {
    const t = "Здравейте, пратете ми кратко предложение. На пн, 16.10.2026 г. в 6:30 Ivailo Petev <ivailo@promarketing.pw> написа: > Ето ти демотата";
    expect(replyExcerpt(t)).toBe("Здравейте, пратете ми кратко предложение.");
  });

  it("реже английския и Outlook цитата", () => {
    expect(replyExcerpt("Yes, call me. On Mon, Oct 16 Ivailo wrote: blah")).toBe("Yes, call me.");
    expect(replyExcerpt("Добре.\nОт: Ivailo Petev\nИзпратено: ...")).toBe("Добре.");
  });

  it("не реже на „на“ в обикновено изречение", () => {
    const t = "Благодаря на колегата, който ми написа: интересно е.";
    expect(replyExcerpt(t)).toBe(t);
  });

  it("разкодира ентититата от snippet-а и пази таван", () => {
    expect(replyExcerpt("Здравей &quot;Иво&quot; &amp; екип")).toBe('Здравей "Иво" & екип');
    expect(replyExcerpt("а".repeat(50), 10)).toHaveLength(10);
  });
});

describe("watchlistEmails", () => {
  it("връща адресите на получилите автоматично писмо в прозореца, без нашите", async () => {
    h.fake = createFakeSupabase({
      contacts: [
        { id: "c1", email: "Lead@Firma.bg" },
        { id: "c2", email: "star@firma.bg" },
        { id: "c3", email: "ruchno@firma.bg" },
        { id: "c4", email: "ivailo@promarketing.pw" },
      ],
      contact_activities: [
        autoMail("c1"),
        autoMail("c1", 3 * DAY),
        autoMail("c2", 90 * DAY), // извън 60-те дни
        { contact_id: "c3", activity_type: "email_sent", occurred_at: iso(DAY), metadata: {} }, // ръчно писмо
        autoMail("c4"),
      ],
    });
    expect(await watchlistEmails()).toEqual(["lead@firma.bg"]);
  });
});

describe("recordInboundReplies", () => {
  const msg = {
    gmail_id: "1a142c583edf201c",
    thread_id: "1a142c583edf201c",
    from: "Стефан <premium@auto.bg>",
    subject: "Re: Ето ти демотата — включително за твоя бранш",
    date: iso(60_000),
    text: "Пратете ми кратко предложение. На пн, 16.10 Ivailo Petev написа: …",
  };

  it("вписва отговора, прави човека „чут“ и праща Telegram", async () => {
    h.fake = createFakeSupabase({
      contacts: [{ id: "c1", full_name: "Стефан Христов", email: "premium@auto.bg", stage: "lead", last_heard_from_at: null }],
      contact_activities: [autoMail("c1")],
    });
    const r = await recordInboundReplies([msg]);
    expect(r.recorded).toBe(1);
    const act = h.fake.store.contact_activities.find((a) => a.activity_type === "email_received") as Record<string, unknown>;
    expect(act.created_by).toBe("email_reply");
    expect(act.title).toBe("📩 Отговори на имейла „Ето ти демотата — включително за твоя бранш“");
    expect(act.body).toBe("Пратете ми кратко предложение.");
    expect((act.metadata as Record<string, unknown>).gmail_id).toBe(msg.gmail_id);
    expect(h.fake.store.contacts[0].last_heard_from_at).toBeTruthy();
    expect(h.tg).toHaveLength(1);
    expect(h.tg[0][0]).toBe("Стефан Христов");
  });

  it("второто подаване на същото писмо не прави нищо", async () => {
    h.fake = createFakeSupabase({
      contacts: [{ id: "c1", full_name: "Стефан", email: "premium@auto.bg" }],
      contact_activities: [autoMail("c1")],
    });
    await recordInboundReplies([msg]);
    const again = await recordInboundReplies([msg]);
    expect(again.recorded).toBe(0);
    expect(again.skipped.already_recorded).toBe(1);
    expect(h.fake.store.contact_activities.filter((a) => a.activity_type === "email_received")).toHaveLength(1);
    expect(h.tg).toHaveLength(1);
  });

  it("не дублира отговор, вписан на ръка (Claude/Хермес) по същото време", async () => {
    h.fake = createFakeSupabase({
      contacts: [{ id: "c1", full_name: "Стефан", email: "premium@auto.bg" }],
      contact_activities: [autoMail("c1"), { contact_id: "c1", activity_type: "email", occurred_at: msg.date, metadata: {} }],
    });
    const r = await recordInboundReplies([msg]);
    expect(r.recorded).toBe(0);
    expect(r.skipped.logged_by_hand).toBe(1);
  });

  it("пропуска непознати, хора без автоматично писмо и нашите адреси", async () => {
    h.fake = createFakeSupabase({
      contacts: [{ id: "c2", full_name: "Счетоводител", email: "office@opg-bg.com" }],
      contact_activities: [],
    });
    const r = await recordInboundReplies([
      { ...msg, gmail_id: "aaaaaa1", from: "bank@bank.bg" },
      { ...msg, gmail_id: "aaaaaa2", from: "Соня <office@opg-bg.com>" },
      { ...msg, gmail_id: "aaaaaa3", from: "Ivailo <ivailo@promarketing.pw>" },
    ]);
    expect(r.recorded).toBe(0);
    expect(r.skipped).toEqual({ not_a_contact: 1, no_auto_email: 1, own_address: 1 });
    expect(h.fake.store.contact_activities).toHaveLength(0);
  });

  it("два картона с един имейл — вписва и на двата, Telegram веднъж", async () => {
    h.fake = createFakeSupabase({
      contacts: [
        { id: "c1", full_name: "Стефан", email: "premium@auto.bg" },
        { id: "c2", full_name: "Стефан (втори)", email: "premium@auto.bg" },
      ],
      contact_activities: [autoMail("c1"), autoMail("c2")],
    });
    const r = await recordInboundReplies([msg]);
    expect(r.recorded).toBe(2);
    expect(h.tg).toHaveLength(1);
  });
});

describe("engagementSummary", () => {
  it("показва отговорилите и отворилите демото", () => {
    const out = engagementSummary({
      replies: [{ contact_id: "c1", name: "Стефан <Х>", title: "📩 Отговори на имейла „Тема“", excerpt: "Пратете оферта" }],
      demo: [{ contact_id: "c2", name: "Мария", pages: ["голямото демо", "B2B и фирми"] }],
      scriptAlive: true,
    });
    expect(out.text).toContain("📩 ОТГОВОРИХА (24 ч): 1");
    expect(out.text).toContain("Стефан <Х> — Отговори на имейла „Тема“ · „Пратете оферта“");
    expect(out.text).toContain("Мария — голямото демо, B2B и фирми");
    expect(out.html).toContain("Стефан &lt;Х&gt;");
    expect(out.html).toContain("/admin/clients/c1");
    expect(out.text).not.toContain("⚠️");
  });

  it("вика, когато Gmail скриптът мълчи", () => {
    const out = engagementSummary({ replies: [], demo: [], scriptAlive: false });
    expect(out.text).toContain("⚠️ Gmail проверката");
    expect(out.text).toContain("Никой.");
  });
});
