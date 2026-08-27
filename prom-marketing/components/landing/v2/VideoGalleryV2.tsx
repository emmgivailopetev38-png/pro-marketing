"use client";

/* =====================================================================
   VideoGalleryV2 — „ето ме мен" секция високо в началото на страницата.

   Реални клипове с Ивайло, не стокови кадри. Целта е доверие в първите
   секунди, затова стои веднага след TrustStrip-а и носи бутона за час
   до себе си.

   Тежест: НУЛА байта видео при зареждане. Показва се само постерът
   (~25 KB); самият mp4 тръгва чак когато човек натисне play. Държи се
   един-единствен <video> елемент и му се сменя източникът.
   ===================================================================== */

import { useRef, useState } from "react";
import { Play, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/track";

type Clip = {
  slug: string;
  title: string;
  scene: string;
  len: string;
};

/* Три клипа, три различни неща. Нарочно без припокриване:
   продава · публикува · намира клиенти. */
const CLIPS: Clip[] = [
  {
    slug: "ivo-lobi-30sek",
    title: "Клиент звъни. AI вдига, отговаря и записва часа.",
    scene: "Прав, в лобито",
    len: "0:32",
  },
  {
    slug: "ivo-kolata",
    title: "Три поста на ден — казани на глас, докато шофирам.",
    scene: "От колата",
    len: "0:26",
  },
  {
    slug: "ivo-lobi-sednal",
    title: "32 нови контакта в CRM-а, намерени без мен.",
    scene: "Седнал, в лобито",
    len: "0:36",
  },
];

export function VideoGalleryV2() {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clip = CLIPS[active];

  const play = () => {
    setStarted(true);
    track("gallery_play", { clip: clip.slug });
    // изчаква рендера на src-а, преди да пусне
    window.setTimeout(() => videoRef.current?.play().catch(() => {}), 0);
  };

  const pick = (i: number) => {
    if (i === active) return;
    setActive(i);
    setStarted(true);
    track("gallery_switch", { clip: CLIPS[i].slug });
    window.setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      v.load();
      v.play().catch(() => {});
    }, 0);
  };

  return (
    <section className="v2-section" style={{ paddingBlock: "clamp(40px, 5vw, 72px)" }}>
      <div className="v2-wrap">
        <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-14">
          {/* ── Плеърът ─────────────────────────── */}
          <div className="v2-reveal mx-auto w-full max-w-[260px]" style={{ ["--d" as string]: "0.05s" }}>
            <div
              className="relative overflow-hidden rounded-[26px] border"
              style={{
                aspectRatio: "9 / 16",
                borderColor: "var(--v2-line)",
                background: "var(--v2-bg-2)",
                boxShadow: "var(--v2-shadow-card), 0 0 50px -22px var(--v2-glow-cyan)",
              }}
            >
              <video
                ref={videoRef}
                key={clip.slug}
                poster={`/videa/${clip.slug}.jpg`}
                preload="none"
                playsInline
                controls={started}
                className="h-full w-full object-cover"
              >
                <source src={`/videa/${clip.slug}.mp4`} type="video/mp4" />
              </video>

              {!started && (
                <button
                  type="button"
                  onClick={play}
                  aria-label={`Пусни: ${clip.title}`}
                  className="group absolute inset-0 flex items-center justify-center transition"
                  style={{ background: "linear-gradient(180deg, transparent 45%, rgba(4,6,13,0.72) 100%)" }}
                >
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full backdrop-blur transition group-hover:scale-105"
                    style={{
                      background: "rgba(4, 6, 13, 0.55)",
                      border: "1px solid var(--v2-line-bright)",
                      boxShadow: "0 0 30px -6px var(--v2-glow-cyan)",
                    }}
                  >
                    <Play className="h-6 w-6 translate-x-[2px]" style={{ color: "var(--v2-cyan)" }} fill="currentColor" />
                  </span>
                </button>
              )}
            </div>

            <p className="v2-mono mt-3 text-center text-[11px]" style={{ color: "var(--v2-faint)" }}>
              {clip.scene} · {clip.len}
            </p>
          </div>

          {/* ── Текст, лента, бутон ──────────────── */}
          <div className="v2-reveal flex flex-col gap-5" style={{ ["--d" as string]: "0.12s" }}>
            <div className="flex flex-col gap-3">
              <span className="v2-eyebrow">Не на думи</span>
              <h2 className="v2-title" style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.3rem)" }}>
                Ето ме мен — и ето как работи
              </h2>
              <p className="max-w-[52ch] text-[15.5px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                Три клипа, три различни неща — продава, публикува, намира клиенти.
                Заснети в движение, с реални екрани от системата. Без стокови кадри
                и без обещания, които не се виждат.
              </p>
            </div>

            {/* трите кадъра — всеки с надписа си */}
            <div className="flex flex-wrap gap-3">
              {CLIPS.map((c, i) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => pick(i)}
                  aria-current={i === active}
                  className="flex flex-1 shrink-0 basis-[150px] items-center gap-3 rounded-[12px] p-2 text-left transition"
                  style={{
                    border: i === active ? "1px solid var(--v2-cyan)" : "1px solid var(--v2-line)",
                    background: i === active ? "var(--v2-glass-2)" : "transparent",
                    boxShadow: i === active ? "0 0 20px -8px var(--v2-glow-cyan)" : "none",
                  }}
                >
                  <span
                    className="relative shrink-0 overflow-hidden rounded-[8px]"
                    style={{ width: 40, aspectRatio: "9 / 16", opacity: i === active ? 1 : 0.7 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/videa/${c.slug}.jpg`}
                      /* Описателен alt вместо празен: кадърът е и вход към
                         Google Images, а видео резултатите се класират по
                         текста около тях. */
                      alt={`Кадър от видеото: ${c.title}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className="v2-mono text-[10px] uppercase tracking-wider"
                      style={{ color: i === active ? "var(--v2-cyan)" : "var(--v2-faint)" }}
                    >
                      {c.scene}
                    </span>
                    <span
                      className="text-[12.5px] leading-snug"
                      style={{ color: i === active ? "var(--v2-ink)" : "var(--v2-muted)" }}
                    >
                      {c.len}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <p className="text-[16px] font-medium leading-snug" style={{ color: "var(--v2-ink)" }}>
              {clip.title}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a href="/booking" className="v2-btn v2-btn-primary">
                Запази час
                <ArrowRight className="v2-arrow h-4 w-4" />
              </a>
              <span className="text-[13.5px]" style={{ color: "var(--v2-faint)" }}>
                Безплатно, без ангажимент
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
