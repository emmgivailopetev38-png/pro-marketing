/**
 * Знакът на марката: „P“, чийто търбух е пробит от стрелка нагоре, и три
 * растящи стълба до нея — избраното лого от 23.09.2026.
 *
 * Чист SVG, за да е остър на favicon и на 4K, и с истинска дупка (маска) на
 * мястото на стрелката: върху тъмния фон на сайта, върху бялото на Viber или
 * върху снимка се вижда каквото е отзад, а не парче черно.
 *
 * `id` прави градиентите уникални, когато на страницата има повече от един
 * знак (лентата горе и подписът долу) — иначе два еднакви id-та в един
 * документ са невалиден SVG.
 */
export function PmMark({ className, id = "pm", title }: { className?: string; id?: string; title?: string }) {
  const grad = `${id}-grad`;
  const hole = `${id}-hole`;
  return (
    <svg
      viewBox="223 199 620 620"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={grad} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <mask id={hole}>
          {/* бялото остава, черното се изрязва — стрелката е дупка, не боя */}
          <rect x="0" y="0" width="1024" height="1024" fill="#fff" />
          <path d="M556 540 V416 h-58 l96 -122 96 122 h-58 v124 z" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${hole})`} transform="translate(-30,-10)">
        <rect x="318" y="246" width="132" height="546" rx="26" fill={`url(#${grad})`} />
        <path d="M450 246 H628 a178 178 0 0 1 0 356 H450 z" fill={`url(#${grad})`} />
      </g>
      <g>
        <rect x="640" y="668" width="34" height="112" rx="17" fill="#22d3ee" />
        <rect x="692" y="614" width="34" height="166" rx="17" fill="#8b5cf6" />
        <rect x="744" y="544" width="34" height="236" rx="17" fill="#ec4899" />
      </g>
    </svg>
  );
}
