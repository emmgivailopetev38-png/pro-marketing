/* =====================================================================
   PosterArt — „роботът в залата“: гледаме публиката откъм екрана.
   Роботът седи в средния ред с кофа пуканки, светлината на екрана трепти
   по визьора, а лъчът на прожектора идва от будката отзад. Чист SVG,
   без JS и без снимки — до готовия кадър от снимките (Ф1) стои това.
   ⚠ Когато има истински плакат — сложи го на негово място (KINO.poster).
   ===================================================================== */

export function PosterArt({ id = "pa", className, label = "Роботът в кино залата, с кофа пуканки" }: { id?: string; className?: string; label?: string }) {
  const g = (n: string) => `${id}-${n}`;
  const u = (n: string) => `url(#${g(n)})`;
  // Глави в залата — x, y, r (силуети, гледат към екрана, т.е. към нас).
  const heads: Array<[number, number, number]> = [
    [250, 520, 38],
    [420, 500, 40],
    [1180, 500, 40],
    [1350, 520, 38],
    [330, 640, 46],
    [1270, 640, 46],
    [560, 650, 44],
  ];
  const puffs: Array<[number, number, number, string]> = [
    [1012, 560, 17, "#fff6dc"],
    [1040, 548, 15, "#fde68a"],
    [1068, 556, 16, "#fff6dc"],
    [1094, 548, 14, "#fff1c4"],
    [1120, 560, 15, "#fde68a"],
    [1026, 532, 14, "#fff1c4"],
    [1056, 528, 16, "#fff6dc"],
    [1086, 530, 13, "#fde68a"],
    [1110, 538, 13, "#fff6dc"],
    [1070, 512, 12, "#fff1c4"],
  ];
  return (
    <svg viewBox="0 0 1600 900" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={g("bg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120f2a" />
          <stop offset="0.55" stopColor="#090816" />
          <stop offset="1" stopColor="#040409" />
        </linearGradient>
        <radialGradient id={g("screenlight")} cx="50%" cy="0%" r="85%">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#a855f7" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g("beam")} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0" stopColor="#fff7e6" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#c4b5fd" stopOpacity="0.18" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g("wave")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="0.2" stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="0.85" stopColor="#ec4899" />
          <stop offset="1" stopColor="#ec4899" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g("metal")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2d4a" />
          <stop offset="1" stopColor="#0d0e1c" />
        </linearGradient>
        <linearGradient id={g("rim")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67e8f9" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f472b6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={g("visor")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0891b2" />
          <stop offset="0.5" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id={g("seat")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24133a" />
          <stop offset="1" stopColor="#0c0715" />
        </linearGradient>
        <pattern id={g("stripes")} width="34" height="10" patternUnits="userSpaceOnUse">
          <rect width="17" height="10" fill="#f8f5ff" />
          <rect x="17" width="17" height="10" fill="#ec4899" />
        </pattern>
        <filter id={g("glow")} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={g("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      <rect width="1600" height="900" fill={u("bg")} />
      <rect width="1600" height="900" fill={u("screenlight")} />

      {/* будката на прожектора и лъчът към екрана (към нас) */}
      <g filter={u("soft")}>
        <polygon points="800,250 -60,-40 1660,-40" fill={u("beam")} opacity="0.75" />
      </g>
      <polygon points="800,250 380,-20 1220,-20" fill={u("beam")} opacity="0.35" />
      <rect x="770" y="236" width="60" height="30" rx="6" fill="#fff7e6" opacity="0.9" filter={u("glow")} />
      {Array.from({ length: 26 }).map((_, i) => {
        const x = 520 + ((i * 97) % 560);
        const y = 40 + ((i * 53) % 190);
        return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.4} fill="#fff7e6" opacity={0.25 + (i % 5) * 0.08} />;
      })}

      {/* вълната от светлина */}
      <path
        d="M-20 330 C 220 270, 420 390, 640 320 S 1040 250, 1260 320 S 1520 380, 1640 300"
        fill="none"
        stroke={u("wave")}
        strokeWidth="5"
        strokeLinecap="round"
        filter={u("glow")}
        opacity="0.9"
      />
      <path
        d="M-20 360 C 240 310, 440 410, 660 350 S 1060 290, 1280 350 S 1520 400, 1640 340"
        fill="none"
        stroke={u("wave")}
        strokeWidth="1.6"
        opacity="0.55"
      />

      {/* задният ред: облегалки и глави */}
      {[180, 350, 1110, 1280].map((x, i) => (
        <rect key={`s1-${i}`} x={x} y={540} width="150" height="150" rx="34" fill={u("seat")} opacity="0.9" />
      ))}
      {heads.slice(0, 4).map(([x, y, r], i) => (
        <g key={`h1-${i}`} opacity="0.92">
          <circle cx={x} cy={y} r={r} fill="#0a0812" />
          <path d={`M${x - r - 22} ${y + r + 70} Q ${x} ${y + r - 10} ${x + r + 22} ${y + r + 70} Z`} fill="#0a0812" />
          <circle cx={x} cy={y} r={r} fill="none" stroke="#7c3aed" strokeOpacity="0.35" strokeWidth="2" />
        </g>
      ))}

      {/* роботът */}
      <g>
        {/* облегалката му */}
        <rect x="660" y="455" width="280" height="300" rx="56" fill={u("seat")} />
        {/* антена */}
        <line x1="800" y1="330" x2="800" y2="372" stroke="#3b3f63" strokeWidth="6" strokeLinecap="round" />
        <circle cx="800" cy="324" r="10" fill="#ec4899" filter={u("glow")} />
        {/* глава */}
        <rect x="712" y="368" width="176" height="150" rx="52" fill={u("metal")} />
        <rect x="712" y="368" width="176" height="150" rx="52" fill="none" stroke={u("rim")} strokeWidth="3" />
        {/* визьорът — екранът свети в него */}
        <rect x="732" y="412" width="136" height="52" rx="26" fill="#05060f" />
        <rect x="738" y="418" width="124" height="40" rx="20" fill={u("visor")} filter={u("glow")} opacity="0.95" />
        <ellipse cx="772" cy="438" rx="10" ry="8" fill="#ecfeff" />
        <ellipse cx="828" cy="438" rx="10" ry="8" fill="#ecfeff" />
        <path d="M786 482 Q 800 492 814 482" stroke="#67e8f9" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* врат и рамене */}
        <rect x="778" y="514" width="44" height="26" rx="8" fill="#1a1c33" />
        <path d="M676 700 C 676 600 704 548 800 540 C 896 548 924 600 924 700 Z" fill={u("metal")} />
        <path d="M676 700 C 676 600 704 548 800 540 C 896 548 924 600 924 700" fill="none" stroke={u("rim")} strokeWidth="2.5" />
        <circle cx="800" cy="612" r="13" fill="#22d3ee" filter={u("glow")} opacity="0.9" />
        {/* ръката, която държи кофата */}
        <path d="M906 610 C 950 630 990 640 1010 646" stroke="#2a2d4a" strokeWidth="26" strokeLinecap="round" fill="none" />
        {/* кофата с пуканки */}
        <path d="M996 576 L1144 576 L1126 704 L1014 704 Z" fill={u("stripes")} />
        <path d="M996 576 L1144 576 L1126 704 L1014 704 Z" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
        <rect x="990" y="568" width="160" height="14" rx="7" fill="#f8f5ff" />
        {puffs.map(([x, y, r, c], i) => (
          <circle key={`p-${i}`} cx={x} cy={y} r={r} fill={c} />
        ))}
        {/* една пуканка лети */}
        <circle cx="1188" cy="470" r="11" fill="#fff1c4" />
        <circle cx="1196" cy="462" r="7" fill="#fde68a" />
      </g>

      {/* предният ред — най-близо до екрана, тъмни силуети */}
      {heads.slice(4).map(([x, y, r], i) => (
        <g key={`h2-${i}`}>
          <circle cx={x} cy={y} r={r} fill="#06050b" />
          <path d={`M${x - r - 30} ${y + r + 120} Q ${x} ${y + r - 14} ${x + r + 30} ${y + r + 120} Z`} fill="#06050b" />
        </g>
      ))}
      {[90, 420, 700, 990, 1180].map((x, i) => (
        <rect key={`s2-${i}`} x={x} y={760} width="230" height="200" rx="44" fill="#08060f" />
      ))}
      <rect x="0" y="840" width="1600" height="60" fill="#040409" />
    </svg>
  );
}
