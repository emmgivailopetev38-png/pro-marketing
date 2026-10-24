import { describe, it, expect } from "vitest";
import { addDays, defaultDueDate, invoiceReminderKey, milestoneFor, overdueBucket, planInvoiceReminders, type InvoiceForReminder } from "./invoice-reminders-rules";

const now = new Date("2026-10-24T06:00:00Z");

function inv(p: Partial<InvoiceForReminder> & { id: string }): InvoiceForReminder {
  return {
    contact_id: "c1",
    client_name: "Тест",
    invoice_number: p.id,
    issue_date: "2026-10-01",
    due_date: "2026-10-08",
    amount_gross: 240,
    amount_net: 200,
    status: "sent",
    ...p,
  };
}

describe("падеж по подразбиране", () => {
  it("издаване + 7 дни; без издаване — днес + 7", () => {
    expect(defaultDueDate("2026-10-01", now)).toBe("2026-10-08");
    expect(defaultDueDate("2026-10-28", now)).toBe("2026-11-04");
    expect(defaultDueDate(null, now)).toBe("2026-10-31");
    expect(defaultDueDate("лоша дата", now)).toBe("2026-10-31");
    expect(addDays("2026-12-30", 7)).toBe("2027-01-06");
  });
});

describe("просрочени фактури", () => {
  it("праговете 3/7/14 и групите", () => {
    expect(milestoneFor(1)).toBe(null);
    expect(milestoneFor(3)).toBe(3);
    expect(milestoneFor(9)).toBe(7);
    expect(milestoneFor(40)).toBe(14);
    expect(overdueBucket(2)).toBe("1+");
    expect(overdueBucket(13)).toBe("7+");
    expect(overdueBucket(14)).toBe("14+");
  });

  it("брои дните, вади плащанията, пропуска платените и бъдещите", () => {
    const r = planInvoiceReminders(
      [
        inv({ id: "A", due_date: "2026-10-21" }), // 3 дни
        inv({ id: "B", due_date: "2026-10-10", status: "partially_paid", amount_gross: 500 }), // 14 дни, частично
        inv({ id: "C", due_date: "2026-10-10", amount_gross: 100 }), // платена изцяло → не
        inv({ id: "D", due_date: "2026-10-30" }), // бъдеща
        inv({ id: "E", due_date: "2026-10-01", status: "paid" }),
        inv({ id: "F", due_date: "2026-10-23" }), // 1 ден — в списъка, без праг
      ],
      [
        { invoice_id: "B", amount: 200 },
        { invoice_id: "B", amount: 50, match_status: "ignored" },
        { invoice_id: "C", amount: 100 },
      ],
      new Set(),
      now
    );
    expect(r.map((x) => x.invoice.id)).toEqual(["B", "A", "F"]);
    const b = r[0];
    expect(b.days_overdue).toBe(14);
    expect(b.remaining).toBe(300);
    expect(b.milestone).toBe(14);
    expect(b.note_due).toBe(true);
    expect(b.dedupe_key).toBe(invoiceReminderKey("B", 14));
    expect(r[1].milestone).toBe(3);
    expect(r[2].milestone).toBe(null);
    expect(r[2].note_due).toBe(false);
  });

  it("бележка за достигнатия праг само веднъж; без картон — без бележка", () => {
    const r = planInvoiceReminders(
      [inv({ id: "A", due_date: "2026-10-17" }), inv({ id: "B", due_date: "2026-10-17", contact_id: null })],
      [],
      new Set([invoiceReminderKey("A", 7)]),
      now
    );
    expect(r[0].days_overdue).toBe(7);
    expect(r.every((x) => !x.note_due)).toBe(true);
  });
});
