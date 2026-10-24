import { describe, it, expect } from "vitest";
import {
  ASSIGN_TYPE,
  GIVE_UP_AFTER_NO_ANSWERS,
  NOTES_ON_CARD,
  canGiveUp,
  givenKindOf,
  isNoAnswer,
  looksLikePhone,
  notesByContact,
  noteText,
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

function assign(contact_id: string, occurred_at: string, reason: string, kind = "given"): AttemptRow {
  return {
    contact_id,
    activity_type: ASSIGN_TYPE,
    title: kind === "cancelled" ? "❌ Отказана среща" : "🤝 Ивайло дава картона на екипа",
    occurred_at,
    created_by: kind === "cancelled" ? "Cal.com" : "Ивайло",
    metadata: { reason, to_team: true, kind },
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
    // отказана среща — същият механизъм, друг вид
    assign("otkazal", "2026-09-16T09:00:00Z", "❌ Отказа срещата за пт 18.09", "cancelled"),
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

  it("отказаната среща се различава от дадения картон по вида", () => {
    expect(s.get("otkazal")?.given).toMatchObject({ kind: "cancelled", reason: "❌ Отказа срещата за пт 18.09" });
    expect(s.get("dadeno")?.given?.kind).toBe("given");
    // и двата вида минават през pickGiven — страницата ги разделя
    expect(pickGiven([{ id: "otkazal" }, { id: "dadeno" }], s).map((c) => c.id)).toEqual(["otkazal", "dadeno"]);
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

describe("queue-rules: маркерът за продавач не е за опашката", () => {
  it("team_assigned с kind sales не прави картона „от Ивайло“", async () => {
    const { summarizeAttempts } = await import("./queue-rules");
    const m = summarizeAttempts([
      {
        contact_id: "c1",
        activity_type: "team_assigned",
        title: "🤝 Даден на продавач",
        occurred_at: "2026-09-22T08:00:00Z",
        created_by: "Ивайло",
        metadata: { kind: "sales", to_member_id: "s1" },
      },
    ]);
    expect(m.get("c1")?.given ?? null).toBeNull();
  });
});

describe("върнат на Ивайло след 7 дни и готовите съобщения за срещи", () => {
  const member = { team: true, team_member_id: "m1", team_member_slug: "dimitar" };
  const call = (id: string, at: string, outcome: string): AttemptRow => ({
    contact_id: id,
    activity_type: "call",
    title: outcome,
    occurred_at: at,
    created_by: "Димитър",
    metadata: { ...member, outcome },
  });

  it("escalated маха картата от списъка на екипа и обезсилва старото „от Ивайло“", () => {
    const rows: AttemptRow[] = [
      { contact_id: "a", activity_type: "escalated", title: "⏫", occurred_at: "2026-09-22T04:00:00Z", created_by: "система", metadata: { escalated: true } },
      call("a", "2026-09-20T10:00:00Z", "no_answer"),
      { contact_id: "a", activity_type: ASSIGN_TYPE, title: "🤝", occurred_at: "2026-09-10T10:00:00Z", created_by: "Ивайло", metadata: { to_team: true, kind: "given", reason: "не вдига" } },
    ];
    const s = summarizeAttempts(rows);
    expect(s.get("a")).toMatchObject({ escalated: true, given: null, count: 1 });
    const split = splitTeamDue([{ id: "a", next_followup_at: "2026-09-22T07:00:00Z" }], s, "2026-09-22T20:59:59Z");
    expect(split.retry).toHaveLength(0);
    expect(split.waiting).toHaveLength(0);
  });

  it("екипът звънва след връщането → пак е при екипа", () => {
    const rows: AttemptRow[] = [
      call("a", "2026-09-23T10:00:00Z", "no_answer"),
      { contact_id: "a", activity_type: "escalated", title: "⏫", occurred_at: "2026-09-22T04:00:00Z", created_by: "система", metadata: { escalated: true } },
    ];
    expect(summarizeAttempts(rows).get("a")).toMatchObject({ escalated: false, count: 1, team: true });
  });

  it("съобщение за срещата не е опит и не сваля маркера „не се яви“", () => {
    const rows: AttemptRow[] = [
      { contact_id: "a", activity_type: "viber_sent", title: "💜", occurred_at: "2026-09-22T09:00:00Z", created_by: "Димитър", metadata: { ...member, booking_msg: true, kind: "noshow", booking_id: "b1" } },
      { contact_id: "a", activity_type: ASSIGN_TYPE, title: "🙈", occurred_at: "2026-09-22T08:00:00Z", created_by: "система", metadata: { to_team: true, kind: "noshow", reason: "не се яви", missed_at: "2026-09-21T09:00:00Z", missed_booking_id: "b1" } },
    ];
    const s = summarizeAttempts(rows).get("a");
    expect(s).toMatchObject({ count: 0, given: { kind: "noshow", missed_at: "2026-09-21T09:00:00Z", missed_booking_id: "b1" } });
  });

  it("„говорихме без среща“ държи картата в „чакат обратно обаждане“", () => {
    const s = summarizeAttempts([call("a", "2026-09-22T09:00:00Z", "talked")]);
    const split = splitTeamDue([{ id: "a", next_followup_at: "2026-09-25T07:00:00Z" }], s, "2026-09-22T20:59:59Z");
    expect(split.waiting.map((c) => c.id)).toEqual(["a"]);
  });

  it("„иска той да се обади“ държи картата в „чакат обратно обаждане“ и не е „не вдигна“", () => {
    const s = summarizeAttempts([call("a", "2026-09-25T09:00:00Z", "will_call")]);
    expect(s.get("a")).toMatchObject({ noAnswer: 0 });
    const split = splitTeamDue([{ id: "a", next_followup_at: "2026-09-29T07:00:00Z" }], s, "2026-09-25T20:59:59Z");
    expect(split.waiting.map((c) => c.id)).toEqual(["a"]);
  });
});

describe("колко пъти не е вдигнал и кога може да се спре", () => {
  it("брои бутона на екипа и старите записи на Ивайло по заглавието", () => {
    const rows: AttemptRow[] = [
      row("a", "2026-09-23T09:00:00Z", { ...member, outcome: "no_answer" }, "Не вдигна · пак на ср 23.09"),
      row("a", "2026-09-20T09:00:00Z", {}, "Звъннах · не вдига"),
      row("a", "2026-09-18T09:00:00Z", { ...member, outcome: "talked" }, "Говорихме · без среща · не вдига телефона вечер"),
      row("a", "2026-09-17T09:00:00Z", { ...member, outcome: "no_answer" }, "Не вдигна"),
    ];
    expect(summarizeAttempts(rows).get("a")).toMatchObject({ count: 4, noAnswer: 3 });
  });

  it("isNoAnswer: изходът бие заглавието", () => {
    expect(isNoAnswer({ title: "каквото и да е", metadata: { outcome: "no_answer" } })).toBe(true);
    expect(isNoAnswer({ title: "Не вдига · спираме", metadata: { outcome: "give_up" } })).toBe(true);
    expect(isNoAnswer({ title: "не вдига сутрин", metadata: { outcome: "callback" } })).toBe(false);
    expect(isNoAnswer({ title: "Звъннах · Не вдигна", metadata: null })).toBe(true);
    expect(isNoAnswer({ title: "Звъннах · говорихме", metadata: {} })).toBe(false);
  });

  it("спира се от третото обаждане нататък", () => {
    expect(GIVE_UP_AFTER_NO_ANSWERS).toBe(2);
    expect(canGiveUp(undefined)).toBe(false);
    expect(canGiveUp(1)).toBe(false);
    expect(canGiveUp(2)).toBe(true);
    expect(canGiveUp(5)).toBe(true);
  });
});

describe("бележките по картон", () => {
  const n = (contact_id: string, occurred_at: string, body: string | null, title = "Бележка от Димитър") => ({
    contact_id,
    title,
    body,
    occurred_at,
    created_by: "Димитър",
  });

  it("най-новата отгоре, най-много три на картон", () => {
    const m = notesByContact([
      n("a", "2026-09-24T15:09:00Z", "Бележка тест"),
      n("a", "2026-09-24T14:54:00Z", "Интересува се от гласов агент"),
      n("b", "2026-09-24T14:00:00Z", "друг картон"),
      n("a", "2026-09-20T10:00:00Z", "трета"),
      n("a", "2026-09-19T10:00:00Z", "четвърта — не влиза"),
    ]);
    expect(m.get("a")?.map((x) => x.body)).toEqual(["Бележка тест", "Интересува се от гласов агент", "трета"]);
    expect(m.get("b")).toHaveLength(1);
    expect(NOTES_ON_CARD).toBe(3);
  });

  it("бележка без текст носи заглавието си; съвсем празна не излиза", () => {
    const m = notesByContact([n("a", "2026-09-24T10:00:00Z", null, "Дейност: Салон"), n("a", "2026-09-24T09:00:00Z", "  ", "  ")]);
    expect(m.get("a")).toEqual([{ body: "Дейност: Салон", at: "2026-09-24T10:00:00Z", by: "Димитър" }]);
  });
});

describe("бележката от изхода на разговора стои на картата", () => {
  const exit = (
    contact_id: string,
    occurred_at: string,
    title: string,
    body: string | null,
    metadata: Record<string, unknown> = { team: true },
    activity_type = "call"
  ) => ({ contact_id, activity_type, title, body, occurred_at, created_by: "Димитър", metadata });

  it("„Говорихме, чуване пак“ с написан текст излиза като бележка — с изхода до нея", () => {
    // Истинският случай: бележката е в тялото на обаждането, а картата я нямаше.
    const m = notesByContact([
      exit("a", "2026-09-30T11:05:00Z", "Говорихме · чуване пак на чт 02.10, 10:00", "Иска оферта за сайт, ще говори със съдружника."),
    ]);
    expect(m.get("a")).toEqual([
      {
        body: "Иска оферта за сайт, ще говори със съдружника.",
        at: "2026-09-30T11:05:00Z",
        by: "Димитър",
        context: "Говорихме · чуване пак на чт 02.10, 10:00",
      },
    ]);
  });

  it("редовете, които изходът сам добавя („Дейност:“, „Линк:“), не са бележка", () => {
    expect(noteText(exit("a", "t", "Говорихме · без среща", "Дейност: Салон за красота\nЩе мисли до петък."))).toBe("Ще мисли до петък.");
    expect(noteText(exit("a", "t", "Среща", "Дейност: Салон\nЛинк: https://meet.google.com/x\nИска реклами.", { team: true }, "meeting"))).toBe("Иска реклами.");
    // изход без написана бележка — само „Дейност:“ — не е бележка
    expect(noteText(exit("a", "t", "Говорихме · без среща", "Дейност: Салон"))).toBeNull();
    expect(noteText(exit("a", "t", "Не вдигна", null))).toBeNull();
  });

  it("написаното в полето (metadata.note) има предимство пред тялото", () => {
    expect(noteText(exit("a", "t", "Не се интересува", "Дейност: Х\nстар текст", { team: true, note: "  точно това написа  " }))).toBe("точно това написа");
  });

  it("„Само бележка“ и бележките от изходите — заедно, най-новата отгоре", () => {
    const m = notesByContact([
      exit("a", "2026-09-30T12:00:00Z", "Не вдигна · пак на чт 02.10, 10:00", "гласова поща"),
      { contact_id: "a", activity_type: "note", title: "Бележка от Димитър", body: "Предпочита Viber", occurred_at: "2026-09-29T09:00:00Z", created_by: "Димитър", metadata: null },
      exit("a", "2026-09-28T09:00:00Z", "Говорихме · без среща", "Дейност: Салон"),
    ]);
    expect(m.get("a")?.map((x) => [x.body, x.context ?? null])).toEqual([
      ["гласова поща", "Не вдигна · пак на чт 02.10, 10:00"],
      ["Предпочита Viber", null],
    ]);
  });
});

describe("пак остави данни (relead)", () => {
  it("видът се чете от маркера; непознатият е „given“ като старите маркери на Ивайло", () => {
    expect(givenKindOf("relead")).toBe("relead");
    expect(givenKindOf("cancelled")).toBe("cancelled");
    expect(givenKindOf(undefined)).toBe("given");
    expect(givenKindOf("каквото")).toBe("given");
  });

  it("маркерът стои, докато екипът не звънне след него; после картата тръгва по обичайния път", () => {
    const relead = (at: string): AttemptRow => ({
      contact_id: "r",
      activity_type: ASSIGN_TYPE,
      title: "🔁 Пак остави данни · Димитър да звънне",
      occurred_at: at,
      created_by: "meta_webhook",
      metadata: { kind: "relead", reason: "🔁 Пак остави данни · 📘 Наръчник", to_member_id: "m1", to_name: "Димитър" },
    });
    const before = summarizeAttempts(desc([relead("2026-10-07T12:38:00Z"), row("r", "2026-09-26T09:00:00Z", { ...member, outcome: "not_interested" })]));
    expect(before.get("r")?.given).toMatchObject({ kind: "relead", to_id: "m1", reason: "🔁 Пак остави данни · 📘 Наръчник" });

    const after = summarizeAttempts(
      desc([
        row("r", "2026-10-07T13:00:00Z", { ...member, outcome: "no_answer" }, "Не вдигна"),
        relead("2026-10-07T12:38:00Z"),
      ])
    );
    expect(after.get("r")?.given).toBeNull();
    expect(after.get("r")?.last?.outcome).toBe("no_answer");
  });
});
