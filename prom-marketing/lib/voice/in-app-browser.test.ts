import { describe, it, expect } from "vitest";
import { isInAppBrowser } from "./in-app-browser";

describe("вграденият браузър на социалните мрежи", () => {
  it("познава Facebook, Instagram и Messenger на iOS и Android", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.28.107;FBBV/...]"
      )
    ).toBe(true);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 14; SM-S911B Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.40.92 Android"
      )
    ).toBe(true);
    expect(isInAppBrowser("... [FB_IAB/FB4A;FBAV/460.0.0.35.115;]")).toBe(true);
  });

  it("пуска обикновените браузъри", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
    expect(
      isInAppBrowser("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
    ).toBe(false);
    expect(isInAppBrowser("")).toBe(false);
    expect(isInAppBrowser(null)).toBe(false);
  });
});
