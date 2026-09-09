import { describe, it, expect } from "vitest";
import {
  filledSocialLinks,
  normalizeSocialValue,
  parseSocialLinks,
  shortSocialLabel,
} from "./social";

describe("normalizeSocialValue", () => {
  it("прави адрес от гол хендъл според мрежата", () => {
    expect(normalizeSocialValue("instagram", "spi.milo.dete")).toBe(
      "https://www.instagram.com/spi.milo.dete/"
    );
    expect(normalizeSocialValue("tiktok", "@spi.milo.dete")).toBe(
      "https://www.tiktok.com/@spi.milo.dete"
    );
    expect(normalizeSocialValue("youtube", "@spimilodete")).toBe(
      "https://www.youtube.com/@spimilodete"
    );
  });

  it("не пипа готовия адрес", () => {
    const url = "https://www.facebook.com/profile.php?id=61555947197187";
    expect(normalizeSocialValue("facebook", url)).toBe(url);
  });

  it("допълва само протокола на адрес без него", () => {
    expect(normalizeSocialValue("website", "spimilodete.com")).toBe("https://spimilodete.com");
    expect(normalizeSocialValue("facebook", "facebook.com/spimilodete")).toBe(
      "https://facebook.com/spimilodete"
    );
  });

  it("сайт без хендъл шаблон не измисля адрес от една дума", () => {
    expect(normalizeSocialValue("website", "spimilodete")).toBeNull();
  });

  it("празното чисти мрежата", () => {
    expect(normalizeSocialValue("instagram", "")).toBeNull();
    expect(normalizeSocialValue("instagram", "   ")).toBeNull();
    expect(normalizeSocialValue("instagram", "@")).toBeNull();
    expect(normalizeSocialValue("instagram", null)).toBeNull();
    expect(normalizeSocialValue("instagram", 42)).toBeNull();
  });
});

describe("parseSocialLinks", () => {
  it("изхвърля непознатите ключове и празните стойности", () => {
    expect(
      parseSocialLinks({ instagram: "@spi.milo.dete", myspace: "нещо", tiktok: "" })
    ).toEqual({ instagram: "https://www.instagram.com/spi.milo.dete/" });
  });

  it("понася боклук вместо обект", () => {
    expect(parseSocialLinks(null)).toEqual({});
    expect(parseSocialLinks("низ")).toEqual({});
    expect(parseSocialLinks(["списък"])).toEqual({});
  });
});

describe("filledSocialLinks", () => {
  it("връща само попълнените, в реда на регистъра", () => {
    const out = filledSocialLinks({
      tiktok: "@spi.milo.dete",
      website: "spimilodete.com",
    });
    expect(out.map((r) => r.net.key)).toEqual(["website", "tiktok"]);
    expect(out[0].url).toBe("https://spimilodete.com");
  });
});

describe("shortSocialLabel", () => {
  it("маха протокола, www и опашката", () => {
    expect(shortSocialLabel("https://www.instagram.com/spi.milo.dete/")).toBe(
      "instagram.com/spi.milo.dete"
    );
  });
});
