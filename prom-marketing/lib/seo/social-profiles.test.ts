import { describe, expect, it } from "vitest";
import { organizationSchema, personSchema } from "./schema";
import { ORG, SOCIAL_PROFILES } from "./site";

const HOST = {
  youtube: "www.youtube.com",
  instagram: "www.instagram.com",
  tiktok: "www.tiktok.com",
  facebook: "www.facebook.com",
} as const;

describe("социалните профили на Ивайло", () => {
  it("са четири, в реда на плочките: YouTube, Instagram, TikTok, Facebook", () => {
    expect(SOCIAL_PROFILES.map((p) => p.key)).toEqual(["youtube", "instagram", "tiktok", "facebook"]);
  });

  it("всеки е https адрес на собствената си мрежа и няма повторения", () => {
    for (const p of SOCIAL_PROFILES) {
      const url = new URL(p.href);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe(HOST[p.key]);
    }
    expect(new Set(SOCIAL_PROFILES.map((p) => p.href)).size).toBe(SOCIAL_PROFILES.length);
  });

  it("Facebook е с id на страницата, а не с име, което се сменя", () => {
    const fb = SOCIAL_PROFILES.find((p) => p.key === "facebook");
    expect(fb?.href).toBe("https://www.facebook.com/profile.php?id=106080979260944");
  });

  it("всички влизат в sameAs — и на фирмата, и на човека", () => {
    const urls = SOCIAL_PROFILES.map((p) => p.href);
    expect(ORG.sameAs).toEqual(urls);
    expect(ORG.founder.sameAs).toEqual(urls);
    expect(organizationSchema().sameAs).toEqual(urls);
    expect(personSchema().sameAs).toEqual(urls);
  });
});
