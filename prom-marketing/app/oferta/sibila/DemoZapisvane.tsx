"use client";

import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Работещо демо на записването за Център Сибила.

   Услугите, времетраенето и цените са ИСТИНСКИТЕ ѝ, свалени от профила ѝ в
   Studio24 на 01.09.2026. Работното време също е нейното: вторник–събота
   10:00–19:00, понеделник и неделя са почивни. Смисълът е тя да разпознае
   своя салон, а не да гледа измислен пример.
   ------------------------------------------------------------------------- */

type Usluga = { ime: string; minuti: number; cena: string; grupa: string };

const USLUGI: Usluga[] = [
  { ime: "Терапевтичен педикюр + обработка на стъпала", minuti: 90, cena: "65 €", grupa: "Терапевтични" },
  { ime: "Терапевтичен педикюр (без стъпалата)", minuti: 60, cena: "40 €", grupa: "Терапевтични" },
  { ime: "Обработка на впит нокът", minuti: 15, cena: "15 €", grupa: "Терапевтични" },
  { ime: "Диагностика за състоянието на краката", minuti: 30, cena: "20 €", grupa: "Терапевтични" },
  { ime: "Маникюр с гел лак при Даниела", minuti: 90, cena: "28 €", grupa: "Маникюр" },
  { ime: "Френски маникюр с гел лак при Даниела", minuti: 90, cena: "34 €", grupa: "Маникюр" },
  { ime: "Изграждане с гел при Даниела", minuti: 120, cena: "50 €", grupa: "Ноктопластика" },
  { ime: "Базов педикюр с гел лак + обработка на стъпалата", minuti: 90, cena: "45 €", grupa: "Педикюр" },
];

const DNI = [
  { eti: "Вт", data: "2 септ.", svobodni: ["10:00", "13:30", "17:00"] },
  { eti: "Ср", data: "3 септ.", svobodni: ["11:30", "15:00"] },
  { eti: "Чт", data: "4 септ.", svobodni: ["10:00", "12:00", "16:30"] },
  { eti: "Пт", data: "5 септ.", svobodni: [] },
  { eti: "Сб", data: "6 септ.", svobodni: ["10:00", "14:00"] },
];

type Faza = "usluga" | "chas" | "danni" | "gotovo";

export default function DemoZapisvane() {
  const [faza, setFaza] = useState<Faza>("usluga");
  const [usluga, setUsluga] = useState<Usluga | null>(null);
  const [den, setDen] = useState<(typeof DNI)[number] | null>(null);
  const [chas, setChas] = useState<string | null>(null);
  const [ime, setIme] = useState("");
  const [telefon, setTelefon] = useState("");
  const [stapka, setStapka] = useState(0);
  const taimeri = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => taimeri.current.forEach(clearTimeout), []);

  function zapishi() {
    setFaza("gotovo");
    setStapka(0);
    taimeri.current.forEach(clearTimeout);
    taimeri.current = [1, 2, 3, 4].map((n) =>
      setTimeout(() => setStapka(n), n * 750),
    );
  }

  function otnovo() {
    taimeri.current.forEach(clearTimeout);
    setFaza("usluga");
    setUsluga(null);
    setDen(null);
    setChas(null);
    setIme("");
    setTelefon("");
    setStapka(0);
  }

  const gotovoZaZapis = ime.trim().length > 1 && telefon.trim().length >= 6;

  return (
    <div
      style={{
        border: "1px solid var(--color-border-default)",
        borderRadius: 18,
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 18px 50px -30px rgba(44,33,28,0.45)",
      }}
    >
      {/* лента като на нейния сайт, а не като на чужда платформа */}
      <div
        style={{
          background: "linear-gradient(120deg, #8c4a3f, #b0724f)",
          color: "#fdfaf7",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.02em" }}>
            Център Сибила
          </div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            Варна, ул. Ангел Кънчев 24 · запазване на час
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, textAlign: "right" }}>
          вашият домейн
          <br />
          <span style={{ fontWeight: 600 }}>sibila.bg</span>
        </div>
      </div>

      <div style={{ padding: "22px" }}>
        {/* стъпките */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {(
            [
              ["usluga", "1 · Услуга"],
              ["chas", "2 · Час"],
              ["danni", "3 · Данни"],
              ["gotovo", "4 · Готово"],
            ] as const
          ).map(([k, etiket]) => {
            const red = ["usluga", "chas", "danni", "gotovo"];
            const aktivna = red.indexOf(faza) >= red.indexOf(k);
            return (
              <span
                key={k}
                style={{
                  fontSize: 12,
                  padding: "5px 11px",
                  borderRadius: 999,
                  background: aktivna ? "#8c4a3f" : "#f6eee8",
                  color: aktivna ? "#fdfaf7" : "#9b8579",
                  fontWeight: 600,
                  transition: "all .25s",
                }}
              >
                {etiket}
              </span>
            );
          })}
        </div>

        {faza === "usluga" && (
          <div>
            <p style={{ margin: "0 0 14px", color: "#5e4b42", fontSize: 15 }}>
              Клиентът избира от <b>вашите</b> услуги — с вашите цени и вашето времетраене.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {USLUGI.map((u) => (
                <button
                  key={u.ime}
                  onClick={() => {
                    setUsluga(u);
                    setFaza("chas");
                  }}
                  style={{
                    textAlign: "left",
                    padding: "13px 15px",
                    borderRadius: 12,
                    border: "1px solid var(--color-border-default)",
                    background: "#fdfaf7",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span>
                    <span style={{ display: "block", fontWeight: 600, color: "#2c211c" }}>
                      {u.ime}
                    </span>
                    <span style={{ fontSize: 13, color: "#9b8579" }}>
                      {u.grupa} · {u.minuti} мин.
                    </span>
                  </span>
                  <span style={{ fontWeight: 700, color: "#8c4a3f", whiteSpace: "nowrap" }}>
                    {u.cena}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {faza === "chas" && usluga && (
          <div>
            <p style={{ margin: "0 0 14px", color: "#5e4b42", fontSize: 15 }}>
              Показват се само часовете, в които наистина сте свободна.{" "}
              <b>Петък е запълнен и системата не го предлага.</b>
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {DNI.map((d) => (
                <div
                  key={d.eti}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                    opacity: d.svobodni.length ? 1 : 0.45,
                  }}
                >
                  <span
                    style={{
                      width: 74,
                      fontWeight: 600,
                      color: "#2c211c",
                      fontSize: 14,
                    }}
                  >
                    {d.eti} {d.data}
                  </span>
                  {d.svobodni.length === 0 ? (
                    <span style={{ fontSize: 13, color: "#9b8579" }}>няма свободен час</span>
                  ) : (
                    d.svobodni.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setDen(d);
                          setChas(c);
                          setFaza("danni");
                        }}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 999,
                          border: "1px solid var(--color-border-bright)",
                          background: "#fff",
                          color: "#8c4a3f",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {c}
                      </button>
                    ))
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setFaza("usluga")}
              style={{ marginTop: 16, background: "none", border: "none", color: "#9b8579", cursor: "pointer", fontSize: 13 }}
            >
              ← назад към услугите
            </button>
          </div>
        )}

        {faza === "danni" && usluga && den && chas && (
          <div>
            <div
              style={{
                background: "#f6eee8",
                borderRadius: 12,
                padding: "12px 15px",
                marginBottom: 16,
                fontSize: 14,
                color: "#5e4b42",
              }}
            >
              <b style={{ color: "#2c211c" }}>{usluga.ime}</b>
              <br />
              {den.eti} {den.data}, {chas} ч. · {usluga.minuti} мин. · {usluga.cena}
            </div>
            <div style={{ display: "grid", gap: 10, maxWidth: 380 }}>
              <input
                value={ime}
                onChange={(e) => setIme(e.target.value)}
                placeholder="Име"
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border-default)",
                  fontSize: 15,
                  background: "#fff",
                  color: "#2c211c",
                }}
              />
              <input
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="Телефон"
                inputMode="tel"
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border-default)",
                  fontSize: 15,
                  background: "#fff",
                  color: "#2c211c",
                }}
              />
              <button
                onClick={zapishi}
                disabled={!gotovoZaZapis}
                style={{
                  padding: "13px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: gotovoZaZapis ? "#8c4a3f" : "#e3d5cc",
                  color: gotovoZaZapis ? "#fdfaf7" : "#9b8579",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: gotovoZaZapis ? "pointer" : "not-allowed",
                }}
              >
                Запази часа
              </button>
              <p style={{ fontSize: 12.5, color: "#9b8579", margin: 0 }}>
                Опитайте с вашето име — за да видите как изглежда картонът после.
              </p>
            </div>
          </div>
        )}

        {faza === "gotovo" && usluga && den && chas && (
          <div>
            <div
              style={{
                borderRadius: 12,
                padding: "16px 18px",
                background: "#f2f7f2",
                border: "1px solid rgba(90,140,90,0.25)",
                marginBottom: 18,
              }}
            >
              <div style={{ fontWeight: 700, color: "#33633a", marginBottom: 4 }}>
                Часът е запазен
              </div>
              <div style={{ fontSize: 14, color: "#4a5a4a" }}>
                {ime} · {den.eti} {den.data}, {chas} ч. · {usluga.ime}
              </div>
            </div>

            <p style={{ margin: "0 0 12px", color: "#5e4b42", fontSize: 15 }}>
              А ето какво тръгва само, без вие да пипате нищо:
            </p>

            <div style={{ display: "grid", gap: 9 }}>
              {[
                ["Часът влезе в графика ви", "Веднага. Този час вече не се предлага на никого другиго."],
                ["Клиентът получи потвърждение", `Съобщение до ${telefon || "телефона му"} с датата, часа и адреса.`],
                ["Напомняне ден преди часа", "Изпраща се само. Оттук идва спирането на неявяванията."],
                ["Картонът се създаде", `${ime || "Клиентът"} · какво е правил, кога, колко е платил — и кога му е време пак.`],
              ].map(([zaglavie, tekst], i) => (
                <div
                  key={zaglavie}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "11px 14px",
                    borderRadius: 11,
                    border: "1px solid var(--color-border-default)",
                    background: stapka > i ? "#fff" : "#faf6f3",
                    opacity: stapka > i ? 1 : 0.35,
                    transform: stapka > i ? "translateY(0)" : "translateY(4px)",
                    transition: "all .35s ease",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: stapka > i ? "#8c4a3f" : "#e3d5cc",
                      color: "#fff",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span>
                    <span style={{ display: "block", fontWeight: 600, color: "#2c211c", fontSize: 14.5 }}>
                      {zaglavie}
                    </span>
                    <span style={{ fontSize: 13.5, color: "#5e4b42" }}>{tekst}</span>
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={otnovo}
              style={{
                marginTop: 18,
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid var(--color-border-bright)",
                background: "#fff",
                color: "#8c4a3f",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Пробвайте пак
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
