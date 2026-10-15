import { describe, expect, it } from "vitest";
import { organizationSchema, personSchema } from "./schema";
import { ORG, PETEVAI, SOCIAL_PROFILES } from "./site";

const HOST = {
  youtube: "www.youtube.com",
  instagram: "www.instagram.com",
  tiktok: "www.tiktok.com",
  facebook: "www.facebook.com",
} as const;

const href = (key: string) => SOCIAL_PROFILES.find((p) => p.key === key)?.href;

describe("социалните профили на Ивайло", () => {
  it("са шест, в реда на плочките: YouTube, Instagram, TikTok, страницата, личният Facebook, групата", () => {
    expect(SOCIAL_PROFILES.map((p) => p.key)).toEqual([
      "youtube",
      "instagram",
      "tiktok",
      "facebook",
      "facebook-lichno",
      "ai-balgaria",
    ]);
  });

  it("всеки е https адрес на собствената си мрежа, с уникален ключ и без повторения", () => {
    for (const p of SOCIAL_PROFILES) {
      const url = new URL(p.href);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe(HOST[p.brand]);
    }
    expect(new Set(SOCIAL_PROFILES.map((p) => p.key)).size).toBe(SOCIAL_PROFILES.length);
    expect(new Set(SOCIAL_PROFILES.map((p) => p.href)).size).toBe(SOCIAL_PROFILES.length);
  });

  it("Facebook е по id, а не по име, което се сменя", () => {
    expect(href("facebook")).toBe("https://www.facebook.com/profile.php?id=106080979260944");
    expect(href("facebook-lichno")).toBe("https://www.facebook.com/profile.php?id=61557151023135");
  });

  it("sameAs: страницата и мрежите — на двамата, личният профил — само на човека, групата — на никого", () => {
    const zaDvamata = ["youtube", "instagram", "tiktok", "facebook"].map((k) => href(k));
    const naChoveka = [...zaDvamata, href("facebook-lichno")];
    expect(ORG.sameAs).toEqual(zaDvamata);
    expect(organizationSchema().sameAs).toEqual(zaDvamata);
    expect(ORG.founder.sameAs).toEqual(naChoveka);
    expect(personSchema().sameAs).toEqual(naChoveka);
    expect(personSchema().sameAs).not.toContain(href("ai-balgaria"));
  });

  it("Petev.ai е отделен продукт: връзка с https://petevai.com, но извън профилите и sameAs", () => {
    expect(PETEVAI.href).toBe("https://petevai.com");
    expect(SOCIAL_PROFILES.map((p) => p.href)).not.toContain(PETEVAI.href);
    expect(ORG.sameAs).not.toContain(PETEVAI.href);
    expect(ORG.founder.sameAs).not.toContain(PETEVAI.href);
    expect(organizationSchema().sameAs).not.toContain(PETEVAI.href);
    expect(personSchema().sameAs).not.toContain(PETEVAI.href);
  });
});
