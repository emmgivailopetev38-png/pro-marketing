"use client";
/* =====================================================================
   TradingViz — „живата платформа” на /trading: CSS-анимиран мокъп на
   трейдинг агент в действие. Три панела: свещи (пулсиращ пазар),
   агент лог (редове, които се изписват) и крива на капитала при демо.
   Никакви реални данни — илюстрация на това, което човек ще ИЗГРАДИ.
   ===================================================================== */

const CANDLES = [
  { h: 38, up: true }, { h: 52, up: true }, { h: 30, up: false }, { h: 46, up: true },
  { h: 64, up: true }, { h: 40, up: false }, { h: 34, up: false }, { h: 58, up: true },
  { h: 72, up: true }, { h: 50, up: false }, { h: 62, up: true }, { h: 80, up: true },
  { h: 56, up: false }, { h: 68, up: true }, { h: 88, up: true }, { h: 74, up: false },
];

const LOG_LINES = [
  { t: "09:00:01", msg: "Агентът зареди правилата · 3 условия за вход", ok: true },
  { t: "10:14:22", msg: "Сигнал: пробив + обем 1.8× среден » проверка на риска", ok: true },
  { t: "10:14:23", msg: "Позиция 1% от сметката · стоп поставен автоматично", ok: true },
  { t: "13:02:10", msg: "Изход по правило »  дневникът е записан", ok: true },
  { t: "14:37:45", msg: "Сигнал отхвърлен: дневен лимит достигнат · агентът изчаква", ok: false },
];

export function TradingViz() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-violet-400/25 bg-[linear-gradient(160deg,rgba(124,58,237,0.1),rgba(5,150,105,0.05))] p-6 md:p-9">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.28), transparent 70%)" }}
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-violet-300">
        Платформата, която изграждаш · илюстрация
      </p>
      <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">
        Твоят агент на работа — дисциплина, не емоция
      </h3>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Панел 1: графиката */}
        <div className="rounded-2xl border border-white/10 bg-[rgba(5,8,14,0.85)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400">BTC/EUR · 1H · демо</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> агентът наблюдава
            </span>
          </div>
          <div className="flex h-[140px] items-end gap-[6px]">
            {CANDLES.map((c2, i) => (
              <div key={i} className="tv-candle relative flex-1" style={{ animationDelay: `${i * 0.12}s` }}>
                <div
                  className="w-full rounded-[2px]"
                  style={{
                    height: `${c2.h}%`,
                    background: c2.up ? "linear-gradient(to top,#059669,#34d399)" : "linear-gradient(to top,#9f1239,#fb7185)",
                    boxShadow: c2.up ? "0 0 10px rgba(52,211,153,0.35)" : "0 0 10px rgba(251,113,133,0.25)",
                  }}
                />
              </div>
            ))}
          </div>
          {/* маркери на агента */}
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span className="text-emerald-300">▲ вход по правило</span>
            <span className="text-violet-300">■ стоп автоматично</span>
            <span className="text-amber-300">▼ изход по правило</span>
          </div>
        </div>

        {/* Панел 2: агент логът + кривата */}
        <div className="flex flex-col gap-5">
          <div className="flex-1 rounded-2xl border border-white/10 bg-[rgba(5,8,14,0.85)] p-5">
            <p className="mb-3 font-mono text-xs text-slate-400">Дневник на агента (журнал)</p>
            <div className="space-y-2">
              {LOG_LINES.map((l, i) => (
                <div key={i} className="tv-log flex items-start gap-2 font-mono text-[11px] leading-relaxed" style={{ animationDelay: `${0.4 + i * 0.5}s` }}>
                  <span className="shrink-0 text-slate-600">{l.t}</span>
                  <span className={l.ok ? "text-slate-300" : "text-amber-300"}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[rgba(5,8,14,0.85)] p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-slate-400">Демо сметка · 6 седмици</p>
              <span className="font-mono text-xs text-emerald-300">дисциплината се вижда</span>
            </div>
            {/* крива на капитала */}
            <svg viewBox="0 0 300 60" className="mt-3 w-full" aria-hidden>
              <polyline
                points="0,50 30,46 55,48 85,40 110,42 140,34 170,36 200,28 235,30 265,20 300,16"
                fill="none"
                stroke="url(#tvg)"
                strokeWidth="2.5"
                className="tv-curve"
              />
              <defs>
                <linearGradient id="tvg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Илюстрация на процеса — не реални резултати и не обещание за печалба. Точно тази
        дисциплина (правила » стоп » журнал) изграждаме заедно.
      </p>

      <style>{`
        .tv-candle { animation: tvGrow 0.7s cubic-bezier(.22,1,.36,1) both; transform-origin: bottom; }
        @keyframes tvGrow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        .tv-log { animation: tvFade 0.5s ease both; }
        @keyframes tvFade { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
        .tv-curve { stroke-dasharray: 400; stroke-dashoffset: 400; animation: tvDraw 2.4s 0.6s ease-out forwards; }
        @keyframes tvDraw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .tv-candle, .tv-log { animation: none; opacity: 1; }
          .tv-curve { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
