import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/welcome", () => ({ sendWelcomeEmail: vi.fn(async () => {}) }));

type Row = Record<string, unknown>;
const db: { contacts: Row[]; contact_activities: Row[] } = { contacts: [], contact_activities: [] };
let queries = 0;
let seq = 0;

/** Много малко подобие на query builder-а на supabase-js — само каквото ползва mirrorLeadsToContacts. */
class Q implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Array<(r: Row) => boolean> = [];
  private mode: "select" | "insert" | "update" = "select";
  private payload: Row | Row[] = {};
  private max = Infinity;
  private one = false;
  constructor(private table: "contacts" | "contact_activities") {
    queries++;
  }
  select() {
    return this;
  }
  insert(p: Row | Row[]) {
    this.mode = "insert";
    this.payload = p;
    return this;
  }
  update(p: Row) {
    this.mode = "update";
    this.payload = p;
    return this;
  }
  eq(c: string, v: unknown) {
    this.filters.push((r) => r[c] === v);
    return this;
  }
  in(c: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[c]));
    return this;
  }
  ilike(c: string, v: string) {
    this.filters.push((r) => String(r[c] ?? "").toLowerCase() === v.toLowerCase());
    return this;
  }
  or(expr: string) {
    const pats = [...expr.matchAll(/email\.ilike\."([^"]+)"/g)].map((m) => m[1].toLowerCase());
    this.filters.push((r) => pats.includes(String(r.email ?? "").toLowerCase()));
    return this;
  }
  contains(c: string, o: Row) {
    this.filters.push((r) => Object.entries(o).every(([k, v]) => (r[c] as Row)?.[k] === v));
    return this;
  }
  order() {
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }
  maybeSingle() {
    this.one = true;
    return this;
  }
  private run() {
    const rows = db[this.table];
    if (this.mode === "insert") {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p) => ({ id: `id${++seq}`, ...p }));
      rows.push(...list);
      return { data: this.one ? list[0] : list, error: null };
    }
    const hit = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.mode === "update") {
      hit.forEach((r) => Object.assign(r, this.payload));
      return { data: null, error: null };
    }
    const out = hit.slice(0, this.max);
    return { data: this.one ? (out[0] ?? null) : out, error: null };
  }
  then<T = { data: unknown; error: unknown }, U = never>(
    ok?: ((v: { data: unknown; error: unknown }) => T | PromiseLike<T>) | null,
    bad?: ((e: unknown) => U | PromiseLike<U>) | null
  ): PromiseLike<T | U> {
    return Promise.resolve(this.run()).then(ok, bad);
  }
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: (t: "contacts" | "contact_activities") => new Q(t) }),
}));

import { mirrorLeadsToContacts, type NormalizedLead } from "./import";

function lead(n: number, over: Partial<NormalizedLead> = {}): NormalizedLead {
  return {
    meta_lead_id: `m${n}`,
    form_id: "f1",
    form_name: "Форма",
    campaign_id: null,
    campaign_name: null,
    ad_id: null,
    ad_name: null,
    full_name: `Лийд ${n}`,
    email: `lead${n}@example.com`,
    phone: `+3598800000${n}`,
    field_data: {},
    source: "test",
    created_time: "2026-11-01T10:00:00.000Z",
    ...over,
  };
}

beforeEach(() => {
  db.contacts = [];
  db.contact_activities = [];
  queries = 0;
  seq = 0;
});

describe("mirrorLeadsToContacts", () => {
  it("създава контакт и запис в хронологията за нов лийд", async () => {
    expect(await mirrorLeadsToContacts([lead(1)])).toBe(1);
    expect(db.contacts).toHaveLength(1);
    expect(db.contact_activities).toHaveLength(1);
  });

  it("намира съществуващ контакт по имейл без значение от регистъра и не прави дубликат", async () => {
    db.contacts.push({ id: "c1", email: "Lead1@Example.com", full_name: null, phone: null, created_at: "2026-01-01" });
    expect(await mirrorLeadsToContacts([lead(1)])).toBe(0);
    expect(db.contacts).toHaveLength(1);
    expect(db.contacts[0]).toMatchObject({ full_name: "Лийд 1", phone: "+35988000001" });
    expect(db.contact_activities[0]).toMatchObject({ contact_id: "c1" });
  });

  it("намира по телефон, когато имейлът не съвпада", async () => {
    db.contacts.push({ id: "c1", email: "other@example.com", full_name: "Той", phone: "+35988000001", created_at: "2026-01-01" });
    expect(await mirrorLeadsToContacts([lead(1)])).toBe(0);
    expect(db.contacts).toHaveLength(1);
    expect(db.contact_activities[0]).toMatchObject({ contact_id: "c1" });
  });

  it("два лийда със същия имейл в една партида дават един контакт", async () => {
    const created = await mirrorLeadsToContacts([lead(1), lead(2, { email: "LEAD1@example.com", phone: "+35988000099" })]);
    expect(created).toBe(1);
    expect(db.contacts).toHaveLength(1);
    expect(db.contact_activities).toHaveLength(2);
  });

  it("същият meta_lead_id не се записва втори път (нито в партидата, нито при повторно пускане)", async () => {
    await mirrorLeadsToContacts([lead(1), lead(1)]);
    expect(db.contact_activities).toHaveLength(1);
    await mirrorLeadsToContacts([lead(1)]);
    expect(db.contacts).toHaveLength(1);
    expect(db.contact_activities).toHaveLength(1);
  });

  it("при най-стари дубликати взима най-стария (първия по ред)", async () => {
    db.contacts.push(
      { id: "old", email: "lead1@example.com", full_name: "A", phone: "+1", created_at: "2025-01-01" },
      { id: "new", email: "lead1@example.com", full_name: "B", phone: "+2", created_at: "2026-01-01" }
    );
    await mirrorLeadsToContacts([lead(1)]);
    expect(db.contact_activities[0]).toMatchObject({ contact_id: "old" });
  });

  it("лийд без имейл и телефон се пропуска", async () => {
    expect(await mirrorLeadsToContacts([lead(1, { email: null, phone: null })])).toBe(0);
    expect(db.contacts).toHaveLength(0);
  });

  it("имейл със специални знаци минава по стария път и пак не прави дубликат", async () => {
    db.contacts.push({ id: "c1", email: 'a"b@example.com', full_name: "X", phone: "+5", created_at: "2026-01-01" });
    expect(await mirrorLeadsToContacts([lead(1, { email: 'a"b@example.com', phone: null })])).toBe(0);
    expect(db.contacts).toHaveLength(1);
  });

  it("не прави заявка на лийд за търсенето: 50 съществуващи лийда ≈ малко заявки", async () => {
    const leads = Array.from({ length: 50 }, (_, i) => lead(i + 1));
    leads.forEach((l, i) =>
      db.contacts.push({ id: `c${i}`, email: l.email, full_name: l.full_name, phone: l.phone, created_at: "2026-01-01" })
    );
    await mirrorLeadsToContacts(leads);
    // 1 (имейли) + 1 (телефони) + 1 (хронология) + 1 (запис на 50 реда)
    expect(queries).toBeLessThanOrEqual(5);
    expect(db.contact_activities).toHaveLength(50);
  });
});
