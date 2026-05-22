import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionReveal } from "@/components/effects/SectionReveal";

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

export function FAQ() {
  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-3xl px-6">
        <SectionReveal>
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// въпроси"}
            </p>
            <h2
              className="font-display text-[clamp(32px,7vw,64px)] font-bold leading-[1.08] tracking-tight"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Често задавани въпроси
            </h2>
          </div>
        </SectionReveal>

        <SectionReveal>
          <Accordion type="single" collapsible className="space-y-3">
            {QA.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass rounded-xl border-0 px-5"
              >
                <AccordionTrigger className="py-5 text-left font-display text-lg font-semibold hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[var(--color-text-secondary)]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionReveal>
      </div>
    </section>
  );
}
