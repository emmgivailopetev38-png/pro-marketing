import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { LeadCard, NOTE_DRAFT_PREFIX } from "./LeadCard";
import type { QueueLead } from "@/lib/team/types";

// Сървърното действие е подменено: гледаме кои бутони има картата и какво
// праща формата. По подразбиране отговаря null (нищо не се е случило).
const box = vi.hoisted(() => ({ sent: [] as FormData[], reply: null as unknown }));
vi.mock("@/app/ekip/actions", () => ({
  ekipAction: vi.fn(async (_prev: unknown, fd: FormData) => {
    box.sent.push(fd);
    return box.reply;
  }),
}));

const lead: QueueLead = {
  id: "f36bdb53",
  full_name: "Hristo Hristov",
  phone: "+359876888162",
  email: "hristov.b.hristo@gmail.com",
  company: null,
  business: null,
  source: "meta_lead",
  stage: "lead",
  followup_status: "needs_call",
  next_followup_at: "2026-09-17T07:00:00.000Z",
  created_at: "2026-09-14T20:01:46.000Z",
  notes: null,
  ad_name: "A · Видео обработка ПРЕДИ/СЛЕД",
  form_answers: [{ question: "С какво се занимава", answer: "Друго" }],
  attempts: 1,
  last_attempt: {
    title: "Не вдигна · пак на чт 17.09, 10:00",
    at: "2026-09-16T12:55:00.000Z",
    by: "Димитър",
    outcome: "no_answer",
    hidden: false,
    handoff: false,
  },
};

describe("картата, когато човекът може да върне обаждане", () => {
  it("отпред са „Върна обаждане“, „Пак не вдигна“ и „Скрий“", () => {
    render(<LeadCard lead={lead} mode="waiting" />);
    expect(screen.getByRole("button", { name: /Върна обаждане/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Пак не вдигна/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Скрий/ })).toBeInTheDocument();
    expect(screen.getByText(/пак чт/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Записах среща/ })).not.toBeInTheDocument();
  });

  it("„Върна обаждане“ отваря панела: среща, чуване пак, предаване на Ивайло, скрий", () => {
    render(<LeadCard lead={lead} mode="waiting" />);
    fireEvent.click(screen.getByRole("button", { name: /Върна обаждане/ }));
    expect(screen.getByRole("button", { name: /Записах среща/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Говорихме, чуване пак/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ивайло да му звънне/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Скрий/ })).toBeInTheDocument();
    expect(screen.getByText(/Последно: Не вдигна/)).toBeInTheDocument();
  });
});

describe("новата карта и намерената през търсачката", () => {
  it("новата започва с „Не вдигна“ и „Говорихме…“, без „Скрий“", () => {
    render(<LeadCard lead={{ ...lead, last_attempt: null, attempts: 0 }} mode="fresh" />);
    expect(screen.getByRole("button", { name: /^📵 Не вдигна$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Говорихме…/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Скрий/ })).not.toBeInTheDocument();
  });

  it("намерената показва етапа с думи и всички изходи след „Говорихме…“", () => {
    render(<LeadCard lead={{ ...lead, stage: "contacted" }} mode="search" />);
    expect(screen.getByText("говорено")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Говорихме…/ }));
    expect(screen.getByRole("button", { name: /Записах среща/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ивайло да му звънне/ })).toBeInTheDocument();
  });
});

describe("кога да звънна пак — направо от картата", () => {
  it("новата карта има избора, без да се отваря цялата форма", () => {
    render(<LeadCard lead={{ ...lead, last_attempt: null, attempts: 0 }} mode="fresh" />);
    const pick = screen.getByLabelText("Кога да звънна пак") as HTMLSelectElement;
    expect(pick).toBeInTheDocument();
    expect(pick.value).toBe("3h");
    expect(screen.getByRole("button", { name: /^📵 Не вдигна$/ })).toBeInTheDocument();
    // Старото „пак друг път…“, което отваряше целия панел, вече не е нужно.
    expect(screen.queryByRole("button", { name: /пак друг път/ })).not.toBeInTheDocument();
  });

  it("картата с „Пак не вдигна“ също го има", () => {
    render(<LeadCard lead={lead} mode="waiting" />);
    expect(screen.getByLabelText("Кога да звънна пак")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Пак не вдигна/ })).toBeInTheDocument();
  });

  it("„точен час“ отваря поле за датата, което се праща с формата", () => {
    render(<LeadCard lead={{ ...lead, last_attempt: null }} mode="fresh" />);
    const pick = screen.getByLabelText("Кога да звънна пак");
    expect(screen.queryByLabelText("Точен час за повторното звънене")).not.toBeInTheDocument();
    fireEvent.change(pick, { target: { value: "custom" } });
    const exact = screen.getByLabelText("Точен час за повторното звънене");
    expect(exact).toHaveAttribute("name", "retry_at_custom");
  });
});

describe("бележките стоят на картата", () => {
  it("„Само бележка“ се вижда след опресняване — с автора и часа", () => {
    const notes = [
      { body: "Интересува се от гласов агент, но не иска среща все още.", at: "2026-09-24T14:54:59.000Z", by: "Димитър" },
      { body: "Каза, че ще върне обаждане", at: "2026-09-23T10:00:00.000Z", by: "Ивайло" },
    ];
    render(<LeadCard lead={{ ...lead, team_notes: notes }} mode="waiting" />);
    const list = screen.getByRole("list", { name: "Бележки" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText(/Интересува се от гласов агент/)).toBeInTheDocument();
    expect(screen.getByText(/^Димитър ·/)).toBeInTheDocument();
  });

  it("без бележки няма празен списък", () => {
    render(<LeadCard lead={{ ...lead, team_notes: [] }} mode="fresh" />);
    expect(screen.queryByRole("list", { name: "Бележки" })).not.toBeInTheDocument();
  });
});

describe("„Спираме да звъним“ за хората, които не вдигат", () => {
  it("след един „не вдигна“ бутонът го няма", () => {
    render(<LeadCard lead={{ ...lead, no_answers: 1 }} mode="waiting" />);
    expect(screen.queryByRole("button", { name: /Спираме да звъним/ })).not.toBeInTheDocument();
  });

  it("след два „не вдигна“ е до „Пак не вдигна“, с подсказка колко пъти", () => {
    render(<LeadCard lead={{ ...lead, no_answers: 2, attempts: 2 }} mode="retry" />);
    // При „за повторно“ формата е отворена — бутонът е в долния ред.
    expect(screen.getByRole("button", { name: /Спираме да звъним/ })).toBeInTheDocument();
    render(<LeadCard lead={{ ...lead, no_answers: 5, attempts: 5 }} mode="waiting" />);
    expect(screen.getAllByRole("button", { name: /Спираме да звъним/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Не вдигна 5 пъти/)).toBeInTheDocument();
    expect(screen.getByText(/5 × не вдигна/)).toBeInTheDocument();
  });

  it("затворен картон, намерен през търсачката, не го показва пак", () => {
    render(<LeadCard lead={{ ...lead, stage: "lost", no_answers: 4 }} mode="search" />);
    expect(screen.queryByRole("button", { name: /Спираме да звъним/ })).not.toBeInTheDocument();
  });
});

describe("бележката тръгва с всеки бутон и не се губи (01.10.2026)", () => {
  beforeEach(() => {
    box.sent.length = 0;
    box.reply = null;
    window.localStorage.clear();
  });

  const field = (re: RegExp) => screen.getByLabelText(re) as HTMLTextAreaElement;

  it("и затворената карта има поле за бележка — в същата форма като бутоните", () => {
    render(<LeadCard lead={{ ...lead, id: "n-closed", last_attempt: null, attempts: 0 }} mode="fresh" />);
    const note = field(/Бележка — тръгва с бутона/);
    expect(note).toHaveAttribute("name", "note");
    expect(note.closest("form")).toBe(screen.getByRole("button", { name: /^📵 Не вдигна$/ }).closest("form"));
  });

  it("написаното тръгва с „Говорихме, чуване пак“, а не само със „Само бележка“", async () => {
    box.reply = { ok: true, message: "Записано." };
    const id = "n-callback";
    render(<LeadCard lead={{ ...lead, id }} mode="waiting" />);
    fireEvent.change(field(/Бележка — тръгва с бутона/), { target: { value: "Иска оферта за сайт" } });
    fireEvent.click(screen.getByRole("button", { name: /Върна обаждане/ }));
    // отворената форма пази написаното на затворената карта
    expect(field(/Какво каза/).value).toBe("Иска оферта за сайт");
    fireEvent.click(screen.getByRole("button", { name: /Говорихме, чуване пак/ }));
    await waitFor(() => expect(box.sent).toHaveLength(1));
    expect(box.sent[0].get("action")).toBe("callback");
    expect(box.sent[0].get("note")).toBe("Иска оферта за сайт");
    // записано — черновата на устройството се чисти
    await waitFor(() => expect(window.localStorage.getItem(NOTE_DRAFT_PREFIX + id)).toBeNull());
  });

  it("„Не вдигна“ от затворената карта също носи бележката", async () => {
    box.reply = { ok: true, message: "Отбелязано." };
    render(<LeadCard lead={{ ...lead, id: "n-noanswer", last_attempt: null, attempts: 0 }} mode="fresh" />);
    fireEvent.change(field(/Бележка — тръгва с бутона/), { target: { value: "гласова поща" } });
    fireEvent.click(screen.getByRole("button", { name: /^📵 Не вдигна$/ }));
    await waitFor(() => expect(box.sent).toHaveLength(1));
    expect(box.sent[0].get("action")).toBe("no_answer");
    expect(box.sent[0].get("note")).toBe("гласова поща");
  });

  it("черновата се пази, докато се пише, и се връща, когато картата излезе пак", () => {
    const id = "n-draft";
    const first = render(<LeadCard lead={{ ...lead, id }} mode="fresh" />);
    fireEvent.change(field(/Бележка — тръгва с бутона/), { target: { value: "каза да звъня след 18 ч" } });
    expect(window.localStorage.getItem(NOTE_DRAFT_PREFIX + id)).toBe("каза да звъня след 18 ч");
    expect(screen.getByText(/Черновата се пази/)).toBeInTheDocument();
    first.unmount();
    render(<LeadCard lead={{ ...lead, id }} mode="fresh" />);
    expect(field(/Бележка — тръгва с бутона/).value).toBe("каза да звъня след 18 ч");
  });

  it("при грешка бележката остава — не се пише наново", async () => {
    box.reply = { ok: false, error: "Часът се застъпва с друга среща." };
    const id = "n-error";
    render(<LeadCard lead={{ ...lead, id }} mode="retry" />);
    fireEvent.change(field(/Какво каза/), { target: { value: "иска среща в четвъртък" } });
    fireEvent.click(screen.getByRole("button", { name: /Записах среща/ }));
    await waitFor(() => expect(screen.getByText("Часът се застъпва с друга среща.")).toBeInTheDocument());
    expect(field(/Какво каза/).value).toBe("иска среща в четвъртък");
    expect(window.localStorage.getItem(NOTE_DRAFT_PREFIX + id)).toBe("иска среща в четвъртък");
  });

  it("бележката от изхода излиза най-отгоре на картата — с изхода до нея", () => {
    const notes = [
      { body: "Иска оферта за сайт", at: "2026-09-30T11:05:00.000Z", by: "Димитър", context: "Говорихме · чуване пак на чт 02.10, 10:00" },
    ];
    render(<LeadCard lead={{ ...lead, id: "n-top", team_notes: notes }} mode="waiting" />);
    const list = screen.getByRole("list", { name: "Бележки" });
    expect(within(list).getByText(/Иска оферта за сайт/)).toBeInTheDocument();
    expect(within(list).getByText(/Говорихме · чуване пак на чт 02.10/)).toBeInTheDocument();
    // над отговорите от формата — първото нещо под телефона
    const answers = screen.getByText("С какво се занимава");
    expect(list.compareDocumentPosition(answers) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("какво е поискал и с какво започва разговорът", () => {
  const fresh: QueueLead = {
    ...lead,
    last_attempt: null,
    attempts: 0,
    ad_name: "Корица · AI наръчник · 2026-10-07",
    offer_key: "narachnik",
    offer_label: "📘 Наръчник",
  };

  it("новата карта показва значката и първото изречение с името на човека, който звъни", () => {
    render(<LeadCard lead={fresh} mode="fresh" setterName="Димитър" />);
    expect(screen.getByText("📘 Наръчник")).toBeInTheDocument();
    expect(screen.getByText(/Започни така/)).toBeInTheDocument();
    expect(
      screen.getByText(/Здравейте, Димитър съм от Pro Marketing — обаждам се за AI наръчника, който изтеглихте\. Успяхте ли да го разгледате\?/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Корица · AI наръчник/)).toBeInTheDocument();
  });

  it("при отказана среща изречението за наръчника не излиза — поводът е срещата", () => {
    render(<LeadCard lead={{ ...fresh, given_reason: "Отказа срещата" }} mode="cancelled" />);
    expect(screen.getByText("📘 Наръчник")).toBeInTheDocument();
    expect(screen.queryByText(/Започни така/)).not.toBeInTheDocument();
  });

  it("пак оставил данни: картата казва защо е пак тук и кога е новата заявка", () => {
    render(
      <LeadCard
        lead={{
          ...fresh,
          created_at: "2026-09-26T09:00:00.000Z",
          relead_at: "2026-10-07T12:38:00.000Z",
          given_reason: "🔁 Пак остави данни · 📘 Наръчник — звънни като на нов лийд.",
        }}
        mode="fresh"
      />
    );
    expect(screen.getByText(/🔁 Пак остави данни · 📘 Наръчник/)).toBeInTheDocument();
    expect(screen.getByText(/картонът е от 26\.09\.2026/)).toBeInTheDocument();
  });

  it("без оферта — без значка и без изречение (както преди)", () => {
    render(<LeadCard lead={{ ...fresh, offer_key: null, offer_label: null }} mode="fresh" />);
    expect(screen.queryByText(/Започни така/)).not.toBeInTheDocument();
  });
});
