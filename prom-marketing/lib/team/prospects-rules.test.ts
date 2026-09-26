import { describe, expect, it } from "vitest";
import {
  MAX_NO_ANSWER,
  cityPriorities,
  mapHeaders,
  normalizeCity,
  parseCsv,
  phoneDisplay,
  phoneKey,
  prospectAfter,
  rowToProspect,
  splitProspectQueue,
  telHref,
  type Prospect,
} from "./prospects-rules";

function p(over: Partial<Prospect>): Prospect {
  return {
    id: "x", company: "Фирма", city: "София", area: null, phone: "0888123456", email: null, website: null,
    sector: null, opener: null, offer: null, gaps: null, email_subject: null, email_draft: null,
    decision_maker: null, buying_signal: null, score: null, tier: null, batch: "gotovi", priority: 1,
    assigned_to: "elena", status: "new", attempts: 0, no_answers: 0, last_called_at: null, next_call_at: null,
    last_note: null, contact_id: null, ...over,
  };
}

describe("телефонът като ключ", () => {
  it("всички записи на един номер дават един ключ", () => {
    for (const raw of ["0888 123 456", "+359 888 123 456", "00359888123456", "888-123-456", "(0888) 12-34-56"]) {
      expect(phoneKey(raw)).toBe("359888123456");
    }
  });
  it("стационарните: София 02 и градовете", () => {
    expect(phoneKey("02 987 65 43")).toBe("35929876543");
    expect(phoneKey("032 123 456")).toBe("35932123456");
  });
  it("два номера в едно поле → първият; боклук → null", () => {
    expect(phoneKey("0888 123 456, 02 111 2222")).toBe("359888123456");
    expect(phoneKey("123")).toBeNull();
    expect(phoneKey(null)).toBeNull();
  });
  it("линк за звънене и четим номер", () => {
    expect(telHref("0888123456")).toBe("tel:+359888123456");
    expect(phoneDisplay("0888123456")).toBe("+359 88 812 3456");
    expect(phoneDisplay("02 987 65 43")).toBe("+359 2 987 6543");
  });
});

describe("градът", () => {
  it("София във всичките ѝ записи", () => {
    for (const raw of ["София", "гр. София", "SOFIA", "Sofia", "София-град", "софия (Младост)"]) expect(normalizeCity(raw)).toBe("София");
  });
  it("латиница → кирилица; главни букви на думите", () => {
    expect(normalizeCity("Pravets")).toBe("Правец");
    expect(normalizeCity("велико търново")).toBe("Велико Търново");
    expect(normalizeCity("  ")).toBeNull();
  });
  it("София първа, после по брой фирми", () => {
    const pr = cityPriorities(["Бургас", "София", "Варна", "Бургас", "Асеновград", "Бургас", "Варна", null]);
    expect(pr.get("София")).toBe(1);
    expect(pr.get("Бургас")).toBe(10);
    expect(pr.get("Варна")).toBe(11);
    expect(pr.get("Асеновград")).toBe(12);
  });
});

describe("опашката на студените", () => {
  const now = new Date("2026-09-26T10:00:00Z");
  it("първо дошлите за повторно по час, после новите — София първа", () => {
    const q = splitProspectQueue(
      [
        p({ id: "burgas", city: "Бургас", priority: 10 }),
        p({ id: "sofia-b", company: "Бета", priority: 1 }),
        p({ id: "sofia-a", company: "Алфа", priority: 1 }),
        p({ id: "cb", status: "callback", next_call_at: "2026-09-26T09:00:00Z" }),
        p({ id: "na", status: "no_answer", next_call_at: "2026-09-26T08:00:00Z" }),
        p({ id: "later", status: "no_answer", next_call_at: "2026-09-27T07:00:00Z" }),
        p({ id: "no-phone", phone: null }),
        p({ id: "dead", status: "not_interested" }),
      ],
      now
    );
    expect(q.due.map((x) => x.id)).toEqual(["na", "cb"]);
    expect(q.fresh.map((x) => x.id)).toEqual(["sofia-a", "sofia-b", "burgas"]);
    expect(q.later).toBe(1);
  });
});

describe("изходът от обаждането", () => {
  const now = new Date("2026-09-26T10:00:00Z");
  const retryAt = new Date("2026-09-26T13:00:00Z");
  it("не вдигна → звъни пак в избрания час; на четвъртия път спира", () => {
    const a = prospectAfter({ attempts: 0, no_answers: 0, last_note: null }, "no_answer", { now, retryAt });
    expect(a).toMatchObject({ status: "no_answer", attempts: 1, no_answers: 1, next_call_at: retryAt.toISOString() });
    const last = prospectAfter({ attempts: 5, no_answers: MAX_NO_ANSWER - 1, last_note: null }, "no_answer", { now, retryAt });
    expect(last).toMatchObject({ status: "unreachable", no_answers: MAX_NO_ANSWER, next_call_at: null });
  });
  it("говорихме и среща → картон в CRM-а; отказите излизат от опашката", () => {
    expect(prospectAfter({ attempts: 1, no_answers: 1, last_note: null }, "meeting", { now }).status).toBe("converted");
    expect(prospectAfter({ attempts: 0, no_answers: 0, last_note: null }, "talked", { now }).status).toBe("converted");
    expect(prospectAfter({ attempts: 0, no_answers: 0, last_note: null }, "not_interested", { now, note: "има си човек" })).toMatchObject({
      status: "not_interested",
      next_call_at: null,
      last_note: "има си човек",
    });
    expect(prospectAfter({ attempts: 0, no_answers: 0, last_note: "стара" }, "bad_number", { now }).last_note).toBe("стара");
  });
});

describe("вкарването от таблиците", () => {
  it("познава колоните на пакета и не бърка тема с тема на имейла", () => {
    const headers = ["Фирма", "Град", "Телефон", "Имейл", "Сайт", "Бранш", "Готово начало на разговора", "Тема на имейла", "Черновик на имейл", "Статус"];
    const m = mapHeaders(headers);
    expect(m.company).toEqual([0]);
    expect(m.city).toEqual([1]);
    expect(m.opener).toEqual([6]);
    expect(m.email_subject).toEqual([7]);
    expect(m.email_draft).toEqual([8]);
  });
  it("английските имена и две колони с пропуски в едно поле", () => {
    const m = mapHeaders(["company_name", "city", "phone", "automation_gaps", "marketing_gaps", "decision_maker_name", "score"]);
    expect(m.company).toEqual([0]);
    expect(m.gaps).toEqual([3, 4]);
    expect(m.decision_maker).toEqual([5]);
    const row = rowToProspect(["Алфа ООД", "sofia", "0888123456", "няма CRM", "няма реклами", "Иван", "94"], m);
    expect(row).toMatchObject({ company: "Алфа ООД", city: "София", gaps: "няма CRM\nняма реклами", score: 94 });
  });
  it("проучените (03): общата оценка, трите идеи, проблемът, името с ролята — без подоценките", () => {
    const headers = [
      "business_name", "city", "business_phone", "decision_maker", "decision_maker_role", "personalized_opener",
      "likely_problem", "automation_idea_1", "automation_idea_2", "automation_idea_3", "recommended_first_offer",
      "need_score_30", "decision_maker_access_score_15", "digital_gap_score_10", "total_score_100", "tier",
    ];
    const m = mapHeaders(headers);
    expect(m.score).toEqual([14]);
    expect(m.decision_maker).toEqual([3, 4]);
    expect(m.offer).toEqual([7, 8, 9, 10]);
    expect(m.gaps).toEqual([6]);
    expect(m.opener).toEqual([5]);
    const row = rowToProspect(
      ["Алфа", "Sofia", "0888123456", "Мария Петрова", "управител", "Здравейте…", "губят запитвания", "чатбот", "CRM", "напомняния", "одит", "27", "12", "8", "94", "A"],
      m
    );
    expect(row).toMatchObject({ decision_maker: "Мария Петрова · управител", score: 94, offer: "чатбот\nCRM\nнапомняния\nодит", city: "София" });
  });

  it("CSV: кавички, запетая в клетката, нов ред в клетката, точка и запетая", () => {
    expect(parseCsv('﻿Фирма,Град\n"Алфа, ООД",София\r\n"Бета ""Про""","Нов\nред"\n')).toEqual([
      ["Фирма", "Град"],
      ["Алфа, ООД", "София"],
      ['Бета "Про"', "Нов\nред"],
    ]);
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("редът за базата", () => {
  it("чисти, нормализира и пази реда в допустимото", async () => {
    const { cleanImportRow, cleanBatch } = await import("./prospects-rules");
    const r = cleanImportRow(
      { company: "  Алфа ООД ", city: "гр. София", phone: "0888 123 456", email: "Office@Alfa.BG", score: "93.6", priority: 1, opener: "" },
      "Gotovi 2026-09-26"
    );
    expect(r).toMatchObject({
      company: "Алфа ООД",
      city: "София",
      phone_key: "359888123456",
      email: "office@alfa.bg",
      score: 94,
      priority: 1,
      opener: null,
      batch: "gotovi-2026-09-26",
    });
    expect(cleanImportRow({ company: "  ", phone: "0888123456" }, "x")).toBeNull();
    expect(cleanImportRow({ company: "Бета", email: "не-е-имейл", priority: -5 }, "x")).toMatchObject({ email: null, priority: 100, score: null });
    expect(cleanBatch("")).toBe("bez-paket");
  });
});
