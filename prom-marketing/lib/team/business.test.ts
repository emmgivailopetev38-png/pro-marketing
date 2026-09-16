import { describe, it, expect } from "vitest";
import { joinBusiness } from "./business";

describe("дейността от картата", () => {
  it("опция плюс уточнение", () => {
    expect(joinBusiness("Услуги / кабинет / салон", " фризьорски салон в Русе ")).toBe(
      "Услуги / кабинет / салон · фризьорски салон в Русе"
    );
    expect(joinBusiness("Транспорт / логистика", "")).toBe("Транспорт / логистика");
  });
  it("„Друго“ носи само уточнението; празното е null", () => {
    expect(joinBusiness("Друго", "пчелар")).toBe("пчелар");
    expect(joinBusiness("Друго", "")).toBe("Друго");
    expect(joinBusiness("", "")).toBeNull();
    expect(joinBusiness("измислена опция", "нещо")).toBe("нещо");
  });
});
