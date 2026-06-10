"use client";
/* =====================================================================
   FAQV2 — "2050" redesign of components/landing/FAQ.tsx.
   Same seven Q&A pairs (texts preserved 1:1), the same Radix accordion
   interactivity (type="single" collapsible) — only reskinned to the
   "Luminescent Depth" language via v2-* classes.

   "use client" because the Radix Accordion is interactive (open/close
   state). Each item is a depth-glass card with a rotating conic neon
   edge (alternating cyan / violet); the header carries a holographic
   title and a NeuralCore as the signature centerpiece. A lightweight
   IntersectionObserver toggles `.is-in` on the .v2-reveal nodes
   (matches the PainPointsV2 pattern).

   No currency strings present → nothing to convert.
   ===================================================================== */
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

const QA = [
  {
    q: "Колко време отнема стартирането на първа автоматизация?",
    a: "Между 2 и 4 седмици, в зависимост от сложността. Прости чатботове и имейл секвенции тръгват за 7-10 дни. Сложни CRM интеграции с гласови агенти стигат до 6 седмици.",
  },
  {
    q: "Колко струва?",
    a: "Цената е базирана на обхвата и нивото на интеграция. На първата (безплатна) консултация даваме конкретна цена и срок след като чуем какво ти трябва.",
  },
  {
    q: "Какви технически изисквания имам?",
    a: "Минимални. Имаш ли вече CRM, email платформа или съществуващ сайт — работим с тях. Ако нямаш — ние препоръчваме и настройваме.",
  },
  {
    q: "Кой поддържа агентите след стартирането?",
    a: "Ние, по абонамент. Това включва наблюдение, обновяване на знанието на агента, оптимизации и месечни отчети.",
  },
  {
    q: "Гарантирате ли резултати?",
    a: "Гарантираме доставка спрямо договорения обхват и KPI-та. Ако автоматизация не отговаря на критериите ни за качество, я преработваме без допълнителна цена.",
  },
  {
    q: "Работим ли с малки бизнеси?",
    a: "Да. Имаме решения от един процес/агент за soloprenori до пълни workflows за корпоративни клиенти.",
  },
  {
    q: "Кои AI модели използвате?",
    a: "Предимно OpenAI (GPT-4 family), Anthropic Claude и open-source модели за специфични задачи. Изборът зависи от случая и privacy изискванията.",
  },
];

export function FAQV2() {
  // Lightweight reveal: toggle .is-in on .v2-reveal nodes as they enter.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = document.querySelectorAll<HTMLElement>(".v2-faq .v2-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section id="faq" className="v2-faq v2-section relative overflow-hidden">
      <div className="v2-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="v2-wrap">
        <div className="mx-auto max-w-3xl">
          {/* Header + signature neural core */}
          <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="v2-head v2-reveal mb-0 max-w-2xl">
              <span className="v2-eyebrow">{"// въпроси"}</span>
              <h2
                className="v2-title"
                style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
                lang="bg"
              >
                Често задавани въпроси
              </h2>
            </div>

            <div
              className="v2-reveal pointer-events-none relative mx-auto hidden h-[220px] w-[220px] shrink-0 md:block"
              style={{ ["--d" as string]: "0.12s" }}
              aria-hidden
            >
              <NeuralCore nodeCount={160} radius={1.2} spin={0.8} />
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {QA.map((item, i) => {
              // alternate the conic-edge hue: cyan / violet
              const hue = i % 2 === 0 ? "var(--v2-cyan)" : "var(--v2-violet)";
              return (
                <div
                  key={i}
                  className="v2-reveal"
                  style={{ ["--d" as string]: `${i * 0.05}s` }}
                >
                  <AccordionItem
                    value={`item-${i}`}
                    className="v2-card v2-glow border-0 px-5 py-0"
                    style={{ ["--v2-c" as string]: hue }}
                  >
                    <AccordionTrigger
                      className="py-5 text-left text-lg font-semibold hover:no-underline"
                      style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-ink)" }}
                    >
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent
                      className="pb-5 text-[0.95rem] leading-relaxed"
                      style={{ color: "var(--v2-muted)" }}
                    >
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                </div>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
