import { describe, expect, it } from "vitest";
import { checkboxValue, isChecked } from "./form-data";

function form(pairs: Array<[string, string]>): FormData {
  const fd = new FormData();
  for (const [k, v] of pairs) fd.append(k, v);
  return fd;
}

describe("отметките в server action формите", () => {
  it("скрито „0“ + отметнато „1“ е отметнато — FormData.get би върнал „0“", () => {
    const fd = form([["active", "0"], ["active", "1"]]);
    expect(fd.get("active")).toBe("0");
    expect(checkboxValue(fd, "active")).toBe("1");
    expect(isChecked(fd, "active")).toBe(true);
  });

  it("само скритото „0“ е изрично махната отметка", () => {
    const fd = form([["active", "0"]]);
    expect(checkboxValue(fd, "active")).toBe("0");
    expect(isChecked(fd, "active")).toBe(false);
  });

  it("отметка без скрито поле работи и в двете състояния", () => {
    expect(isChecked(form([["client_visible", "1"]]), "client_visible")).toBe(true);
    expect(isChecked(form([]), "client_visible")).toBe(false);
  });

  it("липсващото поле е null, не „0“ — за „по ролята“", () => {
    expect(checkboxValue(form([["other", "1"]]), "active")).toBeNull();
  });

  it("редът на полетата не е важен", () => {
    expect(checkboxValue(form([["active", "1"], ["active", "0"]]), "active")).toBe("1");
  });
});
