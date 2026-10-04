/* =====================================================================
   RobotSilhouette — хуманоиден силует в контражур: виждат се само
   ръбовете, визьорът и светлината в гърдите. Нарочно не е снимка —
   роботът още е „под покривалото" и това е цялата интрига.
   Чист SVG + CSS (без JS); при prefers-reduced-motion стои неподвижен.
   ===================================================================== */

export function RobotSilhouette({ id = "rs", className }: { id?: string; className?: string }) {
  const g = (name: string) => `${id}-${name}`;
  return (
    <svg
      viewBox="0 0 320 400"
      className={className}
      role="img"
      aria-label="Силует на хуманоиден робот — скоро"
    >
      <defs>
        <radialGradient id={g("back")} cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#7c3aed" stopOpacity="0.16" />
          <stop offset="1" stopColor="#04060d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g("body")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1830" />
          <stop offset="1" stopColor="#04060d" />
        </linearGradient>
        <linearGradient id={g("rim")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#22d3ee" stopOpacity="0.08" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={g("visor")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0891b2" />
          <stop offset="0.5" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={g("scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#67e8f9" stopOpacity="0" />
          <stop offset="0.5" stopColor="#67e8f9" stopOpacity="0.55" />
          <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
        </linearGradient>
        <filter id={g("glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={g("shape")}>
          <path d={HEAD} />
          <rect x="140" y="178" width="40" height="40" rx="6" />
          <path d={TORSO} />
        </clipPath>
      </defs>

      <rect width="320" height="400" fill={`url(#${g("back")})`} />

      {/* Тялото: тъмно, с контражур по ръба */}
      <g fill={`url(#${g("body")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.6">
        <path d={TORSO} />
        <rect x="140" y="178" width="40" height="40" rx="6" />
        <path d={HEAD} />
      </g>

      {/* Детайли — едва видими, колкото да се усети машина */}
      <g fill="none" stroke="#22d3ee" strokeOpacity="0.18" strokeWidth="1">
        <path d="M144 192h32M144 202h32" />
        <path d="M96 268c20 18 40 26 64 26s44-8 64-26" />
        <path d="M118 330h84M160 300v100" />
        <path d="M112 84c14-18 30-26 48-26s34 8 48 26" />
      </g>

      {/* Визьорът и „погледът", който обикаля */}
      <rect x="110" y="104" width="100" height="24" rx="12" fill="#03050b" />
      <rect x="114" y="108" width="92" height="16" rx="8" fill={`url(#${g("visor")})`} opacity="0.85" filter={`url(#${g("glow")})`} />
      <g className="rs-eye">
        <circle cx="132" cy="116" r="5" fill="#ecfeff" filter={`url(#${g("glow")})`} />
      </g>

      {/* Ядрото в гърдите — пулсира */}
      <circle className="rs-core" cx="160" cy="318" r="9" fill="#22d3ee" filter={`url(#${g("glow")})`} />
      <circle cx="160" cy="318" r="18" fill="none" stroke="#22d3ee" strokeOpacity="0.35" />

      {/* Сканиращата линия минава само по силуета */}
      <g clipPath={`url(#${g("shape")})`}>
        <rect className="rs-scan" x="0" y="-60" width="320" height="60" fill={`url(#${g("scan")})`} />
      </g>

      <style>{`
        .rs-eye { animation: rs-look 6s ease-in-out infinite; transform-box: view-box; }
        .rs-core { animation: rs-pulse 2.4s ease-in-out infinite; transform-origin: 160px 318px; transform-box: view-box; }
        .rs-scan { animation: rs-scan 4.8s linear infinite; transform-box: view-box; }
        @keyframes rs-look { 0%, 12% { transform: translateX(0); } 40%, 55% { transform: translateX(56px); } 80%, 100% { transform: translateX(0); } }
        @keyframes rs-pulse { 0%, 100% { opacity: 0.55; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.12); } }
        @keyframes rs-scan { 0% { transform: translateY(0); } 100% { transform: translateY(460px); } }
        @media (prefers-reduced-motion: reduce) {
          .rs-eye, .rs-core, .rs-scan { animation: none; }
          .rs-scan { opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

const HEAD =
  "M160 40c-40 0-66 28-66 68v26c0 30 22 52 50 56h32c28-4 50-26 50-56v-26c0-40-26-68-66-68z";
const TORSO =
  "M132 214c-30 6-58 18-76 34-18 16-26 40-30 70l-8 82h284l-8-82c-4-30-12-54-30-70-18-16-46-28-76-34z";
