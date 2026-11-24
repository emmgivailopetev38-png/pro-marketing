"use client";

import { useId, useState } from "react";

/** 3000 → „3 000 €“ — с интервал на хилядите като в текстовете (bg-BG не слага при 4 цифри). */
const eur = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;

/** „Сметни си го“ — колко носят N клиента с твоите цени. Числата са на човека, не обещание. */
export function Kalkulator({ klienti: k0, naprava: n0, mesechno: m0 }: { klienti: number; naprava: number; mesechno: number }) {
  const [klienti, setKlienti] = useState(k0);
  const [naprava, setNaprava] = useState(n0);
  const [mesechno, setMesechno] = useState(m0);
  const id = useId();

  return (
    <div className="pd-calc">
      <div className="pd-box pd-calc-in">
        <div className="pd-range">
          <label htmlFor={`${id}-k`}>
            Клиенти <output htmlFor={`${id}-k`}>{klienti}</output>
          </label>
          <input id={`${id}-k`} type="range" min={1} max={30} step={1} value={klienti} onChange={(e) => setKlienti(Number(e.target.value))} />
        </div>
        <div className="pd-range">
          <label htmlFor={`${id}-n`}>
            Направа на един сайт <output htmlFor={`${id}-n`}>{eur(naprava)}</output>
          </label>
          <input id={`${id}-n`} type="range" min={200} max={2000} step={50} value={naprava} onChange={(e) => setNaprava(Number(e.target.value))} />
        </div>
        <div className="pd-range">
          <label htmlFor={`${id}-m`}>
            Поддръжка на месец <output htmlFor={`${id}-m`}>{eur(mesechno)}</output>
          </label>
          <input id={`${id}-m`} type="range" min={15} max={150} step={1} value={mesechno} onChange={(e) => setMesechno(Number(e.target.value))} />
        </div>
      </div>
      <div className="pd-calc-out" aria-live="polite">
        <div>
          <p>Еднократно от направата</p>
          <b>{eur(klienti * naprava)}</b>
        </div>
        <div>
          <p>Всеки месец от поддръжката</p>
          <b className="gold">{eur(klienti * mesechno)}</b>
        </div>
        <div>
          <p>За година от поддръжката</p>
          <b>{eur(klienti * mesechno * 12)}</b>
        </div>
        <p className="pd-calc-note">Сметка с твоите числа — не обещание за доход. Резултатът зависи от работата ти.</p>
      </div>
    </div>
  );
}
