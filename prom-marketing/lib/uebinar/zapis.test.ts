import { describe, expect, it } from "vitest";
import { VIBER_KANAL } from "@/lib/seo/site";
import { eBot, eVgradenBrauzar, nevalidenTelefon, prochetiZapisan, viberDeepLink, zapisGreshka, zapisanKlyuch, zapisanStoinost } from "./zapis";

describe("записването за уебинара — правилата на формата", () => {
  it("помни записания само с малкото име и часа", () => {
    const raw = zapisanStoinost("  Иван Петров ", 1_700_000_000_000);
    expect(JSON.parse(raw)).toEqual({ ime: "Иван", ts: 1_700_000_000_000 });
    expect(prochetiZapisan(raw)).toEqual({ ime: "Иван", ts: 1_700_000_000_000 });
    expect(zapisanKlyuch("pokazhi-ne-prodavai")).toBe("pm_uebinar_zapisan:pokazhi-ne-prodavai");
  });

  it("счупен или празен запис в браузъра → все едно не е записан", () => {
    expect(prochetiZapisan(null)).toBeNull();
    expect(prochetiZapisan("")).toBeNull();
    expect(prochetiZapisan("{не е json")).toBeNull();
    expect(prochetiZapisan(JSON.stringify({ ime: "Иван" }))).toBeNull();
    expect(prochetiZapisan(JSON.stringify({ ime: "Иван", ts: "вчера" }))).toBeNull();
    expect(prochetiZapisan(JSON.stringify({ ime: 5, ts: 10 }))).toEqual({ ime: "", ts: 10 });
  });

  it("директният линк за приложението е като на страницата на Viber", () => {
    expect(viberDeepLink(VIBER_KANAL)).toBe(
      "viber://community_invite?data=AQAqzZ05GRKnLVdWtuxQm%2FpaRecgu2KbzUByCyptRY7b8fkm5KfWqkJNJ%2Fldl9ts",
    );
    // „+“ в кода на поканата остава „+“ (кодиран), не става интервал.
    expect(viberDeepLink("https://invite.viber.com/?g2=AB+C%2Fd")).toBe("viber://community_invite?data=AB%2BC%2Fd");
    expect(viberDeepLink("https://invite.viber.com/?x=1&g2=abc&y=2")).toBe("viber://community_invite?data=abc");
    expect(viberDeepLink("https://ivailopetev.com/viber")).toBeNull();
    expect(viberDeepLink("https://invite.viber.com/")).toBeNull();
    expect(viberDeepLink(null)).toBeNull();
  });

  it("познава вградените браузъри на Facebook и Instagram", () => {
    expect(eVgradenBrauzar("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/488.0]")).toBe(true);
    expect(eVgradenBrauzar("Mozilla/5.0 (Linux; Android 14; SM-A546B; wv) Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/488.0;]")).toBe(true);
    expect(eVgradenBrauzar("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Mobile/15E148 Instagram 356.0")).toBe(true);
    expect(eVgradenBrauzar("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.1 Mobile/15E148 Safari/604.1")).toBe(false);
    expect(eVgradenBrauzar("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36")).toBe(false);
    expect(eVgradenBrauzar(null)).toBe(false);
  });

  it("ботовете са ботове, а телефон CUBOT е човек", () => {
    expect(eBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(eBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
    expect(eBot("AdsBot-Google (+http://www.google.com/adsbot.html)")).toBe(true);
    expect(eBot("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/130.0.0.0 Safari/537.36")).toBe(true);
    expect(eBot("Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)")).toBe(true);
    expect(eBot("my-crawler/1.0")).toBe(true);
    // Истински хора:
    expect(eBot("Mozilla/5.0 (Linux; Android 13; CUBOT NOTE 30 Build/TP1A.220624.014; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/488.0;]")).toBe(false);
    expect(eBot("Mozilla/5.0 (Linux; Android 12; CUBOT_X50) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36")).toBe(false);
    expect(eBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/488.0]")).toBe(false);
    expect(eBot("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36")).toBe(false);
    expect(eBot(null)).toBe(false);
  });

  it("отказът на Notifier заради номера се познава (и само той)", () => {
    const otkaz =
      '400: {"defined":false,"code":"BAD_REQUEST","status":400,"message":"Input validation failed","data":{"issues":[{"code":"custom","path":["phone"],"message":"Invalid recipient phone number"}]}}';
    expect(nevalidenTelefon(otkaz)).toBe(true);
    expect(nevalidenTelefon('400: {"message":"Input validation failed","data":{"issues":[{"path":["email"],"message":"Invalid email"}]}}')).toBe(false);
    expect(nevalidenTelefon("500: Internal Server Error")).toBe(false);
    expect(nevalidenTelefon("429: Too many requests for phone")).toBe(false);
    expect(nevalidenTelefon("The operation was aborted due to timeout")).toBe(false);
    expect(nevalidenTelefon(undefined)).toBe(false);
  });

  it("грешката казва на човека какво да поправи", () => {
    expect(zapisGreshka(400, "Invalid phone")).toMatch(/телефона/);
    expect(zapisGreshka(400, "Invalid input")).toMatch(/името, телефона и имейла/);
    expect(zapisGreshka(429, null)).toMatch(/минута/);
    expect(zapisGreshka(500, "Could not create contact")).toMatch(/интернета/);
    expect(zapisGreshka(null, null)).toMatch(/интернета/);
  });
});
