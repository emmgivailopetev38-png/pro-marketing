"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ETAPI, PREVENCII, type Brif, type Obobshtenie } from "@/lib/suvetnik/types";
import { ETAP_VAPROSI, VAZRAZHENIYA, type Veriga } from "@/lib/suvetnik/biblioteka";
import { etapOt, tonInfo } from "@/lib/suvetnik/razbor";
import { BOI, Karta, MikBaner, Tishina } from "./Karta";
import { DEMO, DEMO_BRIF } from "./demo";
import { imaPip, otvoriPip, usePipOtvoren } from "./pip";
import {
  demo, otnachalo, poiskai, prevkluchiPrevencia, priklyuchi, sklad, useZhivo, zadaiBrif, zapochni,
} from "./dvigatel";

const btn = "rounded-xl px-4 py-2.5 font-semibold transition-colors disabled:opacity-40";
/** Най-честите възражения — винаги на екрана; останалите са под „още“. */
const CHESTI = ["pomislya", "pari", "partnyor", "vreme", "chasti", "sravnenie", "momenta", "imeil", "izmama"];

export function SuvetnikApp() {
  const faza = useZhivo((x) => x.faza);
  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6">
      {faza === "brif" && <BrifEkran />}
      {faza === "zhivo" && <ZhivEkran />}
      {faza === "kraj" && <KrajEkran />}
      <p className="mt-8 text-center text-xs text-[var(--color-text-tertiary)]">🌐 petevai.com · promarketing.pw</p>
    </div>
  );
}

// ───────────────────────── БРИФ ─────────────────────────

interface Kontakt { id: string; ime: string; firma: string; telefon: string; etap: string; belezhki: string }

function useKontakti(q: string) {
  const [items, setItems] = useState<Kontakt[]>([]);
  const kratko = q.trim().length < 2;
  useEffect(() => {
    if (kratko) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/suvetnik/kontakti?q=${encodeURIComponent(q.trim())}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((j: { items?: Kontakt[] }) => setItems(j.items ?? []))
        .catch(() => undefined);
    }, 250);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q, kratko]);
  return kratko ? [] : items;
}

function BrifEkran() {
  const greshka = useZhivo((x) => (x.status.mozak === "greshka" ? x.status.sabshtenie : undefined));
  const [brif, setBrif] = useState<Brif>(() => sklad.get().brif);
  const [kontakt, setKontakt] = useState<Kontakt | null>(null);
  const [tarsene, setTarsene] = useState("");
  const [oshte, setOshte] = useState(false);
  const kontakti = useKontakti(kontakt ? "" : tarsene);

  function izberi(k: Kontakt) {
    setKontakt(k);
    setBrif((b) => ({ ...b, klient: k.ime, biznes: b.biznes || k.firma, belezhki: b.belezhki || k.belezhki }));
  }

  function start(kak: "online" | "mikrofon" | "demo") {
    if (kak === "demo") {
      zadaiBrif({ ...DEMO_BRIF, obrashtenie: "ти" });
      void demo(DEMO);
      return;
    }
    zadaiBrif(brif, kontakt?.id);
    // Изборът на таба и прозорчето над срещата искат свеж клик — и двете тръгват от този.
    void zapochni(kak);
    if (kak === "online" && imaPip()) otvoriPip().catch(() => undefined);
  }

  const pole = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-cyan-400/60";
  const vtori = `${btn} border border-white/15 bg-white/5 text-sm text-[var(--color-text-primary)] hover:bg-white/10`;
  return (
    <div className="mx-auto grid max-w-2xl gap-5 pt-2">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">🎧 Съветникът на живо</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Слуша разговора и ти казва какво да кажеш и с какъв тон — по метода на Георги.</p>
      </header>

      <div className="relative">
        <input
          className={pole}
          placeholder="С кого говориш? (по желание — търси в CRM-а)"
          value={kontakt ? `${kontakt.ime}${kontakt.firma ? ` · ${kontakt.firma}` : ""}` : tarsene}
          onChange={(e) => {
            setKontakt(null);
            setTarsene(e.target.value);
            setBrif((b) => ({ ...b, klient: e.target.value }));
          }}
        />
        {!kontakt && kontakti.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0b1220] shadow-xl">
            {kontakti.map((k) => (
              <button key={k.id} type="button" onClick={() => izberi(k)} className="block w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10">
                {k.ime} {k.firma && <span className="text-white/50">· {k.firma}</span>} {k.telefon && <span className="text-white/40">· {k.telefon}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => start("online")}
        className="rounded-2xl bg-cyan-500 px-6 py-5 text-center text-black shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400"
      >
        <span className="block text-2xl font-bold">▶ Старт</span>
        <span className="mt-1 block text-sm font-medium text-black/70">Избери таба на срещата → „Сподели“. Прозорчето над срещата излиза само.</span>
      </button>

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => start("mikrofon")} className={vtori}>📞 Телефон / на живо — само микрофон</button>
        <button type="button" onClick={() => setOshte(!oshte)} className={vtori}>📝 Бриф {oshte ? "▴" : "▾"}</button>
        <button type="button" onClick={() => start("demo")} className={vtori}>🎬 Демо</button>
      </div>

      {oshte && (
        <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input className={pole} placeholder="Бизнесът му" value={brif.biznes ?? ""} onChange={(e) => setBrif({ ...brif, biznes: e.target.value })} />
            <input className={pole} placeholder="Какво иска (от анкетата/рекламата)" value={brif.cel ?? ""} onChange={(e) => setBrif({ ...brif, cel: e.target.value })} />
            <input className={pole} placeholder="Офертата и цената (само ако вече ги имаш)" value={brif.oferta ?? ""} onChange={(e) => setBrif({ ...brif, oferta: e.target.value })} />
            <select className={pole} value={brif.obrashtenie ?? "ти"} onChange={(e) => setBrif({ ...brif, obrashtenie: e.target.value as "ти" | "Вие" })}>
              <option value="ти">Обръщение: „ти“</option>
              <option value="Вие">Обръщение: „Вие“</option>
            </select>
          </div>
          <textarea className={`${pole} min-h-20`} placeholder="Бележки — каквото знаеш за него" value={brif.belezhki ?? ""} onChange={(e) => setBrif({ ...brif, belezhki: e.target.value })} />
        </section>
      )}

      {greshka && <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-amber-100">⚠️ {greshka}</p>}
      <p className="text-center text-xs text-[var(--color-text-tertiary)]">🎧 Със слушалки е най-точно. Не избереш ли таб — слушам само микрофона.</p>
    </div>
  );
}

// ───────────────────────── НА ЖИВО ─────────────────────────

function Taimer() {
  const zapochna = useZhivo((x) => x.zapochna);
  const [sega, setSega] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSega(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sek = Math.max(0, Math.floor((sega - zapochna) / 1000));
  return <span className="font-mono text-lg text-[var(--color-text-primary)]">{String(Math.floor(sek / 60)).padStart(2, "0")}:{String(sek % 60).padStart(2, "0")}</span>;
}

const STATUS_IME: Record<string, string> = { izkl: "изкл.", svarzva: "свързва…", slusha: "слуша", prekasnato: "прекъсна", greshka: "грешка", nechuva: "не те чува" };

function Lampa({ ime, st, nivo }: { ime: string; st: string; nivo: number }) {
  const cvyat = st === "slusha" ? "bg-emerald-400" : st === "svarzva" ? "bg-amber-400" : st === "izkl" ? "bg-slate-500" : "bg-red-500";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/80">
      <span className={`h-2 w-2 rounded-full ${cvyat}`} />
      {ime}: {STATUS_IME[st] ?? st}
      <span className="h-1.5 w-10 overflow-hidden rounded bg-white/10">
        <span className="block h-full bg-emerald-400/80" style={{ width: `${Math.min(100, Math.round(nivo * 160))}%` }} />
      </span>
    </span>
  );
}

function ZhivEkran() {
  const rejim = useZhivo((x) => x.rejim);
  const status = useZhivo((x) => x.status);
  const nivo = useZhivo((x) => x.nivo);
  const mik = useZhivo((x) => x.zvuk.mik);
  const p = useZhivo((x) => x.podskazka);
  const tishinaOt = useZhivo((x) => x.tishinaOt);
  const sastoyanie = useZhivo((x) => x.sastoyanie);
  const [veriga, setVeriga] = useState<{ v: Veriga; stapka: number } | null>(null);
  const [pipGreshka, setPipGreshka] = useState("");
  const [vsichki, setVsichki] = useState(false);
  const pipOtvoren = usePipOtvoren();

  useEffect(() => {
    function klavish(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        void poiskai("rachno");
      } else if (e.code === "KeyP" && imaPip()) {
        otvoriPip().catch((err: unknown) => setPipGreshka(err instanceof Error ? err.message : "Не се отвори."));
      } else if (/^Digit[1-9]$/.test(e.code) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const v = VAZRAZHENIYA.find((x) => x.id === CHESTI[Number(e.code.slice(5)) - 1]);
        if (v) {
          setVeriga({ v, stapka: 0 });
          void poiskai(`vazrazhenie:${v.id}`);
        }
      }
    }
    window.addEventListener("keydown", klavish);
    return () => window.removeEventListener("keydown", klavish);
  }, []);

  const tekushtEtap = etapOt(p?.etap) ?? sastoyanie.etap;

  function vazrazhenie(v: Veriga) {
    setVeriga({ v, stapka: 0 });
    void poiskai(`vazrazhenie:${v.id}`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Taimer />
        <Lampa ime="🎙 Ти" st={mik === "ok" ? status.I : "nechuva"} nivo={nivo.I} />
        {rejim === "online" && <Lampa ime="🔊 Клиентът" st={status.K} nivo={nivo.K} />}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-white/80">
          🧠 {status.mozak === "misli" ? "мисли…" : status.mozak === "greshka" ? "грешка" : "готов"}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => void poiskai("rachno")} className={`${btn} bg-cyan-500 text-black hover:bg-cyan-400`} title="Интервал">
            ⚡ Подскажи <span className="ml-1 text-xs font-normal opacity-70">[интервал]</span>
          </button>
          {imaPip() && (
            <button
              type="button"
              onClick={() => otvoriPip().catch((e: unknown) => setPipGreshka(e instanceof Error ? e.message : "Не се отвори."))}
              className={`${btn} border border-white/15 bg-white/5 text-[var(--color-text-primary)] hover:bg-white/10`}
            >
              🪟 Над срещата
            </button>
          )}
          <button type="button" onClick={() => priklyuchi()} className={`${btn} border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25`}>
            ⏹ Край
          </button>
        </div>
      </div>
      {(status.sabshtenie && status.mozak === "gotov") || pipGreshka ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">⚠️ {pipGreshka || status.sabshtenie}</p>
      ) : null}

      <MikBaner />

      {imaPip() && !pipOtvoren && (
        <button
          type="button"
          onClick={() => otvoriPip().catch((e: unknown) => setPipGreshka(e instanceof Error ? e.message : "Не се отвори."))}
          className="flex items-center gap-3 rounded-2xl border-2 border-cyan-400/70 bg-cyan-400/10 px-4 py-3 text-left text-cyan-100 hover:bg-cyan-400/20"
        >
          <span className="text-2xl">🪟</span>
          <span>
            <span className="block font-semibold">Отвори прозорчето над срещата</span>
            <span className="block text-sm text-cyan-100/70">Малко прозорче, което стои над Meet — какво да кажеш, тонът, въпросите. Или натисни P.</span>
          </span>
        </button>
      )}

      <ol className="flex flex-wrap gap-1.5">
        {ETAPI.map((e, i) => {
          const idx = ETAPI.findIndex((x) => x.id === tekushtEtap);
          const minal = idx >= 0 && i < idx;
          return (
            <li
              key={e.id}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${e.id === tekushtEtap ? "bg-cyan-400 text-black" : minal ? "bg-cyan-400/20 text-cyan-100" : "bg-white/5 text-white/45"}`}
            >
              {i + 1}. {e.ime}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-3">
          <Tishina ot={tishinaOt} />
          <Karta p={p} misli={status.mozak === "misli"} greshka={status.mozak === "greshka" ? status.sabshtenie : undefined} />
          {veriga && <VerigaPanel v={veriga.v} stapka={veriga.stapka} setStapka={(n) => setVeriga({ v: veriga.v, stapka: n })} zatvori={() => setVeriga(null)} />}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/45">Възражение! — веригата на Георги веднага</p>
            <div className="flex flex-wrap gap-1.5">
              {(vsichki ? VAZRAZHENIYA : VAZRAZHENIYA.filter((v) => CHESTI.includes(v.id))).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => vazrazhenie(v)}
                  className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-sm text-white/85 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                >
                  {CHESTI.includes(v.id) && <span className="mr-1 font-mono text-xs text-white/40">{CHESTI.indexOf(v.id) + 1}</span>}
                  {v.ime}
                </button>
              ))}
              <button type="button" onClick={() => setVsichki(!vsichki)} className="rounded-lg px-2.5 py-1.5 text-sm text-cyan-300 hover:bg-white/5">
                {vsichki ? "по-малко ▴" : `още ${VAZRAZHENIYA.length - CHESTI.length} ▾`}
              </button>
            </div>
          </div>
          <Transkript />
        </div>

        <aside className="grid content-start gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">🛡 Превенция — обери ги ПРЕДИ цената</p>
            <ul className="mt-2 grid gap-1">
              {PREVENCII.map((pr) => {
                const obrano = !!sastoyanie.prevencia[pr.id];
                return (
                  <li key={pr.id}>
                    <button
                      type="button"
                      onClick={() => prevkluchiPrevencia(pr.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${obrano ? "bg-emerald-400/15 text-emerald-100" : "text-white/70 hover:bg-white/5"}`}
                    >
                      <span>{obrano ? "✅" : "⬜"}</span> {pr.ikona} {pr.ime}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">💔 Болките — с неговите думи</p>
            {sastoyanie.bolki.length ? (
              <ul className="mt-2 grid gap-1 text-sm text-white/80">
                {sastoyanie.bolki.map((b) => <li key={b}>• {b}</li>)}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-white/45">Още няма — питай, смятай на глас.</p>
            )}
          </div>
          {sastoyanie.vazrazheniya.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">🧱 Възражения досега</p>
              <ul className="mt-2 grid gap-1 text-sm text-white/80">
                {sastoyanie.vazrazheniya.map((v) => <li key={v}>• {v}</li>)}
              </ul>
            </div>
          )}
          <EtapVaprosi etap={tekushtEtap ?? "SVARZVANE"} />
          <Istoria />
        </aside>
      </div>
    </div>
  );
}

function VerigaPanel({ v, stapka, setStapka, zatvori }: { v: Veriga; stapka: number; setStapka: (n: number) => void; zatvori: () => void }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
      <div className="flex items-start gap-2">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">🧱 „{v.ime}“ — веригата на Георги</p>
          <p className="text-sm text-white/60">{v.otdolu}</p>
        </div>
        <button type="button" onClick={zatvori} className="ml-auto rounded-lg px-2 py-1 text-white/60 hover:bg-white/10">✕</button>
      </div>
      <ol className="mt-3 grid gap-2">
        {v.hodove.map((h, i) => {
          const t = tonInfo(h.ton);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setStapka(i)}
                className={`w-full rounded-xl border px-3 py-2 text-left ${i === stapka ? `${BOI[t.cvyat]} border-2` : "border-white/10 bg-white/5 text-white/70"}`}
              >
                <span className="text-xs font-semibold">{i + 1}. {t.emoji} {h.ton}{h.kak ? ` · ${h.kak}` : ""}</span>
                <span className={`mt-0.5 block ${i === stapka ? "text-lg text-white" : "text-sm"}`}>{h.kazhi}</span>
                {h.zashto && i === stapka && <span className="mt-0.5 block text-xs text-white/60">{h.zashto}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Transkript() {
  const replikI = useZhivo((x) => x.replikI);
  const chernova = useZhivo((x) => x.chernova);
  const kutiya = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // само кутията се скролва — страницата остава на подсказката
    const k = kutiya.current;
    if (k) k.scrollTop = k.scrollHeight;
  }, [replikI.length, chernova]);
  const posledni = replikI.slice(-14);
  return (
    <div ref={kutiya} className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-sm">
      {posledni.length === 0 && !chernova.I && !chernova.K && <p className="text-white/40">Транскриптът ще тече тук.</p>}
      {posledni.map((r) => (
        <p key={r.id} className={r.s === "I" ? "text-cyan-100/90" : "text-white/90"}>
          <span className="mr-1.5 font-semibold text-white/50">{r.s === "I" ? "Ти" : r.s === "K" ? "Той" : "?"}:</span>
          {r.t}
        </p>
      ))}
      {chernova.K && <p className="italic text-white/50"><span className="mr-1.5 font-semibold">Той:</span>{chernova.K}…</p>}
      {chernova.I && <p className="italic text-cyan-100/50"><span className="mr-1.5 font-semibold">Ти:</span>{chernova.I}…</p>}
    </div>
  );
}

function Istoria() {
  const istoria = useZhivo((x) => x.istoria);
  const posledni = istoria.slice(-5, -1).reverse();
  if (!posledni.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">🕘 Предишни подсказки</p>
      <ul className="mt-2 grid gap-1.5 text-xs text-white/60">
        {posledni.map((h) => (
          <li key={h.n}>{tonInfo(h.ton).emoji} {h.kazhi}</li>
        ))}
      </ul>
    </div>
  );
}

// ───────────────────────── КРАЙ ─────────────────────────

function KrajEkran() {
  const [zarezhda, setZarezhda] = useState(true);
  const [rez, setRez] = useState<{ id: string | null; obobshtenie: Obobshtenie | null; greshka: string | null } | null>(null);
  const [vid, setVid] = useState<"meeting" | "call">(() => (sklad.get().rejim === "online" ? "meeting" : "call"));
  const [sledvashto, setSledvashto] = useState("");
  const [belezhka, setBelezhka] = useState("");
  const [crm, setCrm] = useState<string>("");
  const [kontakt, setKontakt] = useState<{ id: string; ime: string } | null>(() => {
    const x = sklad.get();
    return x.kontaktId ? { id: x.kontaktId, ime: x.brif.klient ?? "" } : null;
  });
  const [tarsene, setTarsene] = useState("");
  const kontakti = useKontakti(kontakt ? "" : tarsene);
  const pratil = useRef(false);

  const telo = useMemo(() => {
    const x = sklad.get();
    return {
      zapochna: new Date(x.zapochna).toISOString(),
      rejim: x.rejim,
      brif: x.brif as Record<string, unknown>,
      sastoyanie: x.sastoyanie as unknown as Record<string, unknown>,
      replikI: x.replikI,
      podskazki: x.istoria.map((h) => ({ ...h })) as Record<string, unknown>[],
    };
  }, []);

  useEffect(() => {
    if (pratil.current) return;
    pratil.current = true;
    fetch("/api/suvetnik/kraj", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...telo, obobshti: true }) })
      .then((r) => r.json())
      .then((j: { id: string | null; obobshtenie: Obobshtenie | null; greshka: string | null; error?: string }) => {
        setRez({ id: j.id, obobshtenie: j.obobshtenie, greshka: j.greshka ?? j.error ?? null });
        if (j.obobshtenie?.crm_belezhka) setBelezhka(j.obobshtenie.crm_belezhka);
      })
      .catch(() => setRez({ id: null, obobshtenie: null, greshka: "Записът не мина — провери връзката." }))
      .finally(() => setZarezhda(false));
  }, [telo]);

  async function zapishiCrm() {
    if (!kontakt) return;
    setCrm("записва…");
    const r = await fetch("/api/suvetnik/kraj", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...telo, sesia: rez?.id ?? undefined, obobshti: false, crm: { kontakt_id: kontakt.id, vid, sledvashto: sledvashto || undefined, belezhka } }),
    }).then((x) => x.json()).catch(() => null) as { crm?: { activity_id: string | null; error: string | null } } | null;
    setCrm(r?.crm?.activity_id ? `✅ Записано в картона на ${kontakt.ime}` : `⚠️ Не се записа: ${r?.crm?.error ?? "грешка"}`);
  }

  const o = rez?.obobshtenie;
  const pole = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[var(--color-text-primary)] outline-none focus:border-cyan-400/60";
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">🏁 Разборът — по трите въпроса на Георги</h1>
      {zarezhda && <p className="animate-pulse text-[var(--color-text-secondary)]">Георги гледа записа…</p>}
      {rez?.greshka && <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-amber-100">⚠️ {rez.greshka}</p>}
      {o && (
        <div className="grid gap-3 md:grid-cols-2">
          <Blok zaglavie="Какво стана">{o.rezyume}</Blok>
          <Blok zaglavie="Следваща стъпка">{o.sledvashta_stapka} · <b>{o.data_chas}</b></Blok>
          <Blok zaglavie="💔 Болките му">{o.bolki?.map((b) => <p key={b}>• {b}</p>)}</Blok>
          <Blok zaglavie="🧱 Възраженията">{o.vazrazheniya?.map((v) => <p key={v.tip}>{v.obrano ? "✅" : "❌"} {v.tip} — {v.kak}</p>)}</Blok>
          <Blok zaglavie="🛡 Пропусната превенция">{o.prevencia_propusnata?.length ? o.prevencia_propusnata.map((x) => <p key={x}>• {x}</p>) : "Всичко обрано."}</Blok>
          <Blok zaglavie="🎯 Самоанализ">
            <p>По-бързо до проблема? {o.samoanaliz?.po_barzo_do_problema}</p>
            <p>Задълбаване? {o.samoanaliz?.zadalbochavane}</p>
            <p>Предотвратяване на възражението? {o.samoanaliz?.predotvratyavane}</p>
          </Blok>
          <Blok zaglavie="💪 Силно">{o.silni?.map((x) => <p key={x}>• {x}</p>)}</Blok>
          <Blok zaglavie="🏋️ За тренировка">{o.za_trenirovka?.map((x) => <p key={x}>• {x}</p>)}</Blok>
        </div>
      )}

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="font-semibold text-[var(--color-text-primary)]">📇 Запис в CRM-а</p>
        <div className="relative">
          <input
            className={pole}
            placeholder="Картонът на клиента — търси по име, фирма или телефон"
            value={kontakt ? kontakt.ime : tarsene}
            onChange={(e) => {
              setKontakt(null);
              setTarsene(e.target.value);
            }}
          />
          {!kontakt && kontakti.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0b1220] shadow-xl">
              {kontakti.map((k) => (
                <button key={k.id} type="button" onClick={() => setKontakt({ id: k.id, ime: k.ime })} className="block w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10">
                  {k.ime} {k.firma && <span className="text-white/50">· {k.firma}</span>} {k.telefon && <span className="text-white/40">· {k.telefon}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select className={pole} value={vid} onChange={(e) => setVid(e.target.value as "meeting" | "call")}>
            <option value="meeting">Среща</option>
            <option value="call">Разговор по телефона</option>
          </select>
          <label className="grid gap-1 text-xs text-white/60">
            Следващо чуване (влиза в картона като follow-up)
            <input type="datetime-local" className={pole} value={sledvashto} onChange={(e) => setSledvashto(e.target.value)} />
          </label>
        </div>
        <textarea className={`${pole} min-h-28`} value={belezhka} onChange={(e) => setBelezhka(e.target.value)} placeholder="Бележката за картона" />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={!kontakt || zarezhda || crm === "записва…"} onClick={() => void zapishiCrm()} className={`${btn} bg-cyan-500 text-black hover:bg-cyan-400`}>
            Запиши в CRM
          </button>
          {crm && <span className="text-sm text-white/80">{crm}</span>}
          <button type="button" onClick={() => otnachalo()} className={`${btn} ml-auto border border-white/15 bg-white/5 text-[var(--color-text-primary)] hover:bg-white/10`}>
            ↺ Нов разговор
          </button>
        </div>
      </section>
    </div>
  );
}

function Blok({ zaglavie, children }: { zaglavie: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
      <p className="mb-1.5 font-semibold text-[var(--color-text-primary)]">{zaglavie}</p>
      {children}
    </div>
  );
}

function EtapVaprosi({ etap }: { etap: string }) {
  const [otvoreno, setOtvoreno] = useState(true);
  const vaprosi = ETAP_VAPROSI[etap] ?? [];
  const ime = ETAPI.find((e) => e.id === etap)?.ime ?? etap;
  if (!vaprosi.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <button type="button" onClick={() => setOtvoreno(!otvoreno)} className="flex w-full items-center text-left text-sm font-semibold text-[var(--color-text-primary)]">
        📋 Въпросите за „{ime}“ <span className="ml-auto text-white/40">{otvoreno ? "▴" : "▾"}</span>
      </button>
      {otvoreno && (
        <ul className="mt-2 grid gap-1.5 text-xs text-white/75">
          {vaprosi.map((v) => <li key={v}>• {v}</li>)}
        </ul>
      )}
    </div>
  );
}
