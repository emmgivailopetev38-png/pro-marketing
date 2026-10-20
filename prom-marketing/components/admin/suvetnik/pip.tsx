"use client";

// Плаващ прозорец (Document Picture-in-Picture, Chrome 116+): стои над Meet/Zoom,
// дори на цял екран. Отделен React корен, същият склад. В него е всичко, което
// Ивайло гледа по време на срещата: какво да каже и как, какво следва, въпросите
// за етапа, какво от превенцията липсва и последното, което каза клиентът.
import { useEffect, useState, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ETAPI, PREVENCII } from "@/lib/suvetnik/types";
import { ETAP_VAPROSI, VAZRAZHENIYA } from "@/lib/suvetnik/biblioteka";
import { etapOt } from "@/lib/suvetnik/razbor";
import { Karta, MikBaner, Tishina } from "./Karta";
import { poiskai, useZhivo } from "./dvigatel";

interface DocPip {
  requestWindow(o: { width: number; height: number }): Promise<Window>;
  window: Window | null;
}

export function imaPip() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}

function dpip() {
  return (window as unknown as { documentPictureInPicture?: DocPip }).documentPictureInPicture;
}

// дали прозорецът е отворен — за големия бутон на главния екран
let otvoren = false;
const slushateli = new Set<() => void>();
function zadaiOtvoren(v: boolean) {
  otvoren = v;
  slushateli.forEach((f) => f());
}
export function usePipOtvoren() {
  return useSyncExternalStore(
    (f) => {
      slushateli.add(f);
      return () => {
        slushateli.delete(f);
      };
    },
    () => otvoren,
    () => false,
  );
}

let koren: Root | null = null;

export async function otvoriPip() {
  const d = dpip();
  if (!d) throw new Error("Плаващият прозорец иска Chrome 116 или по-нов.");
  if (d.window) {
    d.window.focus();
    return;
  }
  const w = await d.requestWindow({ width: 520, height: 580 });
  for (const ss of Array.from(document.styleSheets)) {
    try {
      const css = Array.from(ss.cssRules).map((r) => r.cssText).join("\n");
      const st = w.document.createElement("style");
      st.textContent = css;
      w.document.head.appendChild(st);
    } catch {
      if (ss.href) {
        const l = w.document.createElement("link");
        l.rel = "stylesheet";
        l.href = ss.href;
        w.document.head.appendChild(l);
      }
    }
  }
  w.document.documentElement.className = document.documentElement.className;
  w.document.title = "Съветникът";
  w.document.body.style.margin = "0";
  w.document.body.style.background = "#070b12";
  const div = w.document.createElement("div");
  w.document.body.appendChild(div);
  koren = createRoot(div);
  koren.render(<PipIzgled prozorec={w} />);
  zadaiOtvoren(true);
  w.addEventListener("pagehide", () => {
    koren?.unmount();
    koren = null;
    zadaiOtvoren(false);
  });
}

const BARZI = ["pomislya", "pari", "partnyor", "vreme", "chasti", "sravnenie"] as const;
const KRATKO: Record<string, string> = {
  pomislya: "🤔 Ще помисля",
  pari: "💶 Скъпо",
  partnyor: "👥 Жена/съдружник",
  vreme: "⏳ Нямам време",
  chasti: "🧩 На части",
  sravnenie: "🔍 Сравнявам",
};

function Vreme({ ot }: { ot: number }) {
  const [sega, setSega] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSega(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((sega - ot) / 1000));
  return <span className="font-mono">{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</span>;
}

function PipIzgled({ prozorec }: { prozorec: Window }) {
  const p = useZhivo((x) => x.podskazka);
  const mozak = useZhivo((x) => x.status.mozak);
  const sabshtenie = useZhivo((x) => x.status.sabshtenie);
  const tishinaOt = useZhivo((x) => x.tishinaOt);
  const zapochna = useZhivo((x) => x.zapochna);
  const sastoyanie = useZhivo((x) => x.sastoyanie);
  const replikI = useZhivo((x) => x.replikI);
  const chernovaK = useZhivo((x) => x.chernova.K);
  const [vaprosi, setVaprosi] = useState(true);

  // клавишите работят и когато прозорчето е на фокус
  useEffect(() => {
    function klavish(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        void poiskai("rachno");
      } else if (/^Digit[1-6]$/.test(e.code)) {
        void poiskai(`vazrazhenie:${BARZI[Number(e.code.slice(5)) - 1]}`);
      }
    }
    prozorec.addEventListener("keydown", klavish);
    return () => prozorec.removeEventListener("keydown", klavish);
  }, [prozorec]);

  const etap = etapOt(p?.etap) ?? sastoyanie.etap ?? "SVARZVANE";
  const etapIdx = ETAPI.findIndex((e) => e.id === etap);
  const lipsva = PREVENCII.filter((x) => !sastoyanie.prevencia[x.id]);
  let poslednoK = chernovaK;
  if (!poslednoK) for (let i = replikI.length - 1; i >= 0; i--) if (replikI[i].s !== "I") { poslednoK = replikI[i].t; break; }

  return (
    <div className="flex min-h-screen flex-col gap-2 bg-[#070b12] p-2 font-sans text-white">
      <div className="flex items-center gap-2 text-xs text-white/70">
        <span className="rounded-full bg-cyan-400 px-2 py-0.5 font-semibold text-black">
          {etapIdx + 1}. {ETAPI[etapIdx]?.ime ?? "Свързване"}
        </span>
        {zapochna > 0 && <Vreme ot={zapochna} />}
        <span className="ml-auto">{mozak === "misli" ? "🧠 мисли…" : mozak === "greshka" ? "⚠️" : "🧠 готов"}</span>
      </div>

      <MikBaner kompaktna />
      <Tishina ot={tishinaOt} />
      <Karta p={p} misli={mozak === "misli"} greshka={mozak === "greshka" ? sabshtenie : undefined} kompaktna />

      {poslednoK && (
        <p className="line-clamp-2 rounded-lg bg-white/5 px-2 py-1 text-xs text-white/70">
          <span className="font-semibold text-white/50">Той: </span>{poslednoK}
        </p>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
        <button type="button" onClick={() => setVaprosi(!vaprosi)} className="flex w-full text-left text-xs font-semibold text-white/80">
          📋 Въпросите за етапа <span className="ml-auto text-white/40">{vaprosi ? "▴" : "▾"}</span>
        </button>
        {vaprosi && (
          <ul className="mt-1 grid gap-1 text-xs text-white/75">
            {(ETAP_VAPROSI[etap] ?? []).slice(0, 4).map((v) => <li key={v}>• {v}</li>)}
          </ul>
        )}
      </div>

      {lipsva.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <span className="text-white/50">🛡 Обери преди цената:</span>
          {lipsva.map((x) => (
            <span key={x.id} className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-amber-100">{x.ikona} {x.ime}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => void poiskai("rachno")}
          className="rounded-lg bg-cyan-500/80 px-3 py-1.5 text-sm font-semibold text-black hover:bg-cyan-400"
        >
          ⚡ Подскажи
        </button>
        {BARZI.map((id, i) => (
          <button
            key={id}
            type="button"
            title={VAZRAZHENIYA.find((v) => v.id === id)?.ime}
            onClick={() => void poiskai(`vazrazhenie:${id}`)}
            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white/85 hover:bg-white/10"
          >
            <span className="mr-1 font-mono text-white/40">{i + 1}</span>{KRATKO[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
