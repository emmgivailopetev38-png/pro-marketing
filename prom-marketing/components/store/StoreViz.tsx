"use client";
/* =====================================================================
   StoreViz — визуализациите на /magazin: три компактни „живи” мокъпа,
   които показват какво купува човек, вместо само да го четe.
   - AgentChatViz: агент отговаря на клиент (чат балони, изписват се)
   - LevelsViz: стълбата на CRM нивата (запълващи се сегменти)
   - DashboardViz: мини дашборд с растящи барове и брояч
   ===================================================================== */

export function AgentChatViz() {
  const MSGS = [
    { who: "client", text: "Здравейте, имате ли доставка до Варна?" },
    { who: "agent", text: "Здравейте! Да — 1-2 работни дни с Speedy. За поръчка днес до 16:00 тръгва още утре. 📦" },
    { who: "client", text: "Супер, а мога ли с наложен платеж?" },
    { who: "agent", text: "Разбира се. Оставете телефон и завършвам поръчката ви за 30 секунди." },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(5,8,14,0.85)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-slate-400">AI агентът · чат на живо</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> отговор за 8 сек
        </span>
      </div>
      <div className="space-y-2.5">
        {MSGS.map((m, i) => (
          <div
            key={i}
            className={`sv-msg max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
              m.who === "agent"
                ? "ml-auto rounded-br-md bg-[linear-gradient(135deg,rgba(34,211,238,0.2),rgba(124,58,237,0.2))] text-slate-100"
                : "rounded-bl-md bg-white/[0.06] text-slate-300"
            }`}
            style={{ animationDelay: `${0.3 + i * 0.7}s` }}
          >
            {m.text}
          </div>
        ))}
      </div>
      <style>{`
        .sv-msg { animation: svPop 0.45s cubic-bezier(.22,1,.36,1) both; }
        @keyframes svPop { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .sv-msg { animation: none; } }
      `}</style>
    </div>
  );
}

export function LevelsViz() {
  const LEVELS = [
    { label: "Ниво 1 · CRM", color: "#22d3ee", w: "40%" },
    { label: "Ниво 2 · + AI Автопилот", color: "#a78bfa", w: "68%" },
    { label: "Ниво 3 · + Реклами", color: "#fbbf24", w: "86%" },
    { label: "Всичко · + Уебсайт", color: "#34d399", w: "100%" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(5,8,14,0.85)] p-5">
      <p className="mb-4 font-mono text-xs text-slate-400">Нивата · всяко надгражда предишното</p>
      <div className="space-y-3.5">
        {LEVELS.map((l, i) => (
          <div key={l.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">{l.label}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="sv-bar h-full rounded-full"
                style={{
                  width: l.w,
                  background: `linear-gradient(90deg, ${l.color}66, ${l.color})`,
                  boxShadow: `0 0 12px ${l.color}55`,
                  animationDelay: `${i * 0.25}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .sv-bar { animation: svFill 1.1s cubic-bezier(.22,1,.36,1) both; transform-origin: left; }
        @keyframes svFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .sv-bar { animation: none; } }
      `}</style>
    </div>
  );
}

export function DashboardViz() {
  const BARS = [34, 48, 42, 60, 55, 74, 68, 88];
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(5,8,14,0.85)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-slate-400">Твоят дашборд · седмица по седмица</span>
        <span className="font-mono text-xs font-bold text-emerald-300">↑ на автопилот</span>
      </div>
      <div className="flex h-[92px] items-end gap-2">
        {BARS.map((h, i) => (
          <div
            key={i}
            className="sv-dash flex-1 rounded-t-md"
            style={{
              height: `${h}%`,
              background: "linear-gradient(to top, rgba(34,211,238,0.35), rgba(52,211,153,0.9))",
              boxShadow: "0 0 14px rgba(52,211,153,0.25)",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["Лийдове", "+214%"],
          ["Отговор", "8 сек"],
          ["Ръчна работа", "−80%"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-white/[0.04] px-2 py-1.5">
            <p className="font-mono text-[13px] font-bold text-white">{v}</p>
            <p className="text-[10px] text-slate-500">{k}</p>
          </div>
        ))}
      </div>
      <style>{`
        .sv-dash { animation: svRise 0.8s cubic-bezier(.22,1,.36,1) both; transform-origin: bottom; }
        @keyframes svRise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @media (prefers-reduced-motion: reduce) { .sv-dash { animation: none; } }
      `}</style>
    </div>
  );
}
