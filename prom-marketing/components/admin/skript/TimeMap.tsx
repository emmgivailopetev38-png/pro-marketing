"use client";

import type { TimeZone } from "./data";

const ZONE_COLOR: Record<TimeZone, string> = {
  past: "#f59e0b",
  now: "#94a3b8",
  badFuture: "#f43f5e",
  goodFuture: "#06b6d4",
  decision: "#a855f7",
};

/** Спирките по пътя на разговора, в реда, в който се минават. */
const STOPS: { num: string; x: number; y: number; zone: TimeZone; label: string }[] = [
  { num: "01", x: 336, y: 244, zone: "now", label: "Свързване" },
  { num: "02", x: 424, y: 244, zone: "now", label: "Текущо" },
  { num: "03", x: 196, y: 322, zone: "past", label: "Болка" },
  { num: "04", x: 100, y: 322, zone: "past", label: "Отговорност" },
  { num: "05", x: 676, y: 118, zone: "goodFuture", label: "Целта" },
  { num: "06", x: 676, y: 344, zone: "badFuture", label: "Последствия" },
  { num: "07", x: 524, y: 214, zone: "decision", label: "Резюме" },
  { num: "08", x: 856, y: 118, zone: "goodFuture", label: "Ползи" },
  { num: "09", x: 924, y: 244, zone: "decision", label: "Затваряне" },
];

export function TimeMap({
  activeZone,
  activeNum,
  onPick,
}: {
  activeZone?: TimeZone;
  activeNum?: string;
  onPick?: (num: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 980 400"
      className="h-auto w-full select-none"
      role="img"
      aria-label="Карта на разговора във времето"
    >
      <defs>
        <linearGradient id="tm-past" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#78350f" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="tm-good" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id="tm-bad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0.34" />
        </linearGradient>
        <marker id="tm-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill="#a855f7" />
        </marker>
        <marker id="tm-arrow-c" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill="#06b6d4" />
        </marker>
        <marker id="tm-arrow-a" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill="#b45309" />
        </marker>
        <marker id="tm-cut" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#f43f5e" />
        </marker>
      </defs>

      {/* ============ ЗОНИ ============ */}

      {/* хубаво бъдеще */}
      <rect x="596" y="30" width="368" height="126" rx="13" fill="url(#tm-good)" />
      <rect x="596" y="30" width="368" height="126" rx="13" fill="none" stroke="#06b6d4" strokeOpacity="0.5" />
      <text x="612" y="54" fill="#67e8f9" fontSize="13" fontWeight="700" letterSpacing="1.6">
        ХУБАВО БЪДЕЩЕ
      </text>
      <text x="612" y="72" fill="#a5f3fc" fontSize="10.5" opacity="0.78">
        неговата картина, с неговите думи · осезаема, не абстрактна
      </text>

      {/* гадно сега */}
      <rect x="286" y="168" width="212" height="118" rx="13" fill="#64748b" fillOpacity="0.13" />
      <rect x="286" y="168" width="212" height="118" rx="13" fill="none" stroke="#94a3b8" strokeOpacity="0.4" />
      <text x="300" y="192" fill="#cbd5e1" fontSize="13" fontWeight="700" letterSpacing="1.6">
        ГАДНО СЕГА
      </text>
      <text x="300" y="210" fill="#cbd5e1" fontSize="10.5" opacity="0.68">
        как работи днес
      </text>

      {/* гадно минало */}
      <rect x="20" y="246" width="252" height="132" rx="13" fill="url(#tm-past)" />
      <rect x="20" y="246" width="252" height="132" rx="13" fill="none" stroke="#b45309" strokeOpacity="0.5" />
      <text x="34" y="270" fill="#fbbf24" fontSize="13" fontWeight="700" letterSpacing="1.6">
        ГАДНО МИНАЛО
      </text>
      <text x="34" y="288" fill="#fcd34d" fontSize="10.5" opacity="0.78">
        откога го боли · кой го е причинил
      </text>

      {/* гадно бъдеще */}
      <rect x="596" y="272" width="368" height="112" rx="13" fill="url(#tm-bad)" />
      <rect x="596" y="272" width="368" height="112" rx="13" fill="none" stroke="#e11d48" strokeOpacity="0.5" />
      <text x="612" y="296" fill="#fda4af" fontSize="13" fontWeight="700" letterSpacing="1.6">
        ГАДНО БЪДЕЩЕ
      </text>
      <text x="612" y="314" fill="#fecdd3" fontSize="10.5" opacity="0.82">
        същото още 1–2 години · и клиентите двойно
      </text>

      {/* ============ ПЪТЯТ ============ */}

      <path d="M352 244 L408 244" stroke="#94a3b8" strokeWidth="2.5" fill="none" markerEnd="url(#tm-arrow)" opacity="0.85" />
      <path d="M424 260 C 396 320, 300 342, 214 326" stroke="#b45309" strokeWidth="2.5" fill="none" strokeDasharray="6 4" markerEnd="url(#tm-arrow-a)" />
      <path d="M106 306 C 190 150, 420 56, 656 108" stroke="#06b6d4" strokeWidth="2.5" fill="none" markerEnd="url(#tm-arrow-c)" />

      {/* ОТНЕМАНЕТО */}
      <path d="M676 138 L676 322" stroke="#f43f5e" strokeWidth="4" fill="none" markerEnd="url(#tm-cut)" />
      <g transform="translate(692, 214)">
        <rect x="0" y="-15" width="182" height="30" rx="8" fill="#4c0519" fillOpacity="0.95" stroke="#f43f5e" strokeOpacity="0.75" />
        <text x="11" y="5" fill="#fecdd3" fontSize="10.5" fontWeight="700" letterSpacing="0.4">
          ✂ ОТНЕМАНЕ НА БЪДЕЩЕТО
        </text>
      </g>

      <path d="M652 340 C 570 330, 528 282, 524 234" stroke="#a855f7" strokeWidth="2.5" fill="none" markerEnd="url(#tm-arrow)" />
      <path d="M540 202 C 610 150, 740 104, 836 112" stroke="#06b6d4" strokeWidth="2.5" fill="none" markerEnd="url(#tm-arrow-c)" />
      <path d="M872 132 C 916 164, 928 196, 926 224" stroke="#a855f7" strokeWidth="2.5" fill="none" markerEnd="url(#tm-arrow)" />

      {/* ============ СПИРКИТЕ ============ */}
      {STOPS.map((s) => {
        const on = activeNum === s.num || (!activeNum && activeZone === s.zone);
        const c = ZONE_COLOR[s.zone];
        return (
          <g
            key={s.num}
            transform={`translate(${s.x}, ${s.y})`}
            onClick={() => onPick?.(s.num)}
            style={{ cursor: onPick ? "pointer" : "default" }}
          >
            {on && <circle r="22" fill={c} fillOpacity="0.3" />}
            <circle r="15" fill="#05050e" stroke={c} strokeWidth={on ? 3 : 2} />
            <text
              textAnchor="middle"
              y="4.5"
              fontSize="11.5"
              fontWeight="700"
              fill={on ? "#ffffff" : c}
              fontFamily="ui-monospace, monospace"
            >
              {s.num}
            </text>
            <text
              textAnchor="middle"
              y="31"
              fontSize="10"
              fill={on ? "#f5f7ff" : "#9aa4bd"}
              fontWeight={on ? 700 : 400}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
