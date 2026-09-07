import { describe, it, expect } from "vitest";
import { describePayStatus, payStatusFromOffer } from "./pay-status";

describe("състоянието на линка за споразумението", () => {
  it("превежда статуса на офертата", () => {
    expect(payStatusFromOffer("accepted")).toBe("paid");
    expect(payStatusFromOffer("viewed")).toBe("opened");
    expect(payStatusFromOffer("sent")).toBe("sent");
    expect(payStatusFromOffer("draft")).toBe("manual");
    expect(payStatusFromOffer("rejected")).toBe("none");
    expect(payStatusFromOffer(null)).toBe("none");
  });

  it("говори на „ти“ и на „вие“ без да променя смисъла", () => {
    expect(describePayStatus("paid", true)).toContain("Плащането е потвърдено");
    expect(describePayStatus("paid", false)).toContain("ще ви задам");
    expect(describePayStatus("paid", true)).toContain("ще ти задам");
    expect(describePayStatus("none", false)).toContain("Да ви го изпратя ли");
  });
});
