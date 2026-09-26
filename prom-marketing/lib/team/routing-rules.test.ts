import { describe, expect, it } from "vitest";
import { leadOwner, nextInRotation, recipientsFor, rotationPool, seesGiven, seesLead } from "./routing-rules";
import type { RotationMember } from "./routing-rules";

const dimitar: RotationMember = { id: "d", role: "setter", permissions: {}, active: true, created_at: "2026-09-16T07:00:00Z" };
const ivan: RotationMember = { id: "i", role: "delivery", permissions: {}, active: true, created_at: "2026-09-19T07:00:00Z" };
const elena: RotationMember = {
  id: "e",
  role: "sales",
  permissions: { modules: { zvanene: true } },
  active: true,
  created_at: "2026-09-26T09:00:00Z",
};

describe("ротацията: кой е в кръга", () => {
  it("вътре са хората със „Звънене“ — сетърът и продавачката със звънене; изпълнението не", () => {
    expect(rotationPool([elena, ivan, dimitar]).map((m) => m.id)).toEqual(["d", "e"]);
  });

  it("спрян достъп или махнато звънене изважда човека от кръга", () => {
    expect(rotationPool([dimitar, { ...elena, active: false }]).map((m) => m.id)).toEqual(["d"]);
    expect(rotationPool([dimitar, { ...elena, permissions: {} }]).map((m) => m.id)).toEqual(["d"]);
  });

  it("собственикът никога не е в кръга", () => {
    expect(rotationPool([{ ...dimitar, id: "o", role: "owner" }])).toEqual([]);
  });
});

describe("ротацията: 50 на 50", () => {
  const pool = [dimitar, elena];

  it("един при Димитър, един при Елена, един при Димитър…", () => {
    const got: string[] = [];
    let last: string | null = null;
    for (let i = 0; i < 6; i++) {
      const next: RotationMember | null = nextInRotation(pool, last);
      got.push(next!.id);
      last = next!.id;
    }
    expect(got).toEqual(["d", "e", "d", "e", "d", "e"]);
  });

  it("последният получил вече не е в кръга → започва отначало", () => {
    expect(nextInRotation(pool, "някой-спрян")?.id).toBe("d");
  });

  it("празен кръг → никой", () => {
    expect(nextInRotation([], "d")).toBeNull();
  });

  it("сам човек в кръга получава всичко", () => {
    expect(nextInRotation([dimitar], "d")?.id).toBe("d");
  });
});

describe("ротацията: кой вижда картата", () => {
  const pool = [dimitar, elena];

  it("лийдът е при човека, при когото е влязъл", () => {
    expect(seesLead("e", "e", pool)).toBe(true);
    expect(seesLead("d", "e", pool)).toBe(false);
  });

  it("стар лийд без човек е на първия в кръга (както преди)", () => {
    expect(leadOwner(null, pool)).toBe("d");
    expect(seesLead("d", null, pool)).toBe(true);
    expect(seesLead("e", null, pool)).toBe(false);
  });

  it("лийд на човек извън кръга отива при първия", () => {
    expect(seesLead("d", "i", pool)).toBe(true);
  });

  it("собственикът вижда всичко", () => {
    expect(seesLead(null, "e", pool)).toBe(true);
    expect(seesGiven(null, "d", "e", pool)).toBe(true);
  });

  it("даденият картон е при човека от маркера, иначе при човека на лийда", () => {
    expect(seesGiven("e", "e", "d", pool)).toBe(true);
    expect(seesGiven("d", "e", "d", pool)).toBe(false);
    expect(seesGiven("e", null, "e", pool)).toBe(true);
    expect(seesGiven("e", "i", "e", pool)).toBe(true);
  });
});

describe("ротацията: кой получава писмото", () => {
  const pool = [dimitar, elena];
  const notify = [
    { id: "d", email: "d@x" },
    { id: "e", email: "e@x" },
    { id: "i", email: "i@x" },
  ];

  it("писмото за лийд отива при неговия човек и при наблюдаващите извън кръга", () => {
    expect(recipientsFor(notify, pool, "e").map((m) => m.email)).toEqual(["e@x", "i@x"]);
  });

  it("без картон — до всички с известие", () => {
    expect(recipientsFor(notify, pool, undefined)).toHaveLength(3);
  });
});
