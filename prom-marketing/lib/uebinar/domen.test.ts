import { describe, expect, it } from "vitest";
import {
  GLAVEN_ORIGIN,
  UEBINAR_ORIGIN,
  UEBINAR_PIXEL_ID,
  isUebinarHost,
  podaraciRewrite,
  uebinarHostAction,
} from "./domen";

describe("ivailopetev.com — домейнът на уебинара", () => {
  it("разпознава домейна с и без www, с порт и с главни букви", () => {
    expect(isUebinarHost("ivailopetev.com")).toBe(true);
    expect(isUebinarHost("www.ivailopetev.com")).toBe(true);
    expect(isUebinarHost("IvailoPetev.com:443")).toBe(true);
    expect(isUebinarHost("promarketing.pw")).toBe(false);
    expect(isUebinarHost("evil-ivailopetev.com")).toBe(false);
    expect(isUebinarHost(null)).toBe(false);
  });

  it("началната страница показва лендинга и пази UTM и fbclid", () => {
    expect(uebinarHostAction("ivailopetev.com", "/")).toEqual({ kind: "rewrite", to: "/na-zhivo" });
    expect(uebinarHostAction("ivailopetev.com", "/", "?utm_source=fb&fbclid=abc")).toEqual({
      kind: "rewrite",
      to: "/na-zhivo?utm_source=fb&fbclid=abc",
    });
  });

  it("/na-zhivo на новия домейн отива на чистия адрес", () => {
    expect(uebinarHostAction("ivailopetev.com", "/na-zhivo", "?a=1")).toEqual({
      kind: "redirect",
      to: `${UEBINAR_ORIGIN}/?a=1`,
      status: 307,
    });
  });

  it("www отива на домейна без www", () => {
    expect(uebinarHostAction("www.ivailopetev.com", "/", "?x=1")).toEqual({
      kind: "redirect",
      to: `${UEBINAR_ORIGIN}/?x=1`,
      status: 308,
    });
  });

  it("формата и файловете на Next минават, останалите страници са на основния сайт", () => {
    expect(uebinarHostAction("ivailopetev.com", "/api/uebinar/register")).toEqual({ kind: "next" });
    expect(uebinarHostAction("ivailopetev.com", "/_next/data/x.json")).toEqual({ kind: "next" });
    // иконите и манифестът на уебинара остават на домейна (не отиват на promarketing.pw)
    expect(uebinarHostAction("ivailopetev.com", "/ivailo/manifest.webmanifest")).toEqual({ kind: "next" });
    expect(uebinarHostAction("ivailopetev.com", "/ivailo/ikona.ico")).toEqual({ kind: "next" });
    // кратките линкове: /viber → Viber канала; /vlez → страницата за влизане на Notifier
    expect(uebinarHostAction("ivailopetev.com", "/viber")).toMatchObject({ kind: "redirect", status: 307 });
    expect((uebinarHostAction("ivailopetev.com", "/viber") as { to: string }).to).toContain("invite.viber.com");
    expect(uebinarHostAction("ivailopetev.com", "/vlez")).toEqual({ kind: "redirect", to: "https://notifierbg.com/bg/join/xzwxpbyr", status: 307 });
    expect(uebinarHostAction("ivailopetev.com", "/admin")).toEqual({
      kind: "redirect",
      to: `${GLAVEN_ORIGIN}/admin`,
      status: 307,
    });
    expect(uebinarHostAction("ivailopetev.com", "/privacy", "?q=1")).toEqual({
      kind: "redirect",
      to: `${GLAVEN_ORIGIN}/privacy?q=1`,
      status: 307,
    });
  });

  it("подаръците са на ivailopetev.com/podaraci (вътре — /na-zhivo/podaraci)", () => {
    expect(uebinarHostAction("ivailopetev.com", "/podaraci")).toEqual({ kind: "rewrite", to: "/na-zhivo/podaraci" });
    expect(uebinarHostAction("ivailopetev.com", "/podaraci/", "?utm_source=zoom")).toEqual({
      kind: "rewrite",
      to: "/na-zhivo/podaraci?utm_source=zoom",
    });
    expect(uebinarHostAction("ivailopetev.com", "/podaraci/test")).toEqual({ kind: "rewrite", to: "/na-zhivo/podaraci/test" });
    expect(uebinarHostAction("ivailopetev.com", "/na-zhivo/podaraci/ceni", "?a=1")).toEqual({
      kind: "redirect",
      to: `${UEBINAR_ORIGIN}/podaraci/ceni?a=1`,
      status: 307,
    });
    expect(uebinarHostAction("ivailopetev.com", "/na-zhivo/podaraci")).toEqual({
      kind: "redirect",
      to: `${UEBINAR_ORIGIN}/podaraci`,
      status: 307,
    });
    // Само точният път — /podaracix не е подарък.
    expect(uebinarHostAction("ivailopetev.com", "/podaracix")).toEqual({
      kind: "redirect",
      to: `${GLAVEN_ORIGIN}/podaracix`,
      status: 307,
    });
  });

  it("на другите адреси /podaraci… също води до подаръците", () => {
    expect(podaraciRewrite("/podaraci")).toBe("/na-zhivo/podaraci");
    expect(podaraciRewrite("/podaraci/danaci", "?x=1")).toBe("/na-zhivo/podaraci/danaci?x=1");
    expect(podaraciRewrite("/")).toBeNull();
    expect(podaraciRewrite("/na-zhivo/podaraci")).toBeNull();
    expect(podaraciRewrite("/podaracix")).toBeNull();
  });

  it("пикселът на уебинара е само цифри (влиза в скрипт на страницата)", () => {
    expect(UEBINAR_PIXEL_ID).toMatch(/^\d{15,17}$/);
  });
});
