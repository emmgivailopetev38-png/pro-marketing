"use client";

// Плаващ прозорец (Document Picture-in-Picture, Chrome 116+): стои над Meet/Zoom,
// дори на цял екран. Отделен React корен, същият склад.
import { createRoot, type Root } from "react-dom/client";
import { Karta, Tishina } from "./Karta";
import { poiskai, useZhivo } from "./dvigatel";

interface DocPip {
  requestWindow(o: { width: number; height: number }): Promise<Window>;
  window: Window | null;
}

export function imaPip() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}

let koren: Root | null = null;

export async function otvoriPip() {
  const dpip = (window as unknown as { documentPictureInPicture?: DocPip }).documentPictureInPicture;
  if (!dpip) throw new Error("Плаващият прозорец иска Chrome 116 или по-нов.");
  if (dpip.window) {
    dpip.window.focus();
    return;
  }
  const w = await dpip.requestWindow({ width: 480, height: 320 });
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
  koren.render(<PipIzgled />);
  w.addEventListener("pagehide", () => {
    koren?.unmount();
    koren = null;
  });
}

const BARZI = [
  ["pari", "💶 Скъпо"],
  ["pomislya", "🤔 Ще помисля"],
  ["partnyor", "👥 Партньор"],
  ["vreme", "⏳ Нямам време"],
] as const;

function PipIzgled() {
  const p = useZhivo((x) => x.podskazka);
  const mozak = useZhivo((x) => x.status.mozak);
  const sabshtenie = useZhivo((x) => x.status.sabshtenie);
  const tishinaOt = useZhivo((x) => x.tishinaOt);
  return (
    <div className="flex min-h-screen flex-col gap-2 bg-[#070b12] p-2 font-sans text-white">
      <Tishina ot={tishinaOt} />
      <Karta p={p} misli={mozak === "misli"} greshka={mozak === "greshka" ? sabshtenie : undefined} kompaktna />
      <div className="mt-auto flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => void poiskai("rachno")}
          className="rounded-lg bg-cyan-500/80 px-3 py-1.5 text-sm font-semibold text-black hover:bg-cyan-400"
        >
          ⚡ Подскажи
        </button>
        {BARZI.map(([id, ime]) => (
          <button
            key={id}
            type="button"
            onClick={() => void poiskai(`vazrazhenie:${id}`)}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/85 hover:bg-white/10"
          >
            {ime}
          </button>
        ))}
      </div>
    </div>
  );
}
