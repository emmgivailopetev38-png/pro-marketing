"use client";

import { useEffect, useState } from "react";
import { prazno, tonInfo } from "@/lib/suvetnik/razbor";
import type { ZhivaPodskazka } from "./dvigatel";

export const BOI: Record<string, string> = {
  sky: "border-sky-400/60 bg-sky-400/15 text-sky-100",
  emerald: "border-emerald-400/60 bg-emerald-400/15 text-emerald-100",
  violet: "border-violet-400/60 bg-violet-400/15 text-violet-100",
  cyan: "border-cyan-400/60 bg-cyan-400/15 text-cyan-100",
  amber: "border-amber-400/60 bg-amber-400/15 text-amber-100",
  orange: "border-orange-400/60 bg-orange-400/15 text-orange-100",
  pink: "border-pink-400/60 bg-pink-400/15 text-pink-100",
  blue: "border-blue-400/60 bg-blue-400/15 text-blue-100",
  slate: "border-slate-400/60 bg-slate-400/15 text-slate-100",
};

function useSega(aktivno: boolean) {
  const [sega, setSega] = useState(() => Date.now());
  useEffect(() => {
    if (!aktivno) return;
    const t = setInterval(() => setSega(Date.now()), 250);
    return () => clearInterval(t);
  }, [aktivno]);
  return sega;
}

export function Tishina({ ot }: { ot: number | null }) {
  const sega = useSega(ot !== null);
  if (ot === null) return null;
  const ostava = Math.ceil((5000 - (sega - ot)) / 1000);
  if (ostava <= 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-400/50 bg-slate-500/20 px-4 py-2 text-lg font-semibold text-slate-100">
      <span className="text-2xl">🤫</span> Мълчи — остави го да отговори <span className="ml-auto font-mono text-2xl">{ostava}</span>
    </div>
  );
}

export function Karta({
  p,
  misli,
  greshka,
  kompaktna = false,
}: {
  p: ZhivaPodskazka | null;
  misli: boolean;
  greshka?: string;
  kompaktna?: boolean;
}) {
  if (!p) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-[var(--color-text-secondary)]">
        {misli ? "Съветникът слуша и мисли…" : greshka ? `⚠️ ${greshka}` : "Тук ще излезе какво да кажеш."}
      </div>
    );
  }
  const ton = tonInfo(p.ton);
  return (
    <div className={`rounded-2xl border-2 ${BOI[ton.cvyat] ?? BOI.slate} ${kompaktna ? "p-3" : "p-5"} shadow-lg transition-colors`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${BOI[ton.cvyat] ?? BOI.slate} ${kompaktna ? "text-sm" : "text-base"}`}>
          <span className={kompaktna ? "text-lg" : "text-xl"}>{ton.emoji}</span>
          {ton.id ?? "ТОН"}
        </span>
        {ton.dostavka && <span className={`${kompaktna ? "text-xs" : "text-sm"} text-white/80`}>{ton.dostavka}</span>}
        {(misli || !p.gotova) && <span className="ml-auto animate-pulse text-xs text-white/60">● мисли</span>}
      </div>
      <p className={`mt-3 font-semibold leading-snug text-white ${kompaktna ? "text-xl" : "text-[1.7rem] md:text-3xl"}`}>
        {p.kazhi}
      </p>
      {!prazno(p.vnimavai) && (
        <p className={`mt-3 rounded-lg bg-red-500/15 px-3 py-1.5 text-red-100 ${kompaktna ? "text-xs" : "text-sm"}`}>⛔ {p.vnimavai}</p>
      )}
      {!kompaktna && (
        <div className="mt-3 grid gap-1 text-sm text-white/75">
          {!prazno(p.tehnika) && (
            <p>
              <span className="font-semibold text-white/90">{p.tehnika}</span>
              {!prazno(p.zashto) && <span> — {p.zashto}</span>}
            </p>
          )}
          {!prazno(p.klientat) && <p>👤 Клиентът: {p.klientat}</p>}
          {!prazno(p.sledvashto) && <p className="text-white/60">↪ После: {p.sledvashto}</p>}
        </div>
      )}
      {kompaktna && !prazno(p.tehnika) && <p className="mt-1.5 truncate text-[11px] text-white/55">🎯 {p.tehnika}</p>}
      {kompaktna && !prazno(p.sledvashto) && <p className="mt-1 text-xs text-white/65">↪ После: {p.sledvashto}</p>}
      {greshka && <p className="mt-2 text-xs text-amber-200">⚠️ {greshka}</p>}
    </div>
  );
}
