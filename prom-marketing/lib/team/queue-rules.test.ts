import { describe, it, expect } from "vitest";
import {
  ASSIGN_TYPE,
  looksLikePhone,
  phoneDigits,
  pickGiven,
  safeTextQuery,
  splitTeamDue,
  summarizeAttempts,
  type AttemptRow,
} from "./queue-rules";

const member = { team: true, team_member_id: "m1", team_member_slug: "dimitar" };

function row(contact_id: string, occurred_at: string, metadata: Record<string, unknown>, title = "опит"): AttemptRow {
  return { contact_id, activity_type: "call", title, occurred_at, created_by: "Димитър", metadata };
}

describe("последният опит и кой е звънял", () => {
  it("първият ред за картон е последният опит; team = поне един от екипа", () => {
    const rows: AttemptRow[] = [
      row("a", "2026-09-16T12:55:00Z", { ...member, outcome: "no_answer" }, "Не вдигна"),
      row("a", "2026-09-15T09:00:00Z", { outcome: "callback" }),
      row("b", "2026-09-16T10:00:00Z", {}),
    ];
    const s = summarizeAttempts(rows);
    expect(s.get("a")).toMatchObject({ count: 2, team: true, last: { title: "Не вдигна", outcome: "no_answer", hidden: false, handoff: false } });
    expect(s.get("b")).toMatchObject({ count: 1, team: false, last: { outcome: null } });
    expect(s.has("c")).toBe(false);
  });
});

function assign(contact_id: string, occurred_at: string, reason: string): AttemptRow {
  return {
    contact_id,
    activity_type: ASSIGN_TYPE,
    title: "🤝 Ивайло дава картона на екипа",
    occurred_at,
    created_by: "Ивайло",
    metadata: { reason, to_team: true },
  };
}

/** Редовете идват от базата подредени по occurred_at НИЗХОДЯЩО. */
function desc(rows: AttemptRow[]): AttemptRow[] {
  return [...rows].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}

describe("картоните, които Ивайло дава на екипа", () => {
  const rows: AttemptRow[] = desc([
    // даден вчера, екипът още не го е пипнал — стои при екипа
    assign("dadeno", "2026-09-16T08:00:00Z", "Не вдига · Ивайло е звънял 2 пъти"),
    row("dadeno", "2026-09-10T09:00:00Z", { outcome: null }, "Звъннах · не вдига"),
    // даден, но екипът вече е звънял ПОСЛЕ — влиза в обичайния поток
    assign("pipnat", "2026-09-16T08:00:00Z", "Лек контакт"),
    row("pipnat", "2026-09-16T12:00:00Z", { ...member, outcome: "no_answer" }, "Не вдигна"),
    // предаден обратно на Ивайло, после пак даден на екипа — важи новото
    assign("varnat", "2026-09-16T15:00:00Z", "Пак на екипа"),
    row("varnat", "2026-09-16T14:00:00Z", { ...member, outcome: "handoff", handoff: true }),
    // само маркер, без нито един опит (нов лийд, който Ивайло е заделил)
    assign("samo-marker", "2026-09-16T08:00:00Z", "Стар лийд"),
  ]);
  const s = summarizeAttempts(rows);

  it("маркерът не е опит за контакт — не се брои и не става „последно“", () => {
    expect(s.get("dadeno")).toMatchObject({ count: 1, team: false });
    expect(s.get("dadeno")?.last?.title).toBe("Звъннах · не вдига");
    expect(s.get("samo-marker")).toMatchObject({ count: 0, last: null });
  });

  it("причината пътува до картата", () => {
    expect(s.get("dadeno")?.given?.reason).toBe("Не вдига · Ивайло е звънял 2 пъти");
  });

  it("щом екипът звънне след маркера, картонът излиза от „от Ивайло“", () => {
    expect(s.get("pipnat")?.given).toBeNull();
    expect(s.get("pipnat")?.team).toBe(true);
  });

  it("нов маркер връща картона на екипа и след предаване на Ивайло", () => {
    expect(s.get("varnat")?.given?.reason).toBe("Пак на екипа");
  });

  it("pickGiven връща само недокоснатите, най-скоро дадените най-горе", () => {
    const got = pickGiven(
      [{ id: "dadeno" }, { id: "pipnat" }, { id: "varnat" }, { id: "samo-marker" }, { id: "nqma" }],
      s
    );
    expect(got.map((c) => c.id)).toEqual(["varnat", "dadeno", "samo-marker"]);
  });
});

describe("къде е картата, след като екипът е натиснал бутон", () => {
  // сряда 16.09.2026; краят на деня в София = 20:59:59.999Z
  const todayEnd = "2026-09-16T20:59:59.999Z";
  const due = [
    { id: "retry", next_followup_at: "2026-09-16T12:55:00Z" }, // след 3 часа, още днес
    { id: "wait", next_followup_at: "2026-09-17T07:00:00Z" }, // не вдигна следобед → утре 10:00
    { id: "hidden", next_followup_at: "2026-09-17T07:00:00Z" }, // същото, но човекът я е скрил
    { id: "handoff", next_followup_at: "2026-09-17T07:00:00Z" }, // предаден на Ивайло
    { id: "ivailo", next_followup_at: "2026-09-16T08:00:00Z" }, // обещание на Ивайло, не на екипа
    { id: "nextweek", next_followup_at: "2026-09-22T07:00:00Z" }, // говорихме, чуване другата седмица
    { id: "later-final", next_followup_at: "2026-09-18T07:00:00Z" }, // ако утре пак не вдигне — само брой
  ];
  const attempts = summarizeAttempts([
    row("retry", "2026-09-16T09:55:00Z", { ...member, outcome: "no_answer" }),
    row("wait", "2026-09-16T12:55:00Z", { ...member, outcome: "no_answer" }),
    row("hidden", "2026-09-16T12:50:00Z", { ...member, outcome: "no_answer", hidden: true }),
    row("handoff", "2026-09-16T14:09:00Z", { ...member, outcome: "handoff", handoff: true }),
    row("ivailo", "2026-09-15T09:00:00Z", { outcome: "callback" }),
    row("nextweek", "2026-09-16T11:00:00Z", { ...member, outcome: "callback" }),
    row("later-final", "2026-09-16T11:30:00Z", { ...member, outcome: "note" }),
  ]);

  it("„за повторно“ е само чието време е до края на деня", () => {
    const s = splitTeamDue(due, attempts, todayEnd);
    expect(s.retry.map((c) => c.id)).toEqual(["retry"]);
  });

  it("„чакат обратно обаждане“ = не вдигна / чуване пак, не е скрито, не е предадено; най-скорошният най-горе", () => {
    const s = splitTeamDue(due, attempts, todayEnd);
    expect(s.waiting.map((c) => c.id)).toEqual(["wait", "nextweek"]);
  });

  it("скритите и предадените не са в нито един списък, а обещанията на Ивайло не са на екипа", () => {
    const s = splitTeamDue(due, attempts, todayEnd);
    const shown = new Set([...s.retry, ...s.waiting].map((c) => c.id));
    expect(shown.has("hidden")).toBe(false);
    expect(shown.has("handoff")).toBe(false);
    expect(shown.has("ivailo")).toBe(false);
    // hidden + later-final остават в „по-нататък“; handoff и ivailo изобщо не се броят
    expect(s.later).toBe(2);
  });
});

describe("търсене по телефона, който звъни обратно", () => {
  it("свежда всички изписвания до едни и същи цифри", () => {
    expect(phoneDigits("+359 876 888 162")).toBe("876888162");
    expect(phoneDigits("0876888162")).toBe("876888162");
    expect(phoneDigits("00359876888162")).toBe("876888162");
    expect(phoneDigits("876 888")).toBe("876888");
    expect(phoneDigits("12")).toBe("");
    expect(phoneDigits("Христо")).toBe("");
  });

  it("различава телефон от име", () => {
    expect(looksLikePhone("+359 876 888 162")).toBe(true);
    expect(looksLikePhone("888")).toBe(true);
    expect(looksLikePhone("Христо Христов")).toBe(false);
    expect(looksLikePhone("Hristo 162")).toBe(false);
  });

  it("чисти знаците, които чупят филтъра", () => {
    expect(safeTextQuery("Христо, (Христов) 100%")).toBe("Христо Христов 100");
  });
});
