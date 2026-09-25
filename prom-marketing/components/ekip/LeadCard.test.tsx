import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeadCard } from "./LeadCard";
import type { QueueLead } from "@/lib/team/types";

// Сървърното действие не се вика в тези тестове — гледаме само кои бутони
// има картата и че „Върна обаждане“ отваря панела със срещата.
vi.mock("@/app/ekip/actions", () => ({ ekipAction: vi.fn(async () => null) }));

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
