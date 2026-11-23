import { describe, expect, it } from "vitest";
import { izvadiImena, sluchaen } from "./tombola";

describe("izvadiImena", () => {
  it("взема списък по едно име на ред и маха повторенията", () => {
    expect(izvadiImena("Мария Иванова\n  Петър  \nмария иванова\n\nГеорги; Стела")).toEqual([
      "Мария Иванова",
      "Петър",
      "Георги",
      "Стела",
    ]);
  });

  it("вади имената от запазения чат на Zoom (нов и стар формат)", () => {
    const chat = [
      "19:45:12 From Мария Иванова to Everyone:",
      "\tИСКАМ",
      "19:45:20 From Petar Petrov (Guest) to Everyone:",
      "\tискам!",
      "19:46:01 From  Мария Иванова  to Everyone:",
      "\tоще веднъж",
      "19:47:03 From Ivan : ИСКАМ",
      "19:48:10 From Стела Ж. to Everyone: искам и аз",
      "19:48:30 From Me to Everyone:",
    ].join("\n");
    expect(izvadiImena(chat)).toEqual(["Мария Иванова", "Petar Petrov", "Ivan", "Стела Ж."]);
  });

  it("маха „(Host)“ и прекалено дългите редове", () => {
    expect(izvadiImena(`Ивайло Петев (Host)\n${"x".repeat(80)}`)).toEqual(["Ивайло Петев"]);
  });
});

describe("sluchaen", () => {
  it("връща число в [0, n) и прескача стойностите над границата", () => {
    const poredica = [0xffffffff, 7]; // първото е над границата за n = 3 → отхвърля се
    let i = 0;
    const rnd = (b: Uint32Array) => {
      b[0] = poredica[i++];
      return b;
    };
    expect(sluchaen(3, rnd)).toBe(7 % 3);
  });

  it("с истинския crypto всички резултати са в обхвата", () => {
    for (let k = 0; k < 200; k++) {
      const x = sluchaen(5);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(5);
    }
  });
});
