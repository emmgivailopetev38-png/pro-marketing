import { describe, expect, it } from "vitest";
import { PROGRAM_PRICE_EUR, TEAM_PAY_LINKS, contactFromTeamRef, teamPayUrl } from "./team-links";

const ID = "f5ac054c-4c43-465b-b561-e94204306161";

describe("линковете за плащане на екипа", () => {
  it("сумите са точните проценти от 3 900 € и остатъкът допълва до цената", () => {
    for (const l of TEAM_PAY_LINKS) {
      expect(l.amountEur).toBe((PROGRAM_PRICE_EUR * Number(l.key)) / 100);
      expect(l.amountEur + l.restEur).toBe(PROGRAM_PRICE_EUR);
      expect(l.url).toMatch(/^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/);
    }
    expect(new Set(TEAM_PAY_LINKS.map((l) => l.url)).size).toBe(4);
  });

  it("линкът за човека носи имейла и картона му", () => {
    const u = new URL(teamPayUrl(TEAM_PAY_LINKS[0], { contactId: ID, email: " Ivan@Example.com " }));
    expect(u.searchParams.get("prefilled_email")).toBe("ivan@example.com");
    expect(u.searchParams.get("client_reference_id")).toBe(`ekip_${ID}`);
    expect(contactFromTeamRef(u.searchParams.get("client_reference_id"))).toBe(ID);
  });

  it("без имейл или с измисления „bez-imeil“ — линкът е чист", () => {
    expect(teamPayUrl(TEAM_PAY_LINKS[3], {})).toBe(TEAM_PAY_LINKS[3].url);
    expect(teamPayUrl(TEAM_PAY_LINKS[3], { email: "bez-imeil@promarketing.pw" })).toBe(TEAM_PAY_LINKS[3].url);
  });

  it("чужда референция не е картон на екипа", () => {
    expect(contactFromTeamRef("pl_abc123")).toBeNull();
    expect(contactFromTeamRef("ekip_не-е-uuid")).toBeNull();
    expect(contactFromTeamRef(null)).toBeNull();
  });
});
