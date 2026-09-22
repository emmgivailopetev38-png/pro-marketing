import { describe, expect, it } from "vitest";
import {
  OWNER_REF,
  actedAt,
  aggregateAll,
  bookedBy,
  callOutcome,
  callStats,
  dataFor,
  humanMinutes,
  insightsFor,
  meetingStats,
  ownerTasksOf,
  parsePeriod,
  personNapredak,
  plural,
  splitByPerson,
  taskStats,
  tasksDoneBetween,
  teamAverage,
  teamRowOf,
  windowsFor,
  type NapredakActivity,
  type NapredakBooking,
  type NapredakPool,
  type NapredakTask,
  type PersonRef,
  type TeamRow,
} from "./napredak-rules";

// Вторник 22.09.2026, 10:00 София (07:00 UTC). Период 7 дни → от 15.09 07:00 UTC.
const NOW = new Date("2026-09-22T07:00:00Z");
const CTX = { days: 7, now: NOW };

const DIMITAR: PersonRef = { key: "dimitar", name: "Димитър", role: "setter", kind: "team", memberId: "m1" };
const IVAN: PersonRef = { key: "ivan-tashev", name: "Ivan Tashev", role: "delivery", kind: "team", memberId: "m2" };
const TEAM = ["Димитър", "Ivan Tashev"];

function act(p: Partial<NapredakActivity> & { contact_id: string; activity_type: string; occurred_at: string }): NapredakActivity {
  return { created_by: "Димитър", ...p };
}
function call(contact: string, at: string, outcome: string, extra: Record<string, unknown> = {}): NapredakActivity {
  return act({ contact_id: contact, activity_type: "call", occurred_at: at, metadata: { team: true, outcome, ...extra } });
}
function booking(p: Partial<NapredakBooking> & { id: string; created_at: string; scheduled_at: string }): NapredakBooking {
  return { status: "accepted", notes: null, ...p };
}
function task(p: Partial<NapredakTask> & { id: string }): NapredakTask {
  return {
    title: p.id,
    status: "todo",
    due_date: null,
    priority: "normal",
    assignee_id: null,
    project_id: null,
    contact_id: null,
    done_at: null,
    ...p,
  };
}

// ── Основата: активностите на екипа и на Ивайло ─────────────────────────────

const DIMITAR_CUR: NapredakActivity[] = [
  call("c1", "2026-09-16T08:00:00Z", "no_answer"),
  call("c1", "2026-09-16T09:00:00Z", "callback"),
  act({ contact_id: "c1", activity_type: "note", occurred_at: "2026-09-16T09:05:00Z", metadata: { team: true, outcome: "note" } }),
  call("c2", "2026-09-16T10:00:00Z", "not_interested"),
  call("c3", "2026-09-16T10:30:00Z", "wrong_number"),
  // Срещата стои в картона с датата на срещата (бъдеще), но е записана на 17.09.
  act({
    contact_id: "c4",
    activity_type: "meeting",
    occurred_at: "2026-09-23T09:00:00Z",
    created_at: "2026-09-17T10:00:00Z",
    metadata: { team: true, outcome: "meeting", booking_id: "b1" },
  }),
  act({ contact_id: "c6", activity_type: "viber_sent", occurred_at: "2026-09-17T10:05:00Z", metadata: { team: true, booking_msg: true } }),
  call("c5", "2026-09-18T08:00:00Z", "handoff", { handoff: true }),
  act({ contact_id: "c7", activity_type: "viber_sent", occurred_at: "2026-09-18T09:00:00Z", metadata: { team: true } }),
  call("c10", "2026-09-18T11:00:00Z", "callback"),
  call("c11", "2026-09-19T08:00:00Z", "callback"),
  call("c12", "2026-09-19T09:00:00Z", "talked"),
];

const DIMITAR_PREV: NapredakActivity[] = [
  call("c8", "2026-09-10T08:00:00Z", "no_answer"),
  call("c8", "2026-09-11T08:00:00Z", "callback"),
  act({
    contact_id: "c9",
    activity_type: "meeting",
    occurred_at: "2026-09-12T10:00:00Z",
    created_at: "2026-09-10T09:00:00Z",
    metadata: { team: true, outcome: "meeting" },
  }),
];

const OTHERS: NapredakActivity[] = [
  act({ contact_id: "c20", activity_type: "call", occurred_at: "2026-09-18T08:00:00Z", created_by: "Ивайло", metadata: {} }),
  act({ contact_id: "c21", activity_type: "call", occurred_at: "2026-09-18T09:00:00Z", created_by: "ivailo", metadata: { kind: "dnevnik" } }),
  act({ contact_id: "c22", activity_type: "meeting", occurred_at: "2026-09-18T10:00:00Z", created_by: "hermes", metadata: {} }),
  act({ contact_id: "c30", activity_type: "project_update", occurred_at: "2026-09-17T08:00:00Z", created_by: "Ivan Tashev", metadata: { team: true } }),
  act({ contact_id: "c30", activity_type: "task_done", occurred_at: "2026-09-17T09:00:00Z", created_by: "Ivan Tashev", metadata: { team: true } }),
  // Сутрешната проверка връща c1 на Ивайло — Димитър го е звънял на 16.09; c41 никой от екипа не е пипал.
  act({ contact_id: "c1", activity_type: "escalated", occurred_at: "2026-09-19T06:00:00Z", created_by: "система", metadata: { escalated: true, rule: "7d" } }),
  act({ contact_id: "c41", activity_type: "escalated", occurred_at: "2026-09-19T06:00:00Z", created_by: "система", metadata: { escalated: true, rule: "7d" } }),
  act({ contact_id: "c41", activity_type: "email_sent", occurred_at: "2026-09-19T06:00:00Z", created_by: "warm_sequence", metadata: {} }),
];

const BOOKINGS: NapredakBooking[] = [
  booking({ id: "b1", created_at: "2026-09-17T10:00:00Z", scheduled_at: "2026-09-23T09:00:00Z", notes: "Занимава се с машини. · Записа: Димитър" }),
  booking({
    id: "b2",
    created_at: "2026-09-16T12:00:00Z",
    scheduled_at: "2026-09-18T10:00:00Z",
    status: "completed",
    notes: "Записа: Димитър (върна обаждане след „Не вдигна“; въведено от Ивайло по думите му)",
  }),
  booking({ id: "b3", created_at: "2026-09-16T12:30:00Z", scheduled_at: "2026-09-19T10:00:00Z", status: "no_show", notes: "x · Записа: Димитър" }),
  booking({ id: "b4", created_at: "2026-09-15T12:00:00Z", scheduled_at: "2026-09-20T10:00:00Z", status: "cancelled", notes: "Записа: Димитър" }),
  booking({ id: "b5", created_at: "2026-09-16T13:00:00Z", scheduled_at: "2026-09-17T10:00:00Z", notes: "Записа: Димитър" }),
  booking({ id: "b6", created_at: "2026-09-17T15:00:00Z", scheduled_at: "2026-09-25T10:00:00Z" }),
  booking({ id: "b7", created_at: "2026-09-10T09:00:00Z", scheduled_at: "2026-09-12T10:00:00Z", status: "completed", notes: "Записа: Димитър" }),
];

const POOL: NapredakPool = {
  activities: [...DIMITAR_CUR, ...DIMITAR_PREV, ...OTHERS],
  leads: [
    { id: "c1", created_at: "2026-09-16T07:30:00Z" },
    { id: "c2", created_at: "2026-09-16T09:00:00Z" },
    { id: "c4", created_at: "2026-09-17T06:00:00Z" },
    { id: "c20", created_at: "2026-09-18T07:00:00Z" },
    { id: "c8", created_at: "2026-09-10T07:00:00Z" },
  ],
  bookings: BOOKINGS,
  teamNames: TEAM,
};

const DIMITAR_TASKS: NapredakTask[] = [
  task({ id: "t1", due_date: "2026-09-21", assignee_id: "m1" }),
  task({ id: "t2", due_date: "2026-09-22", assignee_id: "m1" }),
  task({ id: "t3", status: "done", done_at: "2026-09-16T10:00:00Z", assignee_id: "m1" }),
  task({ id: "t4", status: "done", done_at: "2026-09-10T10:00:00Z", assignee_id: "m1" }),
  task({ id: "t5", assignee_id: "m1" }),
];
const IVAN_TASKS: NapredakTask[] = [
  task({ id: "t6", status: "done", done_at: "2026-09-17T09:00:00Z", assignee_id: "m2" }),
  task({ id: "t7", due_date: "2026-09-25", assignee_id: "m2" }),
];

describe("периодът", () => {
  it("?d= приема само 7/30/90", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod(["90"])).toBe(90);
    expect(parsePeriod("15")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
  });

  it("предходният период свършва миг преди текущия да започне", () => {
    const { cur, prev } = windowsFor(CTX);
    expect(cur.from.toISOString()).toBe("2026-09-15T07:00:00.000Z");
    expect(cur.to).toEqual(NOW);
    expect(prev.from.toISOString()).toBe("2026-09-08T07:00:00.000Z");
    expect(prev.to.getTime()).toBe(cur.from.getTime() - 1);
  });
});

describe("кога е свършена работата", () => {
  it("срещата, записана днес за утре, е работа от днес", () => {
    expect(actedAt({ occurred_at: "2026-09-23T09:00:00Z", created_at: "2026-09-17T10:00:00Z" })).toBe("2026-09-17T10:00:00Z");
  });
  it("стар разговор, въведен по-късно, си остава на своя ден", () => {
    expect(actedAt({ occurred_at: "2026-09-10T09:00:00Z", created_at: "2026-09-17T10:00:00Z" })).toBe("2026-09-10T09:00:00Z");
    expect(actedAt({ occurred_at: "2026-09-10T09:00:00Z", created_at: null })).toBe("2026-09-10T09:00:00Z");
  });
});

describe("изходът от обаждането", () => {
  it("бутоните на екипа", () => {
    for (const o of ["callback", "talked", "meeting", "handoff"]) expect(callOutcome({ metadata: { outcome: o } })).toBe("talked");
    expect(callOutcome({ metadata: { outcome: "no_answer" } })).toBe("no_answer");
    expect(callOutcome({ metadata: { outcome: "not_interested" } })).toBe("not_interested");
    expect(callOutcome({ metadata: { outcome: "wrong_number" } })).toBe("wrong_number");
  });
  it("старият речник на Ивайло и дневникът", () => {
    expect(callOutcome({ metadata: { outcome: "answered_positive" } })).toBe("talked");
    expect(callOutcome({ metadata: { outcome: "callback_requested" } })).toBe("talked");
    expect(callOutcome({ metadata: { outcome: "voicemail" } })).toBe("no_answer");
    expect(callOutcome({ metadata: { kind: "dnevnik" } })).toBe("talked");
  });
  it("без изход е неизвестно, не „не вдигна“", () => {
    expect(callOutcome({ metadata: {} })).toBe("unknown");
    expect(callOutcome({ metadata: null })).toBe("unknown");
    expect(callOutcome({ metadata: { outcome: "нещо-ново" } })).toBe("unknown");
  });
});

describe("кой е записал срещата", () => {
  it("подписът в бележката, дори със скоби след него", () => {
    expect(bookedBy({ notes: "Занимава се с машини. · Записа: Димитър" }, TEAM)).toEqual({ kind: "team", name: "Димитър" });
    expect(bookedBy({ notes: "Записа: Димитър (върна обаждане; въведено от Ивайло по думите му)" }, TEAM)).toEqual({ kind: "team", name: "Димитър" });
    expect(bookedBy({ notes: "бележка · Записа: Ivan Tashev" }, TEAM)).toEqual({ kind: "team", name: "Ivan Tashev" });
    expect(bookedBy({ notes: "Записа: Ивайло" }, TEAM).kind).toBe("owner");
  });
  it("без подпис (Cal.com, Хермес) или с непознато име е на Ивайло", () => {
    expect(bookedBy({ notes: null }, TEAM).kind).toBe("owner");
    expect(bookedBy({ notes: "Записа: Някой Друг" }, TEAM).kind).toBe("owner");
  });
});

describe("обемът", () => {
  it("разбивката на обажданията се събира до броя им; срещата от бутона е и обаждане", () => {
    const s = callStats(DIMITAR_CUR);
    expect(s.calls).toBe(9);
    expect(s.talked).toBe(6);
    expect(s.noAnswer + s.notInterested + s.wrongNumber + s.talked + s.unknown).toBe(s.calls);
    expect(s.noAnswer).toBe(1);
    expect(s.notInterested).toBe(1);
    expect(s.wrongNumber).toBe(1);
    expect(s.unknown).toBe(0);
    expect(s.reached).toBe(7);
    expect(s.handoffs).toBe(1);
    expect(s.meetingsLogged).toBe(1);
  });
  it("Viber съобщението за среща е съобщение, не обаждане и не докосване", () => {
    const s = callStats(DIMITAR_CUR);
    expect(s.messages).toBe(1);
    expect(s.viber).toBe(1);
    expect(s.notes).toBe(1);
    // c1, c2, c3, c4, c5, c7, c10, c11, c12 — c6 е само съобщение
    expect(s.people).toBe(9);
  });
  it("обаждане без изход е „без изход“, дневникът е разговор", () => {
    const s = callStats(OTHERS.filter((a) => a.activity_type === "call"));
    expect(s).toMatchObject({ calls: 2, talked: 1, unknown: 1, diary: 1, people: 2 });
  });
  it("активностите се делят по човек; автоматиките не са на никого", () => {
    const split = splitByPerson(POOL.activities, [OWNER_REF, DIMITAR, IVAN], TEAM);
    expect(split.get("dimitar")).toHaveLength(DIMITAR_CUR.length + DIMITAR_PREV.length);
    expect(split.get("ivailo")).toHaveLength(2);
    expect(split.get("ivan-tashev")).toHaveLength(2);
  });
});

describe("срещите по bookings", () => {
  it("проведени, не се явили, предстоящи, отказани, минали без изход; явяемост само по решените", () => {
    const mine = BOOKINGS.filter((b) => b.id !== "b6" && b.id !== "b7");
    expect(meetingStats(mine, NOW)).toEqual({ booked: 5, completed: 1, noShow: 1, upcoming: 1, cancelled: 1, pastUnmarked: 1, showRate: 50 });
  });
  it("без нито една решена среща явяемостта е null, не 0", () => {
    expect(meetingStats([BOOKINGS[0]], NOW).showRate).toBeNull();
  });
});

describe("задачите", () => {
  it("готовите се броят по done_at в периода; снимката сега — по купчините", () => {
    const { cur } = windowsFor(CTX);
    expect(tasksDoneBetween(DIMITAR_TASKS, cur)).toBe(1);
    expect(taskStats(DIMITAR_TASKS, NOW, cur)).toEqual({ done: 1, overdue: 1, today: 1, week: 0, later: 0, nodate: 1, open: 3 });
  });
  it("задачите на Ивайло са тези без изпълнител и без отговорник по проекта", () => {
    const rows: NapredakTask[] = [
      task({ id: "a", assignee_name: "Ивайло" }),
      task({ id: "b", assignee_id: "m1", assignee_name: "Димитър" }),
      task({ id: "c", project_id: "p1", assignee_name: "Ivan Tashev" }),
      task({ id: "d", assignee_id: "m9", assignee_name: null }),
    ];
    expect(ownerTasksOf(rows).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("един човек за период и за предходния", () => {
  const mine = [...DIMITAR_CUR, ...DIMITAR_PREV];
  const p = personNapredak(POOL, DIMITAR, mine, DIMITAR_TASKS, CTX);

  it("текущият и предходният период са разделени по момента на действието", () => {
    expect(p.cur.volume.calls).toBe(9);
    expect(p.prev.volume.calls).toBe(3);
    expect(p.prev.volume.talked).toBe(2);
    expect(p.cur.meetings.booked).toBe(5);
    expect(p.prev.meetings).toMatchObject({ booked: 1, completed: 1, showRate: 100 });
    expect(p.cur.tasksDone).toBe(1);
    expect(p.prev.tasksDone).toBe(1);
  });

  it("процентите: говорихме/обаждания и разговори за една среща", () => {
    expect(p.cur.talkedPct).toBe(67);
    expect(p.cur.perMeeting).toBe(1.2);
    expect(p.prev.perMeeting).toBe(2);
  });

  it("делтите спрямо предходния период", () => {
    expect(p.deltas.calls).toBe(200);
    expect(p.deltas.meetings).toBe(400);
    expect(p.deltas.tasksDone).toBe(0);
  });

  it("скоростта е по МОЕТО първо докосване на лийдовете от периода", () => {
    // c1: 30 мин, c2: 60 мин, c4: 240 мин (по записването на срещата, не по датата ѝ); c20 е чут от Ивайло, не от Димитър
    expect(p.cur.speed).toEqual({ leads: 4, touched: 3, untouched: 1, within1h: 2, within24h: 3, medianMinutes: 60 });
    expect(p.prev.speed.medianMinutes).toBe(60);
  });

  it("върнатите на Ивайло са на този, който е звънял преди връщането; собственикът не губи нищо", () => {
    expect(p.cur.volume.escalated).toBe(1);
    expect(p.prev.volume.escalated).toBe(0);
    const owner = personNapredak(POOL, OWNER_REF, OTHERS.filter((a) => ["Ивайло", "ivailo"].includes(a.created_by ?? "")), [], CTX);
    expect(owner.cur.volume.escalated).toBe(0);
  });

  it("по дни — по момента на действието, в София; съобщението и бележката не са действия", () => {
    const byDay = new Map(p.perDay.map((d) => [d.day, d.n]));
    expect(p.perDay).toHaveLength(8);
    expect(byDay.get("2026-09-16")).toBe(4);
    expect(byDay.get("2026-09-17")).toBe(1);
    expect(byDay.get("2026-09-18")).toBe(3);
    expect(byDay.get("2026-09-19")).toBe(2);
    expect(p.perDay.reduce((s, d) => s + d.n, 0)).toBe(10);
  });

  it("изводите са изречения само от истинските числа", () => {
    expect(p.insights).toEqual([
      "За 1 среща ти трябват 1,2 разговора; миналия период бяха 2.",
      "От 7 вдигнали 5 записаха среща (71%).",
      "Говорихме в 67% от обажданията (6 от 9). Миналия период: 67%.",
      "Обажданията са с 200% повече от предходния период (9 срещу 3).",
      "Средно стигаш до новия лийд за 1 ч. Миналия период: 1 ч.",
      "Явяемост 50% — 1 проведени, 1 не се явиха.",
      "1 минала среща без отбелязан изход — проведена или не се яви?",
      "1 човек е предаден на Ивайло.",
      "1 лийд е върнат на Ивайло след 7 дни без отговор.",
      "1 просрочена задача.",
      "1 съобщение по Viber за среща.",
    ]);
  });
});

describe("изводите при малко или никакви данни", () => {
  it("човек без действия получава едно изречение, плюс просрочените, ако има", () => {
    const p = personNapredak(POOL, IVAN, [], [task({ id: "x", due_date: "2026-09-01", assignee_id: "m2" })], CTX);
    expect(p.insights).toEqual(["Още няма записани действия за този период.", "1 просрочена задача."]);
  });

  it("изпълнението вижда задачи и обновления, не разговори", () => {
    const mine = OTHERS.filter((a) => a.created_by === "Ivan Tashev");
    const p = personNapredak(POOL, IVAN, mine, IVAN_TASKS, CTX);
    expect(p.cur.volume).toMatchObject({ calls: 0, projectUpdates: 1, tasksLogged: 1 });
    expect(p.cur.tasksDone).toBe(1);
    expect(p.insights).toEqual(["1 обновление по проект."]);
  });

  it("без срещи няма „разговори за среща“; под 5 обаждания няма процент", () => {
    const mine = [call("c1", "2026-09-16T08:00:00Z", "callback"), call("c2", "2026-09-16T09:00:00Z", "no_answer")];
    const p = personNapredak({ ...POOL, bookings: [] }, DIMITAR, mine, [], CTX);
    expect(p.cur.perMeeting).toBeNull();
    expect(p.insights.some((s) => s.startsWith("За 1 среща"))).toBe(false);
    expect(p.insights.some((s) => s.startsWith("Говорихме в"))).toBe(false);
  });

  it("за собственика срещите от Cal.com са негови, обаждане без изход не е „говорихме“", () => {
    const mine = OTHERS.filter((a) => ["Ивайло", "ivailo"].includes(a.created_by ?? ""));
    const p = personNapredak(POOL, OWNER_REF, mine, [], CTX);
    expect(p.cur.volume).toMatchObject({ calls: 2, talked: 1, unknown: 1 });
    expect(p.cur.meetings).toMatchObject({ booked: 1, upcoming: 1 });
    expect(p.cur.talkedPct).toBe(100);
    expect(insightsFor(p)).toContain("За 1 среща ти трябват 1 разговор.");
  });
});

describe("всички наведнъж и сравнението", () => {
  const tasks = new Map<string, NapredakTask[]>([
    ["dimitar", DIMITAR_TASKS],
    ["ivan-tashev", IVAN_TASKS],
  ]);
  const all = aggregateAll(POOL, [OWNER_REF, DIMITAR, IVAN], tasks, CTX);

  it("по един ред на човек, в подадения ред", () => {
    expect(all.people.map((p) => p.person.key)).toEqual(["ivailo", "dimitar", "ivan-tashev"]);
    expect(all.team.map((r) => r.calls)).toEqual([2, 9, 0]);
    expect(all.workdays).toBe(6);
    expect(all.from).toBe("2026-09-15T07:00:00.000Z");
  });

  it("средното е по хората, които са работили; явяемост и скорост — по тези, които ги имат", () => {
    expect(all.average).toEqual({
      calls: 3.7,
      talked: 2.3,
      meetings: 2,
      showRate: 50,
      medianMinutes: 60,
      people: 3.7,
      tasksDone: 0.7,
      tasksOverdue: 0.3,
      projectUpdates: 0.3,
    });
  });

  it("човек без нито едно действие не сваля средното", () => {
    const idle: TeamRow = { ...teamRowOf(all.people[2]), tasksDone: 0, projectUpdates: 0, people: 0 };
    const avg = teamAverage([all.team[1], idle]);
    expect(avg?.calls).toBe(9);
    expect(teamAverage([])).toBeNull();
  });

  it("таблото на един човек носи и всички за сравнението", () => {
    const d = dataFor(all, "dimitar");
    expect(d?.me.person.name).toBe("Димитър");
    expect(d?.team).toHaveLength(3);
    expect(d?.people.map((p) => p.key)).toEqual(["ivailo", "dimitar", "ivan-tashev"]);
    expect(dataFor(all, "nqkoi")).toBeNull();
  });
});

describe("думите", () => {
  it("минути по човешки", () => {
    expect(humanMinutes(null)).toBe("—");
    expect(humanMinutes(34)).toBe("34 мин");
    expect(humanMinutes(60)).toBe("1 ч");
    expect(humanMinutes(200)).toBe("3 ч 20 мин");
    expect(humanMinutes(1440)).toBe("1 ден");
    expect(humanMinutes(4000)).toBe("3 дни");
  });
  it("единствено и множествено число", () => {
    expect(plural(1, "среща", "срещи")).toBe("1 среща");
    expect(plural(3, "среща", "срещи")).toBe("3 срещи");
    expect(plural(1.5, "разговор", "разговора")).toBe("1,5 разговора");
  });
});
