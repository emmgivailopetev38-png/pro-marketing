import "../v2/v2-design.css";
import dynamic from "next/dynamic";
import { BookOpen, MessageCircle, Inbox, Package } from "lucide-react";
import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { RobotSilhouette } from "@/components/robot/RobotSilhouette";
import { RobotWaitlistForm } from "@/components/robot/RobotWaitlistForm";

const FooterV2 = dynamic(() =>
  import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 }))
);

/* =====================================================================
   /robot — „Поръчай робот · скоро". Тийзър с една цел: човек да се
   запише в списъка. Роботът още е „под покривалото" — силует, какво ще
   прави (работник: физическа работа + разговор на български) и формата.
   Без цени (Ивайло: „никъде цени") и без дата — записаните научават първи.
   ===================================================================== */

const CAN = [
  {
    icon: Package,
    title: "Върши физическа работа",
    body: "Ще носи, подрежда и разнася — работата с ръце, която изяжда часовете на екипа. Работник, не украса.",
  },
  {
    icon: MessageCircle,
    title: "Говори на български",
    body: "Поздравява, отговаря, шегува се — с име и характер, които избираш ти. Хората си говорят с него, а не само го снимат.",
  },
  {
    icon: BookOpen,
    title: "Знае твоя бизнес",
    body: "Какво предлагаш, кога работиш, какво питат хората. Отговаря като човек от екипа, не като рекламна табела.",
  },
  {
    icon: Inbox,
    title: "Приема запитвания",
    body: "Записва телефона на всеки, който се заинтересува, и го праща в CRM-а. Нищо не остава на салфетка.",
  },
];

const WHERE = ["Складове", "Магазини", "Ресторанти и хотели", "Събития", "Офиси"];

const FAQ = [
  { q: "Кога?", a: "Скоро. Записаните в списъка научават датата преди всички." },
  { q: "Каква работа ще върши?", a: "Физическа работа и разговор с хората: носи, подрежда, разнася, посреща и отговаря. Какво точно ще прави при теб, решаваме заедно — записаните научават подробностите първи." },
  { q: "Защо точно на български?", a: "Защото фабричният глас на робота не го говори, а хората искат да си говорят с него на своя език. Това е причината да го правим." },
];

export default function RobotPage() {
  return (
    <div data-v2 className="v2-scope" style={{ background: "var(--v2-void)", minHeight: "100vh" }}>
      <NavbarV2 />
      <main data-v2 style={{ paddingTop: 90 }}>
        <section className="v2-section !pt-10 md:!pt-16" aria-labelledby="robot-title">
          <div className="v2-wrap grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
            <div className="min-w-0">
              <p className="v2-eyebrow">{"// Поръчки · скоро"}</p>
              <h1 id="robot-title" className="v2-title-plain !text-[clamp(2.1rem,6vw,4rem)]">
                Робот-работник, който <span className="v2-grad">говори български</span>
              </h1>
              <p className="v2-sub mt-5 max-w-xl">
                Хуманоиден робот с нашия AI. Ще върши физическа работа — носи, подрежда, разнася — и ще
                разговаря с хората на техния език. Още е под покривалото.
              </p>

              <div id="spisak" className="v2-glass v2-glow is-always relative mt-8 max-w-md scroll-mt-28 p-5 md:p-6">
                <p className="v2-mono mb-4 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--v2-cyan)" }}>
                  Списък за поръчка
                </p>
                <RobotWaitlistForm location="robot_page" />
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[300px] md:max-w-[440px]">
              <RobotSilhouette id="rp" className="block h-auto w-full" />
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
        </section>

        <section className="v2-section !pt-0" aria-labelledby="robot-can">
          <div className="v2-wrap">
            <div className="v2-head">
              <p className="v2-eyebrow">{"// Какво ще може"}</p>
              <h2 id="robot-can" className="v2-title-plain !text-[clamp(1.6rem,3.6vw,2.6rem)]">
                Не играчка за снимка — <span className="v2-grad">работник в екипа ти</span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CAN.map(({ icon: Icon, title, body }) => (
                <div key={title} className="v2-glass relative p-6">
                  <span
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "rgba(34, 211, 238, 0.1)", border: "1px solid var(--v2-line)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--v2-cyan)" }} aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--v2-ink)" }}>
                    {title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="v2-mono mr-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--v2-faint)" }}>
                Къде
              </span>
              {WHERE.map((w) => (
                <span
                  key={w}
                  className="rounded-full px-3.5 py-1.5 text-sm"
                  style={{ border: "1px solid var(--v2-line)", color: "var(--v2-muted)", background: "rgba(4, 6, 13, 0.5)" }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="v2-section !pt-0" aria-labelledby="robot-faq">
          <div className="v2-wrap max-w-3xl">
            <h2 id="robot-faq" className="v2-title-plain !text-[clamp(1.4rem,3vw,2rem)]">
              Въпросите, които всички задават
            </h2>
            <dl className="mt-6 divide-y" style={{ borderColor: "var(--v2-line)" }}>
              {FAQ.map(({ q, a }) => (
                <div key={q} className="py-5" style={{ borderColor: "var(--v2-line)" }}>
                  <dt className="text-base font-semibold" style={{ color: "var(--v2-ink)" }}>
                    {q}
                  </dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                    {a}
                  </dd>
                </div>
              ))}
            </dl>
            <a href="#spisak" className="v2-btn v2-btn-primary mt-8">
              Запиши се първи
              <span aria-hidden className="v2-arrow">→</span>
            </a>
          </div>
        </section>
      </main>
      <FooterV2 />
    </div>
  );
}
