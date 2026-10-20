"use client";

// Двигателят на разговора: пази състоянието извън React (за да го вижда и
// плаващият прозорец), реже репликите, пита „мозъка“ и води превенцията.
import { useSyncExternalStore } from "react";
import { etapOt, prazno, prevenciiOt, razcheti } from "@/lib/suvetnik/razbor";
import { vazrazhenieOt } from "@/lib/suvetnik/biblioteka";
import type { Brif, EtapId, Govoreshht, Podskazka, Povod, Replika, SastoyanieRazgovor } from "@/lib/suvetnik/types";
import { eEho, ScribeLiniya, vzemiMikrofon, vzemiTab, zakachi, type ScribeStatus, type Tap } from "./zvuk";

export interface ZhivaPodskazka extends Podskazka {
  n: number;
  povod: Povod;
  at: number;
  gotova: boolean;
}

export interface Zhivo {
  faza: "brif" | "zhivo" | "kraj";
  rejim: "online" | "mikrofon";
  brif: Brif;
  kontaktId?: string;
  zapochna: number;
  replikI: Replika[];
  chernova: { I: string; K: string };
  podskazka: ZhivaPodskazka | null;
  istoria: ZhivaPodskazka[];
  sastoyanie: SastoyanieRazgovor;
  status: { I: ScribeStatus; K: ScribeStatus; mozak: "gotov" | "misli" | "greshka"; sabshtenie?: string };
  tishinaOt: number | null;
  nivo: { I: number; K: number };
}

const nachalno = (): Zhivo => ({
  faza: "brif",
  rejim: "online",
  brif: { obrashtenie: "ти" },
  zapochna: 0,
  replikI: [],
  chernova: { I: "", K: "" },
  podskazka: null,
  istoria: [],
  sastoyanie: { bolki: [], prevencia: {}, vazrazheniya: [], poslednoKazano: [] },
  status: { I: "izkl", K: "izkl", mozak: "gotov" },
  tishinaOt: null,
  nivo: { I: 0, K: 0 },
});

let s: Zhivo = nachalno();
const slushateli = new Set<() => void>();
function zadai(p: Partial<Zhivo> | ((x: Zhivo) => Partial<Zhivo>)) {
  s = { ...s, ...(typeof p === "function" ? p(s) : p) };
  slushateli.forEach((f) => f());
}
export const sklad = {
  get: () => s,
  subscribe(f: () => void) {
    slushateli.add(f);
    return () => {
      slushateli.delete(f);
    };
  },
};
export function useZhivo<T>(izbor: (x: Zhivo) => T): T {
  return useSyncExternalStore(sklad.subscribe, () => izbor(s), () => izbor(s));
}

// ───────────── репликите ─────────────

let brojach = 0;
function dobavi(govori: Govoreshht, tekst: string) {
  const r: Replika = { id: `r${++brojach}`, s: govori, t: tekst, at: Date.now() - s.zapochna };
  zadai((x) => ({ replikI: [...x.replikI, r] }));
  return r;
}

const TEZHKI = /БОЛКА|ПОСЛЕД|ЦЕЛ|ПРЕВЕНЦ|ИДЕНТИЧ|ЗАТВАР|ЦЕНА/i;

function naRepliceNaIvailo(t: string, proveriEho = true) {
  if (proveriEho) {
    // Ехото от тонколоните идва почти едновременно с репликата на клиента.
    const kl = s.replikI.filter((r) => r.s === "K" && Date.now() - s.zapochna - r.at < 3500).map((r) => r.t);
    if (s.chernova.K) kl.push(s.chernova.K);
    if (eEho(t, kl)) return;
  }
  dobavi("I", t);
  const p = s.podskazka;
  if (t.trim().endsWith("?") && (TEZHKI.test(p?.tehnika ?? "") || TEZHKI.test(p?.etap ?? "") || /МЪЛЧИ/.test(p?.ton ?? ""))) {
    zadai({ tishinaOt: Date.now() });
  }
}

let otlozheno: ReturnType<typeof setTimeout> | null = null;
function naRepliceNaKlienta(t: string, govori: Govoreshht) {
  dobavi(govori, t);
  zadai({ tishinaOt: null });
  const v = vazrazhenieOt(t);
  if (v && !s.sastoyanie.vazrazheniya.includes(v.ime)) {
    zadai((x) => ({ sastoyanie: { ...x.sastoyanie, vazrazheniya: [...x.sastoyanie.vazrazheniya, v.ime] } }));
  }
  if (t.split(/\s+/).length < 2) return;
  if (otlozheno) clearTimeout(otlozheno);
  otlozheno = setTimeout(() => void poiskai("klient"), 250);
}

// ───────────── мозъкът ─────────────

let vPolet: AbortController | null = null;
let chakashto: Povod | null = null;
let nPodskazka = 0;

export async function poiskai(povod: Povod) {
  if (s.faza !== "zhivo" && povod !== "demo") return;
  if (vPolet) {
    if (povod === "klient" || povod === "demo") {
      chakashto = povod;
      return;
    }
    vPolet.abort();
  }
  const ac = new AbortController();
  vPolet = ac;
  const n = ++nPodskazka;
  zadai((x) => ({ status: { ...x.status, mozak: "misli", sabshtenie: undefined } }));
  try {
    const r = await fetch("/api/suvetnik/hint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rejim: s.rejim,
        brif: s.brif,
        sastoyanie: s.sastoyanie,
        replikI: s.replikI.slice(-120),
        povod: povod === "demo" ? "klient" : povod,
      }),
      signal: ac.signal,
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || `Грешка ${r.status}`);
    }
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    let tekst = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      tekst += dec.decode(value, { stream: true });
      const p = razcheti(tekst);
      if (p.kazhi) zadai({ podskazka: { ...p, n, povod, at: Date.now(), gotova: false } });
    }
    const p = razcheti(tekst);
    if (p.greshka && !p.kazhi) throw new Error(p.greshka);
    const gotova: ZhivaPodskazka = { ...p, n, povod, at: Date.now(), gotova: true };
    zadai((x) => ({
      podskazka: gotova,
      istoria: [...x.istoria, gotova].slice(-300),
      sastoyanie: obnoviSastoyanie(x.sastoyanie, p),
      status: { ...x.status, mozak: p.greshka ? "greshka" : "gotov", sabshtenie: p.greshka },
    }));
  } catch (e) {
    if (!ac.signal.aborted) {
      zadai((x) => ({ status: { ...x.status, mozak: "greshka", sabshtenie: e instanceof Error ? e.message : "Мозъкът не отговори." } }));
    }
  } finally {
    if (vPolet === ac) vPolet = null;
    if (chakashto) {
      const sledvasht = chakashto;
      chakashto = null;
      void poiskai(sledvasht);
    }
  }
}

const dumi = (x: string) => new Set(x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter((w) => w.length > 2));
function blizki(a: string, b: string) {
  const A = dumi(a), B = dumi(b);
  if (!A.size || !B.size) return false;
  let o = 0;
  for (const w of A) if (B.has(w)) o++;
  return o / Math.min(A.size, B.size) >= 0.5;
}

/** Нова болка, близка до стара, я заменя (моделът я уточнява) — без повторения. */
function dobaviBolka(bolki: string[], nova?: string) {
  if (prazno(nova)) return bolki;
  const n = nova!.trim();
  const bez = bolki.filter((b) => !blizki(b, n));
  return [...bez, n].slice(-6);
}

/** Възражението се пише с името на веригата, ако я разпознаваме — така не се дублира. */
function imeVazrazhenie(t: string) {
  return vazrazhenieOt(t)?.ime ?? t.split("·")[0].trim();
}

function obnoviSastoyanie(st: SastoyanieRazgovor, p: Podskazka): SastoyanieRazgovor {
  const etap: EtapId | undefined = etapOt(p.etap) ?? (st.etap as EtapId | undefined);
  const bolki = dobaviBolka(st.bolki, p.bolka);
  const prevencia = { ...st.prevencia };
  for (const id of prevenciiOt(p.prevencia)) prevencia[id] = true;
  const ime = prazno(p.vazrazhenie) ? null : imeVazrazhenie(p.vazrazhenie!);
  const vazrazheniya = ime && !st.vazrazheniya.includes(ime) ? [...st.vazrazheniya, ime].slice(-12) : st.vazrazheniya;
  const poslednoKazano = p.kazhi ? [...st.poslednoKazano, p.kazhi].slice(-3) : st.poslednoKazano;
  return { etap, bolki, prevencia, vazrazheniya, poslednoKazano };
}

export function prevkluchiPrevencia(id: string) {
  zadai((x) => ({ sastoyanie: { ...x.sastoyanie, prevencia: { ...x.sastoyanie.prevencia, [id]: !x.sastoyanie.prevencia[id as keyof typeof x.sastoyanie.prevencia] } } }));
}

// ───────────── старт и стоп ─────────────

let ctx: AudioContext | null = null;
let tapove: Tap[] = [];
let linii: ScribeLiniya[] = [];
let potoci: MediaStream[] = [];
let nivoTaimer: ReturnType<typeof setInterval> | null = null;

async function token(): Promise<string> {
  const r = await fetch("/api/suvetnik/token?n=1", { cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { tokens?: string[]; error?: string };
  if (!r.ok || !j.tokens?.[0]) throw new Error(j.error || `Токенът не дойде (${r.status}).`);
  return j.tokens[0];
}

export function zadaiBrif(brif: Brif, kontaktId?: string) {
  zadai({ brif, kontaktId });
}

export async function zapochni(rejim: "online" | "mikrofon") {
  zadai({ ...nachalno(), brif: s.brif, kontaktId: s.kontaktId, rejim, faza: "zhivo", zapochna: Date.now() });
  try {
    const mic = await vzemiMikrofon();
    potoci.push(mic);
    let tab: MediaStream | null = null;
    if (rejim === "online") {
      tab = await vzemiTab();
      potoci.push(tab);
      tab.getAudioTracks()[0]?.addEventListener("ended", () =>
        zadai((x) => ({ status: { ...x.status, K: "prekasnato", sabshtenie: "Споделянето на таба спря — клиентът не се чува." } })),
      );
    }
    // честотата е на системата (обикновено 48 kHz) — процесорът сам я прави 16 kHz
    ctx = new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();

    const liniyaI = new ScribeLiniya(token, {
      chernova: (t) => zadai((x) => ({ chernova: { ...x.chernova, I: t } })),
      gotovo: (t) => (rejim === "online" ? naRepliceNaIvailo(t) : naRepliceBezRazdelyane(t)),
      status: (st, m) => zadai((x) => ({ status: { ...x.status, I: st, sabshtenie: m ?? x.status.sabshtenie } })),
    });
    linii.push(liniyaI);
    tapove.push(await zakachi(ctx, mic, (pcm) => liniyaI.prati(pcm)));
    void liniyaI.otvori();

    if (tab) {
      const liniyaK = new ScribeLiniya(token, {
        chernova: (t) => zadai((x) => ({ chernova: { ...x.chernova, K: t }, tishinaOt: t ? null : x.tishinaOt })),
        gotovo: (t) => naRepliceNaKlienta(t, "K"),
        status: (st, m) => zadai((x) => ({ status: { ...x.status, K: st, sabshtenie: m ?? x.status.sabshtenie } })),
      });
      linii.push(liniyaK);
      tapove.push(await zakachi(ctx, tab, (pcm) => liniyaK.prati(pcm)));
      void liniyaK.otvori();
    }
    nivoTaimer = setInterval(() => {
      zadai({ nivo: { I: tapove[0]?.nivo() ?? 0, K: tapove[1]?.nivo() ?? 0 } });
    }, 200);
    void poiskai("rachno");
  } catch (e) {
    spri();
    zadai({
      faza: "brif",
      status: { I: "izkl", K: "izkl", mozak: "greshka", sabshtenie: e instanceof Error ? e.message : "Не тръгна." },
    });
  }
}

/** Само микрофон (телефон на високоговорител или в стаята): въпрос = Ивайло, иначе клиентът. */
function naRepliceBezRazdelyane(t: string) {
  if (t.trim().endsWith("?")) naRepliceNaIvailo(t);
  else naRepliceNaKlienta(t, "?");
}

export function spri() {
  if (otlozheno) clearTimeout(otlozheno);
  if (nivoTaimer) clearInterval(nivoTaimer);
  nivoTaimer = null;
  vPolet?.abort();
  linii.forEach((l) => l.zatvori());
  tapove.forEach((t) => t.spri());
  potoci.forEach((p) => p.getTracks().forEach((t) => t.stop()));
  void ctx?.close();
  ctx = null;
  linii = [];
  tapove = [];
  potoci = [];
}

export function priklyuchi() {
  spri();
  zadai({ faza: "kraj" });
}

export function otnachalo() {
  spri();
  s = nachalno();
  slushateli.forEach((f) => f());
}

// ───────────── демо (без звук) ─────────────

export async function demo(dialog: Array<[Govoreshht, string]>, pauzaMs = 3500) {
  spri();
  zadai({ ...nachalno(), brif: s.brif, rejim: "online", faza: "zhivo", zapochna: Date.now() });
  for (const [govori, tekst] of dialog) {
    if (sklad.get().faza !== "zhivo") return;
    if (govori === "I") {
      naRepliceNaIvailo(tekst, false);
      await new Promise((r) => setTimeout(r, pauzaMs / 2));
      continue;
    }
    dobavi(govori, tekst);
    await poiskai("demo");
    await new Promise((r) => setTimeout(r, pauzaMs));
    const kazhi = sklad.get().podskazka?.kazhi;
    if (kazhi && !kazhi.startsWith("(") && sklad.get().faza === "zhivo") {
      naRepliceNaIvailo(kazhi, false);
      await new Promise((r) => setTimeout(r, pauzaMs / 2));
    }
  }
}
