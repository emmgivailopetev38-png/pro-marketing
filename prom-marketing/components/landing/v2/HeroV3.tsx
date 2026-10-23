"use client";
/* ---------------------------------------------------------------------------
   HeroV3 — „лице, доказателство, стълба“ (23.10.2026).

   Защо е различен от HeroV2:
   - Първото нещо на екрана е Ивайло на видео, не сфера и не формуляр. Хората
     купуват от човек, когото са видели и чули. Клипът е 9:16, с плакат от
     самото видео, тръгва чак при натискане (нищо не се тегли преди това).
   - Едно обещание, един главен бутон. Вторият бутон е телефонът на гласовия
     агент: човекът звъни и агентът му записва час при Ивайло, без да чака
     никого. Третият е тих: „говори с агента от браузъра“.
   - Под бутоните стоят само неща, които са верни и се виждат на сайта:
     16 работещи системи, на български денонощно, писмена гаранция 30 дни.
   - Най-долу: лентата с браншовете на истинските клиенти (имената излизат
     чак след съгласие — виж lib/site/clients.ts).

   Ядрото (NeuralCore), частиците и AI одитът остават в HeroV2 за връщане.
--------------------------------------------------------------------------- */

import { useRef, useState } from "react";
import { Check, Phone, Play } from "lucide-react";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { HolographicText } from "@/components/effects/HolographicText";
import { openBookingPopup } from "@/lib/cal/embed";
import { track } from "@/lib/analytics/track";
import { AGENT_PHONE_DISPLAY, AGENT_PHONE_TEL } from "@/lib/site/agent-phone";
import { CLIENT_BRANCHES, CLIENT_CASES, SHOW_CLIENT_NAMES } from "@/lib/site/clients";
import { VoiceReceptionButton } from "./VoiceReceptionButton";

/* Клипът в героя. Днес е „Прав, в лобито“ (0:32) от галерията; смени slug-а,
   щом V1 (60–75 сек, по сценария) е монтиран и качен в public/videa. */
const HERO_CLIP = {
  slug: "ivo-lobi-30sek",
  len: "0:32",
  caption: "Клиент звъни. AI вдига, отговаря и записва часа.",
};

const PROOF = [
  "16 работещи системи при български бизнеси",
  "На български, денонощно",
  "30 дни гаранция или не плащаш",
];

export function HeroV3() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    track("video_play", { location: "hero_v3", clip: HERO_CLIP.slug });
    v.muted = false;
    void v.play();
    setPlaying(true);
  };

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="hidden sm:block">
        <AuroraBackground intensity="intense" />
      </div>
      {/* На телефон Aurora е изключена — лека статична дълбочина без blur. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 sm:hidden"
        style={{
          background:
            "radial-gradient(110vw 70vh at 50% 30%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(90vw 60vh at 80% 90%, rgba(34,211,238,0.16), transparent 60%), var(--color-bg-void)",
        }}
      />

      <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-32">
        {/* Ляво — обещанието */}
        <div>
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            AI автоматизация · Пловдив · цяла България
          </span>

          <h1 className="font-display text-[clamp(30px,4.6vw,54px)] font-bold leading-[1.06] tracking-tight" lang="bg">
            Телефонът ти вдига сам.
            <br />
            <span className="font-light text-[var(--color-text-secondary)]">Клиентите</span>{" "}
            <HolographicText>се записват сами.</HolographicText>
          </h1>

          <p className="mt-6 max-w-lg text-base text-[var(--color-text-secondary)] md:text-lg">
            Гласов и чат агент на български поема обажданията, записва часове и праща оферти.
            Денонощно. <span className="font-medium text-[var(--color-text-primary)]">Ти виждаш само резултата.</span>{" "}
            Гледай как става на живо.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <button
                type="button"
                onClick={() => {
                  track("cta_clicked", { location: "hero_v3", target: "booking" });
                  void openBookingPopup();
                }}
                className="group inline-flex items-center gap-3 rounded-full bg-[var(--color-accent-cyan)] px-7 py-4 text-base font-semibold text-[var(--color-bg-void)] shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:shadow-[0_0_60px_rgba(34,211,238,0.5)]"
              >
                Безплатен разговор с Ивайло
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </MagneticButton>

            {/* Телефонът на гласовия агент — той записва часа още по телефона. */}
            <a
              href={`tel:${AGENT_PHONE_TEL}`}
              onClick={() => track("cta_clicked", { location: "hero_v3", target: "agent_call" })}
              className="inline-flex items-center gap-3 rounded-full border-2 border-[var(--color-accent-cyan)]/50 bg-[var(--color-bg-glass)] px-6 py-[14px] text-base font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-accent-cyan)]"
            >
              <Phone className="h-4 w-4 text-[var(--color-accent-cyan)]" />
              <span className="flex flex-col leading-tight">
                <span>{AGENT_PHONE_DISPLAY}</span>
                <span className="font-mono text-[10px] font-normal uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  AI агентът записва час
                </span>
              </span>
            </a>
          </div>

          <div className="mt-4 text-sm">
            <VoiceReceptionButton variant="inline" />
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-secondary)]">
            {PROOF.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0 text-[var(--color-accent-cyan)]" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Дясно — Ивайло на видео */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[380px]">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-[1] rounded-[40px] opacity-70 blur-3xl"
              style={{ background: "radial-gradient(circle at 50% 60%, rgba(124,58,237,0.45), transparent 65%)" }}
            />
            <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-border-default)] bg-[var(--v2-bg-2)] shadow-[0_40px_80px_-40px_rgba(124,58,237,0.6)]">
              <video
                ref={videoRef}
                className="block aspect-[9/16] w-full object-cover"
                poster={`/videa/${HERO_CLIP.slug}.jpg`}
                preload="none"
                playsInline
                controls={playing}
                onEnded={() => setPlaying(false)}
              >
                <source src={`/videa/${HERO_CLIP.slug}.mp4`} type="video/mp4" />
              </video>

              {!playing && (
                <button
                  type="button"
                  onClick={play}
                  aria-label="Пусни видеото"
                  className="group absolute inset-0 flex flex-col justify-between p-4 text-left"
                >
                  <span className="flex items-start justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--v2-mint)]" />
                      Ивайло Петев · на живо
                    </span>
                    <span className="rounded-full bg-black/55 px-2.5 py-1.5 font-mono text-[10px] text-white/80 backdrop-blur">
                      {HERO_CLIP.len}
                    </span>
                  </span>

                  <span className="absolute left-1/2 top-1/2 flex h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--color-bg-void)] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition group-hover:scale-105">
                    <Play className="ml-1 h-7 w-7 fill-current" />
                  </span>

                  <span className="rounded-2xl bg-black/60 px-4 py-3 text-center text-sm font-medium text-white backdrop-blur">
                    „{HERO_CLIP.caption}“
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Лентата с клиентите — имена след съгласие, дотогава браншовете. */}
      <div className="relative z-[2] mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[var(--color-border-default)] pt-6">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
            Работим с
          </span>
          {(SHOW_CLIENT_NAMES ? CLIENT_CASES.map((c) => c.name) : CLIENT_BRANCHES).map((t) => (
            <span key={t} className="font-display text-sm font-semibold tracking-wide text-[var(--color-text-secondary)]">
              {t}
            </span>
          ))}
          <a href="#klienti" className="text-sm text-[var(--color-accent-cyan)] underline decoration-[var(--color-accent-cyan)]/40 underline-offset-4">
            виж какво е направено →
          </a>
        </div>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 z-[3] h-24" style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg-void))" }} />
    </section>
  );
}
