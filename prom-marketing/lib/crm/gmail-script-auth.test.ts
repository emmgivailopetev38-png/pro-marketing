import { describe, it, expect } from "vitest";
import { tokenInfoOk } from "./gmail-script-auth";

const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);
const good = {
  iss: "https://accounts.google.com",
  aud: "123-abc.apps.googleusercontent.com",
  email: "EmmgIvailoPetev38@gmail.com",
  email_verified: "true",
  exp: String(NOW / 1000 + 600),
};

describe("tokenInfoOk — OpenID токенът на Gmail скрипта", () => {
  it("пуска токен на собственика, издаден от Google, неизтекъл", () => {
    expect(tokenInfoOk(good, "emmgivailopetev38@gmail.com", NOW)).toBe(true);
  });

  it("не пуска чужд имейл, непотвърден имейл, изтекъл токен, чужд издател", () => {
    const owner = "emmgivailopetev38@gmail.com";
    expect(tokenInfoOk({ ...good, email: "drug@gmail.com" }, owner, NOW)).toBe(false);
    expect(tokenInfoOk({ ...good, email_verified: "false" }, owner, NOW)).toBe(false);
    expect(tokenInfoOk({ ...good, exp: String(NOW / 1000 - 1) }, owner, NOW)).toBe(false);
    expect(tokenInfoOk({ ...good, iss: "https://evil.example" }, owner, NOW)).toBe(false);
    expect(tokenInfoOk({ ...good, aud: undefined }, owner, NOW)).toBe(false);
  });
});
