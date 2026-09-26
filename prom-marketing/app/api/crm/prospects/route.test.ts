import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.INTERNAL_SEND_TOKEN = "test-token-abcdef";

const m = vi.hoisted(() => ({ importProspectRows: vi.fn(), prospectStats: vi.fn() }));
vi.mock("@/lib/team/prospects", () => m);

import { POST } from "./route";

function req(body: unknown, token: string | null = "test-token-abcdef") {
  const headers = new Headers({ "content-type": "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new Request("https://example.com/api/crm/prospects", { method: "POST", headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  m.importProspectRows.mockReset();
  m.importProspectRows.mockResolvedValue({ inserted: 1, merged: 0, error: null });
});

describe("POST /api/crm/prospects", () => {
  it("без токен — 403, нищо не се пише", async () => {
    const res = await POST(req({ batch: "x", rows: [{ company: "Алфа" }] }, null));
    expect(res.status).toBe(403);
    expect(m.importProspectRows).not.toHaveBeenCalled();
  });

  it("празен пакет или прекалено голям — 400", async () => {
    expect((await POST(req({ batch: "x", rows: [] }))).status).toBe(400);
    expect((await POST(req({ batch: "x", rows: Array.from({ length: 1001 }, () => ({ company: "a" })) }))).status).toBe(400);
  });

  it("чисти редовете и прескача безименните", async () => {
    const res = await POST(
      req({ batch: "Gotovi 2026-09-26", rows: [{ company: "Алфа", city: "sofia", phone: "0888 123 456", priority: 1 }, { company: "" }] })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, received: 2, inserted: 1, skipped: 1 });
    const rows = m.importProspectRows.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ company: "Алфа", city: "София", phone_key: "359888123456", batch: "gotovi-2026-09-26", priority: 1 });
  });
});
