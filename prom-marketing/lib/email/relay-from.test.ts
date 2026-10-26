import { describe, expect, it } from "vitest";
import { relayFromAddress } from "./relay-from";

describe("relayFromAddress", () => {
  it("sistema@ на домейна от EMAIL_FROM", () => {
    expect(relayFromAddress({ EMAIL_FROM: "ProMarketing <ivailo@promarketing.pw>" })).toBe("sistema@promarketing.pw");
    expect(relayFromAddress({ EMAIL_FROM: "ivailo@promarketing.pw" })).toBe("sistema@promarketing.pw");
  });
  it("EMAIL_RELAY_FROM_ADDRESS има предимство; без нищо → null", () => {
    expect(relayFromAddress({ EMAIL_FROM: "a@promarketing.pw", EMAIL_RELAY_FROM_ADDRESS: "ivo@promarketing.pw" })).toBe("ivo@promarketing.pw");
    expect(relayFromAddress({})).toBeNull();
    expect(relayFromAddress({ EMAIL_FROM: "счупено" })).toBeNull();
  });
});
