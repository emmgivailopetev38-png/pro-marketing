"use client";
/* =====================================================================
   RealReviewsV2 — ИСТИНСКИ отзиви: снимки на съобщения от клиенти
   (Viber), добавени 29.09.2026 по нареждане на Ивайло.

   Правилата (виж и бележката в TestimonialsV2): тук влиза само истинско
   съобщение от истински клиент. Имената остават, освен ако клиентът е
   поискал анонимност — онлайн магазинът е поискал, затова аватарът е
   замъглен, а в чата стои само етикетът „Клиент Екомерс“. Изтеклият
   текст зад хедъра на Viber е замъглен. Нищо в самите съобщения не е
   пипано.

   Скин: същият v2 език като TestimonialsV2 (v2-card + v2-glow + .v2-reveal).
   ===================================================================== */
import Image from "next/image";
import { useEffect, useRef } from "react";

interface Review {
  src: string;
  width: number;
  height: number;
  alt: string;
  who: string;
  accent: string;
}

const REVIEWS: Review[] = [
  {
    src: "/otzivi/mihail-mihov.jpg",
    width: 1000,
    height: 487,
    alt: "Съобщение в Viber от клиент от менторската програма: „Мисля, че тепърва ще науча още доста неща от теб и ще направим много яки неща.“",
    who: "Клиент от менторската програма",
    accent: "var(--v2-violet-2)",
  },
  {
    src: "/otzivi/klient-onlain-magazin.jpg",
    width: 1000,
    height: 685,
    alt: "Съобщение в Viber от клиент с онлайн магазин: „Помогна ми да се науча как се работи с Claude Code и да автоматизирам доста процеси в бизнеса ми, което ми спестява много време и ми дава възможност да скалирам повече. Благодаря!“",
    who: "Клиент с онлайн магазин",
    accent: "var(--v2-cyan)",
  },
];

export function RealReviewsV2() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".v2-reveal"));
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="v2-section overflow-hidden">
      <div className="v2-wrap">
        <div className="v2-reveal v2-head">
          <span className="v2-eyebrow">{"// истински отзиви"}</span>
          <h2 className="v2-title" lang="bg">
            Какво ни пишат клиентите.
          </h2>
          <p className="v2-sub">
            Снимки от истинските ни чатове с клиенти — думите са техни.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-5 md:grid-cols-2">
          {REVIEWS.map((r, i) => (
            <figure
              key={r.src}
              className="v2-reveal v2-card v2-glow flex flex-col"
              style={{ ["--v2-c" as never]: r.accent, ["--d" as never]: `${i * 0.09}s` }}
            >
              <Image
                src={r.src}
                width={r.width}
                height={r.height}
                alt={r.alt}
                sizes="(min-width: 768px) 560px, 92vw"
                className="h-auto w-full rounded-xl"
              />
              <figcaption className="mt-4 flex items-center gap-2 text-sm text-[var(--v2-muted)]">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: r.accent, boxShadow: `0 0 8px ${r.accent}` }}
                />
                {r.who}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
