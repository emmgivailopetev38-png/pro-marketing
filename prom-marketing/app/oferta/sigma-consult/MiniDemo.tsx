"use client";

import { useEffect, useRef, useState } from "react";

/* Мини демо на платформата — същите стъпки, които ще прави наистина.
   Сценарият и отговорите тук са предварително подготвени; истинската
   система ги съчинява в момента. */

const PRODUKTI = ["Каско при лизинг", "Гражданска отговорност", "Имуществена", "Живот и здраве"];
const DALJINI = [20, 30, 40, 60];

const SCENARIY = [
  { t: "Кадър 1", txt: "Мъж взима ключовете на нова кола в автосалон.", rep: "Взех колата. Мислех, че съм готов." },
  { t: "Кадър 2", txt: "Същият мъж, до колата, с крива усмивка.", rep: "После видях каква Каско ми подадоха." },
  { t: "Кадър 3", txt: "Вие, в офиса, право в камерата.", rep: "Лизинговата ти подава тяхната полица. И ти подписваш." },
  { t: "Кадър 4", txt: "По-близък план, по-настойчиво.", rep: "Имаш право да избереш сам. Същото покритие. Друга цена." },
  { t: "Кадър 5", txt: "Топъл финал, усмивка.", rep: "Сигма Консулт. Седемнайсет години на твоя страна." },
];

const CHAT: { q: string; a: string }[] = [
  {
    q: "Защо това видео тръгна, а миналото не?",
    a: "Първите две секунди. В това видео човек държи ключове и казва нещо, което зрителят е преживял. В миналото започваше с логото ви — там 6 от 10 души спират да гледат преди третата секунда.",
  },
  {
    q: "Коя тема да е следващата?",
    a: "Гражданска отговорност преди края на месеца — тогава търсенето скача. Ъгълът, който още не сте ползвали: какво става, ако полицата изтече в събота вечер.",
  },
  {
    q: "Кога да го пусна?",
    a: "Вторник и четвъртък, 19:30–21:00. Вашите последни осем видеа събират 64% от гледанията си в този прозорец.",
  },
  {
    q: "Мога ли да сложа мои кадри?",
    a: "Да. Качвате ги в същия екран, режете началото и края, влачите ги по местата им. Може да се смесват свободно с генерираните — например вашият офис в началото и генерирана сцена след това.",
  },
];

type Faza = "zaqvka" | "scenariy" | "generira" | "gotovo";

export default function MiniDemo() {
  const [faza, setFaza] = useState<Faza>("zaqvka");
  const [produkt, setProdukt] = useState(PRODUKTI[0]);
  const [daljina, setDaljina] = useState(30);
  const [tema, setTema] = useState("Хората не знаят, че могат да изберат сами");
  const [progres, setProgres] = useState(0);
  const [odobreno, setOdobreno] = useState(false);
  const [otvoren, setOtvoren] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (faza !== "generira") return;
    // Прогресът се смята от изтеклото ВРЕМЕ, не от брояч на тиктаци —
    // браузърите забавят таймерите в скрит таб и лентата иначе забуксува.
    const zapochna = Date.now();
    const traene = 4800;
    setProgres(0);
    timer.current = setInterval(() => {
      const dql = Math.min(100, Math.round(((Date.now() - zapochna) / traene) * 100));
      setProgres(dql);
      if (dql >= 100) {
        if (timer.current) clearInterval(timer.current);
        setFaza("gotovo");
      }
    }, 60);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [faza]);

  const etap = (n: number, label: string, aktiven: boolean, gotov: boolean, posleden = false) => (
    <div className="flex flex-1 items-center gap-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-all duration-300"
        style={{
          background: gotov ? "var(--s-amber)" : aktiven ? "rgba(224,164,88,0.16)" : "var(--s-deep)",
          color: gotov ? "#1a1206" : aktiven ? "var(--s-amber)" : "var(--s-text-3)",
          border: `1px solid ${gotov || aktiven ? "var(--s-amber-dim)" : "var(--s-line)"}`,
          boxShadow: aktiven ? "0 0 0 4px rgba(224,164,88,0.09)" : "none",
        }}
      >
        {gotov ? "✓" : n}
      </span>
      <span
        className="whitespace-nowrap text-[13px] transition-colors"
        style={{ color: aktiven ? "var(--s-text)" : gotov ? "var(--s-text-2)" : "var(--s-text-3)" }}
      >
        {label}
      </span>
      {!posleden && (
        <span
          className="hidden h-px flex-1 sm:block"
          style={{ background: gotov ? "var(--s-amber-dim)" : "var(--s-line)" }}
        />
      )}
    </div>
  );

  const redPole = (label: string, deca: React.ReactNode) => (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--s-text-3)" }}
      >
        {label}
      </span>
      {deca}
    </label>
  );

  const inputStil = {
    background: "var(--s-deep)",
    borderColor: "var(--s-line)",
    color: "var(--s-text)",
  };

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--s-line)", background: "var(--s-card)" }}
    >
      {/* лента на приложението */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5"
        style={{ borderColor: "var(--s-line)", background: "var(--s-deep)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex gap-1.5">
            <i className="block h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <i className="block h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <i className="block h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
          </span>
          <span className="text-[13px] font-semibold" style={{ color: "var(--s-text-2)" }}>
            Сигма Консулт · видео асистент
          </span>
        </div>
        <span className="text-[12px]" style={{ color: "var(--s-text-3)" }}>
          демо · нищо не се публикува
        </span>
      </div>

      {/* стъпки */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-5 py-3.5"
        style={{ borderColor: "var(--s-line)" }}
      >
        {etap(1, "Заявка", faza === "zaqvka", faza !== "zaqvka")}
        {etap(2, "Сценарий", faza === "scenariy", faza === "generira" || faza === "gotovo")}
        {etap(3, "Сглобяване", faza === "generira", faza === "gotovo")}
        {etap(4, "Одобрение", faza === "gotovo", odobreno, true)}
      </div>

      <div className="p-5 sm:p-6">
        {faza === "zaqvka" && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {redPole(
                "Застрахователен продукт",
                <select
                  value={produkt}
                  onChange={(e) => setProdukt(e.target.value)}
                  className="rounded-lg border px-3 py-2.5 text-[15px] outline-none"
                  style={inputStil}
                >
                  {PRODUKTI.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>,
              )}
              {redPole(
                "Дължина",
                <div className="flex gap-2">
                  {DALJINI.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaljina(d)}
                      className="flex-1 rounded-lg border px-2 py-2.5 text-[14px] font-semibold tabular-nums transition-colors"
                      style={{
                        background: daljina === d ? "var(--s-amber)" : "var(--s-deep)",
                        borderColor: daljina === d ? "var(--s-amber)" : "var(--s-line)",
                        color: daljina === d ? "#1a1206" : "var(--s-text-2)",
                      }}
                    >
                      {d}с
                    </button>
                  ))}
                </div>,
              )}
            </div>
            {redPole(
              "Темата, с една дума или с изречение",
              <input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="rounded-lg border px-3 py-2.5 text-[15px] outline-none"
                style={inputStil}
              />,
            )}
            <button
              type="button"
              onClick={() => setFaza("scenariy")}
              className="self-start rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--s-amber)", color: "#1a1206" }}
            >
              Напиши сценария
            </button>
          </div>
        )}

        {faza === "scenariy" && (
          <div className="flex flex-col gap-4">
            <p className="text-[14px]" style={{ color: "var(--s-text-3)" }}>
              Пет кадъра за {daljina} секунди · {produkt}. Всеки ред може да се
              пренапише, преди да се генерира каквото и да било.
            </p>
            <ol className="flex flex-col gap-2">
              {SCENARIY.map((s) => (
                <li
                  key={s.t}
                  className="grid gap-1 rounded-lg border p-3.5 sm:grid-cols-[5.5rem_1fr] sm:gap-3"
                  style={{ borderColor: "var(--s-line)", background: "var(--s-deep)" }}
                >
                  <span
                    className="text-[12px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: "var(--s-amber)" }}
                  >
                    {s.t}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-[14px]" style={{ color: "var(--s-text-3)" }}>
                      {s.txt}
                    </span>
                    <span className="text-[15px]" style={{ color: "var(--s-text)" }}>
                      „{s.rep}“
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFaza("generira")}
                className="rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--s-amber)", color: "#1a1206" }}
              >
                Одобри сценария
              </button>
              <button
                type="button"
                onClick={() => setFaza("zaqvka")}
                className="rounded-lg border px-5 py-3 text-[15px] font-semibold"
                style={{ borderColor: "var(--s-line)", color: "var(--s-text-2)" }}
              >
                Назад
              </button>
            </div>
          </div>
        )}

        {faza === "generira" && (
          <div className="flex flex-col gap-5 py-4">
            <ol className="flex flex-col gap-2.5">
              {[
                { do: 28, txt: "Сглобявам кадрите" },
                { do: 56, txt: "Слагам гласа и музиката" },
                { do: 82, txt: "Режа по такта" },
                { do: 100, txt: "Пиша субтитрите" },
              ].map((s2) => {
                const gotov = progres >= s2.do;
                const teche = !gotov && progres >= s2.do - 28;
                return (
                  <li key={s2.txt} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                      style={{
                        background: gotov ? "var(--s-amber)" : "transparent",
                        border: `1px solid ${gotov || teche ? "var(--s-amber-dim)" : "var(--s-line)"}`,
                        color: "#1a1206",
                      }}
                    >
                      {gotov ? "✓" : ""}
                    </span>
                    <span
                      className="text-[15px] transition-colors"
                      style={{
                        color: gotov ? "var(--s-text-2)" : teche ? "var(--s-text)" : "var(--s-text-3)",
                      }}
                    >
                      {s2.txt}
                      {teche && <span style={{ color: "var(--s-amber)" }}>…</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--s-deep)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-100"
                  style={{
                    width: `${progres}%`,
                    background: "linear-gradient(90deg, var(--s-amber-dim), var(--s-amber))",
                  }}
                />
              </div>
              <span
                className="w-10 text-right text-[13px] tabular-nums"
                style={{ fontFamily: "var(--font-mono)", color: "var(--s-text-3)" }}
              >
                {progres}%
              </span>
            </div>
          </div>
        )}

        {faza === "gotovo" && (
          <div className="grid gap-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-start">
            <figure className="flex flex-col items-center gap-3">
              {/* рамка на телефон — видеото се вижда както ще го види зрителят */}
              <div
                className="relative rounded-[2rem] p-2.5 shadow-2xl"
                style={{
                  background: "linear-gradient(160deg, #2a3240, #12171f)",
                  border: "1px solid rgba(233,216,190,0.16)",
                  boxShadow: odobreno
                    ? "0 0 0 2px var(--s-amber-dim), 0 24px 50px -18px rgba(0,0,0,.8)"
                    : "0 24px 50px -18px rgba(0,0,0,.8)",
                }}
              >
                <span
                  className="absolute left-1/2 top-3.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full"
                  style={{ background: "rgba(0,0,0,.55)" }}
                />
                <div
                  className="overflow-hidden rounded-[1.6rem]"
                  style={{ background: "#000", aspectRatio: "9 / 16", width: "min(230px, 60vw)" }}
                >
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster="/videa/sigma-kasko-lizing.jpg"
                    className="h-full w-full object-cover"
                  >
                    <source src="/videa/sigma-kasko-lizing.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              <figcaption
                className="text-center text-[12px]"
                style={{ color: odobreno ? "var(--s-amber)" : "var(--s-text-3)" }}
              >
                {odobreno ? "✓ Одобрено · чака вторник, 19:30" : "Точно това видео е излязло оттук"}
              </figcaption>
            </figure>

            <div className="flex flex-col gap-4">
              {odobreno ? (
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--s-amber-dim)", background: "rgba(224,164,88,0.07)" }}
                >
                  <p className="text-[15px] font-semibold" style={{ color: "var(--s-text)" }}>
                    Одобрено. Насрочено за вторник, 19:30.
                  </p>
                  <p className="mt-1 text-[14px]" style={{ color: "var(--s-text-2)" }}>
                    Facebook, Instagram и TikTok. Дотогава може да се спре с един бутон.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[15px]" style={{ color: "var(--s-text-2)" }}>
                    Видеото спира тук и чака вас. Нищо не е тръгнало към никоя мрежа.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setOdobreno(true)}
                      className="rounded-lg px-5 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "var(--s-amber)", color: "#1a1206" }}
                    >
                      Одобрявам
                    </button>
                    <button
                      type="button"
                      onClick={() => setFaza("scenariy")}
                      className="rounded-lg border px-5 py-3 text-[15px] font-semibold"
                      style={{ borderColor: "var(--s-line)", color: "var(--s-text-2)" }}
                    >
                      Върни за преправяне
                    </button>
                  </div>
                </>
              )}

              {/* съветникът — както изглежда истински чат */}
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--s-line)", background: "var(--s-deep)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
                    style={{ background: "rgba(224,164,88,0.16)", color: "var(--s-amber)" }}
                  >
                    ✦
                  </span>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--s-amber)" }}
                  >
                    Питайте го каквото се сетите
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {CHAT.map((c, i) => (
                    <div key={c.q} className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOtvoren(otvoren === i ? null : i)}
                        className="self-end rounded-2xl rounded-br-md px-3.5 py-2 text-left text-[14px] transition-opacity hover:opacity-90"
                        style={{
                          background: otvoren === i ? "var(--s-amber)" : "rgba(224,164,88,0.13)",
                          color: otvoren === i ? "#1a1206" : "var(--s-text)",
                          maxWidth: "88%",
                        }}
                      >
                        {c.q}
                      </button>
                      {otvoren === i && (
                        <div
                          className="self-start rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[14px] leading-relaxed"
                          style={{
                            background: "var(--s-card)",
                            border: "1px solid var(--s-line)",
                            color: "var(--s-text-2)",
                            maxWidth: "92%",
                          }}
                        >
                          {c.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFaza("zaqvka");
                  setOdobreno(false);
                  setOtvoren(null);
                }}
                className="self-start text-[14px] underline underline-offset-4"
                style={{ color: "var(--s-text-3)" }}
              >
                Пробвайте пак, отначало
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
