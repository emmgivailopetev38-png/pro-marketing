"use client";
// Сцена за всеки етап: къде стои клиентът, каква му е позата, какво мисли
// и накъде го местиш. Всичко е рисувано на място със SVG — без картинки.

import { STAGES } from "./data";

type Pose =
  | "calm"
  | "guarded"
  | "talking"
  | "thinking"
  | "heavy"
  | "lifted"
  | "dropped"
  | "nodding"
  | "decided"
  | "absent";

type Scene = {
  zoneTint: string;
  zoneSoft: string;
  /** напрежението в стаята, 0–100 */
  tension: number;
  tensionLabel: string;
  clientPose: Pose;
  clientX: number;
  clientY: number;
  /** накъде го местиш на този етап */
  move: string;
  /** реквизитът, който обяснява сцената */
  prop: "search" | "wall" | "gears" | "calc" | "mirror" | "horizon" | "cliff" | "echo" | "bridge" | "deal";
  /** накъде тръгва — силует на целта + дъга дотам */
  ghost: { x: number; y: number; pose: Pose; note: string } | null;
  /** голямата дума на фона — коя зона е */
  zoneWord: string;
  caption: string;
};

const SCENES: Record<string, Scene> = {
  "00": {
    zoneTint: "#94a3b8", zoneSoft: "rgba(148,163,184,0.14)",
    tension: 10, tensionLabel: "още няма стая",
    clientPose: "absent", clientX: 690, clientY: 300,
    move: "Никъде — още не е влязъл. Ти се готвиш.",
    prop: "search",
    ghost: null, zoneWord: "ПОДГОТОВКА",
    caption: "Ти знаеш три неща за него, които той не подозира, че знаеш. Нито едно не излиза сега.",
  },
  "01": {
    zoneTint: "#94a3b8", zoneSoft: "rgba(148,163,184,0.14)",
    tension: 45, tensionLabel: "държи гарда",
    clientPose: "guarded", clientX: 600, clientY: 300,
    move: "От „поредният продавач“ към „този слуша“.",
    prop: "wall",
    ghost: { x: 494, y: 300, pose: "talking", note: "сваля гарда" }, zoneWord: "ГАДНО СЕГА",
    caption: "Между вас има стена. Тя не се разбива — сваля се, като питаш вместо да говориш.",
  },
  "02": {
    zoneTint: "#94a3b8", zoneSoft: "rgba(148,163,184,0.14)",
    tension: 28, tensionLabel: "отпусна се",
    clientPose: "talking", clientX: 580, clientY: 300,
    move: "Разказва процеса си. Ти броиш дупките.",
    prop: "gears",
    ghost: { x: 470, y: 300, pose: "thinking", note: "почва да мисли" }, zoneWord: "ГАДНО СЕГА",
    caption: "Липсващите стъпки не могат да бъдат разказани. Точно там е дупката.",
  },
  "03": {
    zoneTint: "#f59e0b", zoneSoft: "rgba(245,158,11,0.16)",
    tension: 72, tensionLabel: "заболя го",
    clientPose: "thinking", clientX: 596, clientY: 300,
    move: "Назад в миналото — колко му е взело досега.",
    prop: "calc",
    ghost: { x: 700, y: 306, pose: "heavy", note: "тежестта на числото" }, zoneWord: "ГАДНО МИНАЛО",
    caption: "Числото излиза от неговата уста. Твоето е статистика, неговото е присъда.",
  },
  "04": {
    zoneTint: "#f59e0b", zoneSoft: "rgba(245,158,11,0.16)",
    tension: 88, tensionLabel: "най-неудобната минута",
    clientPose: "heavy", clientX: 604, clientY: 300,
    move: "От „пазарът е виновен“ към „аз съм причината“.",
    prop: "mirror",
    ghost: { x: 690, y: 302, pose: "heavy", note: "поема причината" }, zoneWord: "ГАДНО МИНАЛО",
    caption: "Докато причината е навън, продукт не му трябва — трябва му друг пазар.",
  },
  "05": {
    zoneTint: "#22d3ee", zoneSoft: "rgba(34,211,238,0.16)",
    tension: 34, tensionLabel: "видя изход",
    clientPose: "lifted", clientX: 580, clientY: 288,
    move: "Нагоре — в бъдещето, което сам описва.",
    prop: "horizon",
    ghost: { x: 706, y: 244, pose: "lifted", note: "неговото бъдеще" }, zoneWord: "ХУБАВО БЪДЕЩЕ",
    caption: "Картината е негова, с негови думи. „Повече свобода“ не е картина.",
  },
  "06": {
    zoneTint: "#f43f5e", zoneSoft: "rgba(244,63,94,0.16)",
    tension: 96, tensionLabel: "тук се ражда решението",
    clientPose: "dropped", clientX: 616, clientY: 300,
    move: "Отнемаш му картината и му показваш другата.",
    prop: "cliff",
    ghost: { x: 700, y: 348, pose: "dropped", note: "същото, само по-зле" }, zoneWord: "ГАДНО БЪДЕЩЕ",
    caption: "Единственото място, където се говори за бъдеще без промяна. Минава се бавно.",
  },
  "07": {
    zoneTint: "#a855f7", zoneSoft: "rgba(168,85,247,0.16)",
    tension: 40, tensionLabel: "усеща се разбран",
    clientPose: "nodding", clientX: 588, clientY: 300,
    move: "От напрежение към доверие. Ролите се обръщат.",
    prop: "echo",
    ghost: { x: 668, y: 300, pose: "nodding", note: "вече ти вярва" }, zoneWord: "РЕШЕНИЕТО",
    caption: "Връщаш му собствените думи. Перифразата е спорна, цитатът — не.",
  },
  "08": {
    zoneTint: "#22d3ee", zoneSoft: "rgba(34,211,238,0.16)",
    tension: 30, tensionLabel: "вече слуша с интерес",
    clientPose: "lifted", clientX: 572, clientY: 292,
    move: "Показваш моста до неговата картина.",
    prop: "bridge",
    ghost: { x: 690, y: 250, pose: "lifted", note: "картината, но с план" }, zoneWord: "ХУБАВО БЪДЕЩЕ",
    caption: "Три изречения. Всяко четвърто те връща в режим на обясняване.",
  },
  "09": {
    zoneTint: "#a855f7", zoneSoft: "rgba(168,85,247,0.16)",
    tension: 52, tensionLabel: "мълчанието след цената",
    clientPose: "decided", clientX: 556, clientY: 300,
    move: "От решение към ден и час в календара.",
    prop: "deal",
    ghost: { x: 700, y: 300, pose: "decided", note: "ден и час" }, zoneWord: "РЕШЕНИЕТО",
    caption: "Който заговори пръв след цената, отстъпва. Това няма да си ти.",
  },
};

/* ---------------- фигурата ---------------- */

function Figure({
  x,
  y,
  pose,
  color,
  label,
  faded,
}: {
  x: number;
  y: number;
  pose: Pose;
  color: string;
  label: string;
  faded?: boolean;
}) {
  // геометрия: ходилата са в (x, y), височина ~118
  const headR = 16;
  const lean = pose === "heavy" ? 7 : pose === "dropped" ? -9 : pose === "lifted" ? -3 : 0;
  const headDy = pose === "heavy" ? 8 : pose === "lifted" ? -4 : pose === "nodding" ? 4 : 0;
  const hy = y - 100 + headDy;
  const shoulder = y - 80 + headDy * 0.4;
  const hip = y - 38;

  let arms = "";
  switch (pose) {
    case "guarded": // ръце кръстосани
      arms = `M${x - 20},${shoulder + 8} L${x + 16},${shoulder + 22} M${x + 20},${shoulder + 8} L${x - 16},${shoulder + 22}`;
      break;
    case "talking": // една ръка отворена настрани
      arms = `M${x - 18},${shoulder + 6} L${x - 40},${shoulder + 26} M${x + 18},${shoulder + 6} L${x + 44},${shoulder - 6}`;
      break;
    case "thinking": // ръка към брадичката
      arms = `M${x - 18},${shoulder + 6} L${x - 30},${shoulder + 28} M${x + 18},${shoulder + 6} L${x + 26},${shoulder + 20} L${x + 8},${hy + 12}`;
      break;
    case "heavy": // рамене надолу, ръце висят
      arms = `M${x - 19},${shoulder + 10} L${x - 24},${shoulder + 38} M${x + 19},${shoulder + 10} L${x + 24},${shoulder + 38}`;
      break;
    case "lifted": // ръце леко отворени напред
      arms = `M${x - 18},${shoulder + 6} L${x - 40},${shoulder + 12} M${x + 18},${shoulder + 6} L${x + 40},${shoulder + 12}`;
      break;
    case "dropped": // ръце за баланс, тялото назад
      arms = `M${x - 18},${shoulder + 6} L${x - 46},${shoulder - 12} M${x + 18},${shoulder + 6} L${x + 46},${shoulder - 12}`;
      break;
    case "nodding":
      arms = `M${x - 18},${shoulder + 8} L${x - 26},${shoulder + 32} M${x + 18},${shoulder + 8} L${x + 26},${shoulder + 32}`;
      break;
    case "decided": // подадена ръка напред
      arms = `M${x - 18},${shoulder + 8} L${x - 26},${shoulder + 32} M${x + 18},${shoulder + 6} L${x - 34},${shoulder + 4}`;
      break;
    case "calm":
      arms = `M${x - 18},${shoulder + 8} L${x - 28},${shoulder + 30} M${x + 18},${shoulder + 8} L${x + 30},${shoulder + 26}`;
      break;
    default:
      arms = `M${x - 18},${shoulder + 8} L${x - 26},${shoulder + 30} M${x + 18},${shoulder + 8} L${x + 26},${shoulder + 30}`;
  }

  return (
    <g opacity={faded ? 0.28 : 1}>
      <g transform={`rotate(${lean} ${x} ${y})`}>
        {/* тяло */}
        <path
          d={`M${x - 19},${shoulder} Q${x},${shoulder - 9} ${x + 19},${shoulder} L${x + 15},${hip} L${x - 15},${hip} Z`}
          fill={color}
          fillOpacity="0.22"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* глава */}
        <circle cx={x} cy={hy} r={headR} fill="#05050e" stroke={color} strokeWidth="2.4" />
        {/* ръце */}
        <path d={arms} stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* крака */}
        <path
          d={`M${x - 8},${hip} L${x - 13},${y} M${x + 8},${hip} L${x + 13},${y}`}
          stroke={color}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="1.2"
        fill={color}
        opacity="0.85"
      >
        {label}
      </text>
    </g>
  );
}

/* ---------------- реквизитът ---------------- */

function Prop({ kind, tint }: { kind: Scene["prop"]; tint: string }) {
  switch (kind) {
    case "search":
      return (
        <g opacity="0.9">
          <rect x="300" y="196" width="120" height="86" rx="6" fill="#0b0b1c" stroke={tint} strokeWidth="1.6" />
          {[212, 228, 244, 260].map((y, i) => (
            <line key={y} x1="314" y1={y} x2={i % 2 ? 386 : 404} y2={y} stroke={tint} strokeWidth="2" opacity="0.5" />
          ))}
          <circle cx="404" cy="208" r="22" fill="none" stroke={tint} strokeWidth="2.6" />
          <line x1="420" y1="224" x2="440" y2="246" stroke={tint} strokeWidth="3" strokeLinecap="round" />
          <text x="360" y="172" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            3 факта · 2 хипотези
          </text>
        </g>
      );
    case "wall":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={432 + (r % 2 ? 14 : 0) + c * 30}
                y={186 + r * 24}
                width="26"
                height="20"
                rx="3"
                fill={tint}
                fillOpacity="0.13"
                stroke={tint}
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />
            )),
          )}
          <text x="472" y="172" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700" opacity="0.8">
            гардът
          </text>
        </g>
      );
    case "gears":
      return (
        <g opacity="0.85">
          {[
            { cx: 400, cy: 220, r: 26 },
            { cx: 452, cy: 246, r: 18 },
            { cx: 492, cy: 214, r: 13 },
          ].map((g, i) => (
            <g key={i}>
              <circle cx={g.cx} cy={g.cy} r={g.r} fill="none" stroke={tint} strokeWidth="2.2" />
              <circle cx={g.cx} cy={g.cy} r={g.r * 0.42} fill="none" stroke={tint} strokeWidth="1.6" opacity="0.6" />
            </g>
          ))}
          <path d="M492 214 L520 214" stroke="#f43f5e" strokeWidth="2.4" strokeDasharray="4 4" />
          <circle cx="528" cy="214" r="7" fill="none" stroke="#f43f5e" strokeWidth="2.2" strokeDasharray="3 3" />
          <text x="446" y="176" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            процесът му — с една липсваща брънка
          </text>
        </g>
      );
    case "calc":
      return (
        <g>
          <rect x="392" y="192" width="86" height="106" rx="8" fill="#0b0b1c" stroke={tint} strokeWidth="2" />
          <rect x="402" y="202" width="66" height="24" rx="3" fill={tint} fillOpacity="0.18" />
          <text x="462" y="220" textAnchor="end" fontSize="15" fontWeight="700" fill={tint} fontFamily="ui-monospace, monospace">
            7,5 ч
          </text>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}-${c}`} x={402 + c * 22} y={234 + r * 20} width="16" height="14" rx="2" fill={tint} fillOpacity="0.25" />
            )),
          )}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} opacity={0.85 - i * 0.16}>
              <circle cx={506 + i * 26} cy={206 + i * 26} r="8" fill="none" stroke="#fbbf24" strokeWidth="2" />
              <text x={506 + i * 26} y={210 + i * 26} textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="700">
                лв
              </text>
            </g>
          ))}
          <text x="435" y="176" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            смятате заедно, на глас
          </text>
        </g>
      );
    case "mirror":
      return (
        <g>
          <rect x="426" y="168" width="92" height="130" rx="46" fill={tint} fillOpacity="0.08" stroke={tint} strokeWidth="2.4" />
          <path d="M448 200 q24 -18 48 0" stroke={tint} strokeWidth="1.6" fill="none" opacity="0.5" />
          <circle cx="472" cy="228" r="15" fill="none" stroke={tint} strokeWidth="1.8" opacity="0.75" />
          <path d="M457 262 q15 -12 30 0" stroke={tint} strokeWidth="1.8" fill="none" opacity="0.75" />
          <text x="472" y="152" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            огледалото
          </text>
        </g>
      );
    case "horizon":
      return (
        <g>
          <circle cx="470" cy="196" r="30" fill={tint} fillOpacity="0.2" />
          <circle cx="470" cy="196" r="30" fill="none" stroke={tint} strokeWidth="2" />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={470 + Math.cos(a) * 38}
                y1={196 + Math.sin(a) * 38}
                x2={470 + Math.cos(a) * 48}
                y2={196 + Math.sin(a) * 48}
                stroke={tint}
                strokeWidth="2"
                opacity="0.55"
              />
            );
          })}
          <path d="M356 268 L584 268" stroke={tint} strokeWidth="2" opacity="0.45" />
          <text x="470" y="292" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            неговата картина
          </text>
        </g>
      );
    case "cliff":
      return (
        <g>
          {/* отрязаното хубаво бъдеще */}
          <g opacity="0.34">
            <circle cx="424" cy="182" r="22" fill="#22d3ee" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="1.6" />
            <path d="M340 236 L470 236" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5 5" />
          </g>
          <path d="M470 148 L470 260" stroke="#f43f5e" strokeWidth="3" strokeDasharray="7 5" />
          <text x="482" y="160" fontSize="12" fill="#f43f5e" fontWeight="700">
            ✂
          </text>
          {/* пропастта */}
          <path
            d="M300 300 L360 300 L360 248 L432 248 L432 300 L500 300"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.6"
            opacity="0.75"
          />
          <path d="M360 300 L360 360 M432 300 L432 360" stroke="#f43f5e" strokeWidth="1.6" opacity="0.35" />
          <text x="396" y="336" textAnchor="middle" fontSize="10.5" fill="#fda4af" fontWeight="700">
            още 1–2 години
          </text>
        </g>
      );
    case "echo":
      return (
        <g opacity="0.9">
          {[0, 1].map((i) => (
            <g key={i}>
              <rect
                x={i ? 452 : 356}
                y={188 + i * 44}
                width="92"
                height="34"
                rx="8"
                fill={tint}
                fillOpacity="0.12"
                stroke={tint}
                strokeWidth="1.6"
              />
              <text x={(i ? 452 : 356) + 46} y={210 + i * 44} textAnchor="middle" fontSize="11" fill={tint}>
                {i ? "същите думи" : "неговите думи"}
              </text>
            </g>
          ))}
          <path d="M402 226 q26 12 48 4" stroke={tint} strokeWidth="2" fill="none" markerEnd="url(#sc-arrow)" />
          <text x="450" y="172" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            ехото
          </text>
        </g>
      );
    case "bridge":
      return (
        <g>
          <circle cx="500" cy="184" r="24" fill="#22d3ee" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="1.8" />
          <path d="M320 272 Q430 208 500 210" fill="none" stroke={tint} strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={340 + i * 34}
              y1={272 - i * 12}
              x2={340 + i * 34}
              y2={292 - i * 10}
              stroke={tint}
              strokeWidth="2"
              opacity="0.55"
            />
          ))}
          <text x="410" y="180" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            мостът: неговите думи → нашата работа → неговата картина
          </text>
        </g>
      );
    case "deal":
      return (
        <g>
          <rect x="396" y="182" width="104" height="98" rx="8" fill="#0b0b1c" stroke={tint} strokeWidth="2" />
          <rect x="396" y="182" width="104" height="22" rx="8" fill={tint} fillOpacity="0.25" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => {
              const on = r === 1 && c === 2;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={408 + c * 22}
                  y={214 + r * 22}
                  width="15"
                  height="15"
                  rx="3"
                  fill={on ? tint : tint}
                  fillOpacity={on ? 0.95 : 0.18}
                />
              );
            }),
          )}
          <text x="448" y="170" textAnchor="middle" fontSize="11" fill={tint} fontWeight="700">
            конкретен ден и час
          </text>
        </g>
      );
  }
}

/* ---------------- сцената ---------------- */

export function StageScene({ stageNum }: { stageNum: string }) {
  const sc = SCENES[stageNum];
  const stage = STAGES.find((s) => s.num === stageNum);
  if (!sc || !stage) return null;

  const think = stage.themThink;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10" style={{ background: "#05050e" }}>
      <svg viewBox="0 0 900 400" className="h-auto w-full" role="img" aria-label={`Сцена: ${stage.title}`}>
        <defs>
          <linearGradient id="sc-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sc.zoneTint} stopOpacity="0.16" />
            <stop offset="100%" stopColor={sc.zoneTint} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sc-mood" cx="60%" cy="50%">
            <stop offset="0%" stopColor={sc.zoneTint} stopOpacity="0.16" />
            <stop offset="100%" stopColor={sc.zoneTint} stopOpacity="0" />
          </radialGradient>
          <marker id="sc-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" fill={sc.zoneTint} />
          </marker>
        </defs>

        <rect width="900" height="400" fill="url(#sc-mood)" />

        {/* коя зона е — голяма дума на фона */}
        <text
          x="450"
          y="118"
          textAnchor="middle"
          fontSize="66"
          fontWeight="800"
          letterSpacing="6"
          fill={sc.zoneTint}
          opacity="0.07"
        >
          {sc.zoneWord}
        </text>

        {/* решетка на пода */}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1={60 + i * 96}
            y1="302"
            x2={-40 + i * 132}
            y2="382"
            stroke={sc.zoneTint}
            strokeOpacity="0.12"
            strokeWidth="1"
          />
        ))}
        {[302, 320, 342, 370].map((y) => (
          <line key={y} x1="0" y1={y} x2="900" y2={y} stroke={sc.zoneTint} strokeOpacity="0.12" strokeWidth="1" />
        ))}
        <rect x="0" y="302" width="900" height="98" fill="url(#sc-ground)" />
        <line x1="0" y1="302" x2="900" y2="302" stroke={sc.zoneTint} strokeOpacity="0.5" strokeWidth="1.6" />

        {/* реквизит */}
        <Prop kind={sc.prop} tint={sc.zoneTint} />

        {/* Ивайло — винаги спокоен, вляво */}
        <Figure x={150} y={300} pose="calm" color="#22d3ee" label="ТИ" />

        {/* клиентът */}
        <Figure
          x={sc.clientX}
          y={sc.clientY}
          pose={sc.clientPose}
          color={sc.zoneTint}
          label="КЛИЕНТЪТ"
          faded={sc.clientPose === "absent"}
        />

        {/* накъде отива — силует на целта и дъгата дотам */}
        {sc.ghost && (
          <g>
            <path
              d={`M${sc.clientX + 26},${sc.clientY - 62} Q${(sc.clientX + sc.ghost.x) / 2},${Math.min(sc.clientY, sc.ghost.y) - 96} ${sc.ghost.x - 26},${sc.ghost.y - 62}`}
              stroke={sc.zoneTint}
              strokeWidth="2.4"
              strokeDasharray="7 6"
              fill="none"
              markerEnd="url(#sc-arrow)"
              opacity="0.8"
            />
            <g opacity="0.34">
              <Figure
                x={sc.ghost.x}
                y={sc.ghost.y}
                pose={sc.ghost.pose}
                color={sc.zoneTint}
                label=""
              />
            </g>
            <text
              x={sc.ghost.x}
              y={sc.ghost.y + 24}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              fill={sc.zoneTint}
              opacity="0.75"
            >
              {sc.ghost.note}
            </text>
          </g>
        )}

        {/* мисълта му */}
        {sc.clientPose !== "absent" && (
          <g>
            <path
              d={`M${sc.clientX + 26},${sc.clientY - 118} q10,-10 26,-8`}
              stroke="#f0abfc"
              strokeWidth="1.6"
              fill="none"
              opacity="0.6"
            />
            <circle cx={sc.clientX + 22} cy={sc.clientY - 112} r="3.5" fill="#f0abfc" opacity="0.5" />
            <circle cx={sc.clientX + 34} cy={sc.clientY - 122} r="5" fill="#f0abfc" opacity="0.45" />
            <rect
              x={sc.clientX + 44}
              y={sc.clientY - 168}
              width="238"
              height="60"
              rx="14"
              fill="rgba(46,10,58,0.92)"
              stroke="#f0abfc"
              strokeOpacity="0.45"
            />
            <foreignObject x={sc.clientX + 54} y={sc.clientY - 160} width="218" height="46">
              <div
                style={{
                  color: "#f5d0fe",
                  fontSize: "11.5px",
                  lineHeight: 1.32,
                  fontFamily: "inherit",
                }}
              >
                {think}
              </div>
            </foreignObject>
          </g>
        )}

        {/* накъде го местиш */}
        <g>
          <rect x="24" y="24" width="330" height="52" rx="10" fill="rgba(6,8,20,0.82)" stroke={sc.zoneTint} strokeOpacity="0.4" />
          <text x="40" y="46" fontSize="9.5" letterSpacing="1.8" fontWeight="700" fill={sc.zoneTint}>
            НАКЪДЕ ГО МЕСТИШ
          </text>
          <foreignObject x="38" y="50" width="306" height="24">
            <div style={{ color: "#e7edea", fontSize: "12px", lineHeight: 1.25, fontFamily: "inherit" }}>
              {sc.move}
            </div>
          </foreignObject>
        </g>

        {/* напрежението в стаята */}
        <g>
          <text x="876" y="42" textAnchor="end" fontSize="9.5" letterSpacing="1.6" fontWeight="700" fill="#8891ad">
            НАПРЕЖЕНИЕ · {sc.tensionLabel.toUpperCase()}
          </text>
          <rect x="616" y="52" width="260" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.08" />
          <rect
            x="616"
            y="52"
            width={(260 * sc.tension) / 100}
            height="9"
            rx="4.5"
            fill={sc.tension > 80 ? "#f43f5e" : sc.tension > 55 ? "#f59e0b" : "#22d3ee"}
          />
        </g>
      </svg>

      <p className="border-t border-white/8 px-4 py-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        {sc.caption}
      </p>
    </div>
  );
}
