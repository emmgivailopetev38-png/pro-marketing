"use client";
/* =====================================================================
   RobotTeaserV2 — „Поръчай робот · скоро" на началната страница.
   Тийзър, не продукт: силует в контражур, три неща, които роботът ще
   прави, и един бутон — към /robot, където човек се записва първи.
   Стои веднага след Jarvis: асистентът от бъдещето → и тяло за него.
   ===================================================================== */
import { ArrowRight } from "lucide-react";
import { RobotSilhouette } from "@/components/robot/RobotSilhouette";
import { track } from "@/lib/analytics/track";

const CAN = ["Върши физическа работа", "Носи и подрежда", "Говори на български", "Приема запитвания"];

export function RobotTeaserV2() {
  return (
    <section className="v2-section !pt-6" aria-label="Поръчай робот — скоро">
      <div className="v2-wrap">
        <div
          className="v2-glass v2-glow is-always relative grid items-center gap-6 overflow-hidden p-6 md:grid-cols-[1.25fr_1fr] md:gap-10 md:p-10"
          style={{ ["--v2-c" as string]: "var(--v2-violet)" }}
        >
          <div className="relative z-[1] order-2 md:order-1">
            <p className="v2-eyebrow">{"// Скоро"}</p>
            <h2 className="v2-title-plain !text-[clamp(1.7rem,4vw,2.9rem)]">
              Поръчай робот-работник, който <span className="v2-grad">говори български</span>
            </h2>
            <p className="v2-sub">
              Хуманоиден робот с нашия AI — ще върши физическа работа и ще разговаря с хората на техния
              език. Работник, не украса. Поръчките се отварят скоро.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Какво ще прави">
              {CAN.map((c) => (
                <li
                  key={c}
                  className="v2-mono rounded-full px-3 py-1.5 text-[12px]"
                  style={{ border: "1px solid var(--v2-line)", color: "var(--v2-muted)", background: "rgba(4, 6, 13, 0.5)" }}
                >
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="/robot"
                onClick={() => track("cta_clicked", { location: "robot_teaser", target: "/robot" })}
                className="v2-btn v2-btn-primary"
              >
                Запиши се първи
                <ArrowRight className="h-4 w-4" />
              </a>
              <span className="text-sm" style={{ color: "var(--v2-faint)" }}>
                Първите в списъка научават всичко първи.
              </span>
            </div>
          </div>

          <div className="relative order-1 mx-auto w-full max-w-[260px] md:order-2 md:max-w-[340px]">
            <RobotSilhouette id="rt" className="block h-auto w-full" />
            <span
              className="v2-mono absolute left-1/2 top-0 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.3em]"
              style={{
                border: "1px solid var(--v2-line-bright)",
                color: "var(--v2-cyan)",
                background: "rgba(4, 6, 13, 0.72)",
                textShadow: "0 0 12px var(--v2-glow-cyan)",
              }}
            >
              Скоро
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
