/* /targovci — за търговците на свободна практика (12.11.2026).
   Ивайло: „лендинг специално за търговци, които обикалят на живо и търгуват в
   Пловдив или по телефона… 10 % на нашите услуги… какво ще получи… общо, да го
   пращаме и на други“. Линкът се праща лично (Viber), затова страницата НЕ е в
   търсачките и в картата на сайта. Данните: lib/site/targovci.ts. */

import "../v2/v2-design.css";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { DovolniKlientiV3 } from "@/components/landing/v2/DovolniKlientiV3";
import { Kalkulator } from "@/components/targovci/Kalkulator";
import { CLIENT_CASES } from "@/lib/site/clients";
import {
  ANALIZ,
  POLUCHAVASH,
  STAPKI,
  TARGOVCI_TEL,
  TARGOVCI_TEL_DISPLAY,
  TARGOVCI_VIBER,
  USLUGI,
  VAPROSI,
  evro,
  komisiona,
} from "@/lib/site/targovci";

const FooterV2 = dynamic(() => import("@/components/landing/v2/FooterV2").then((m) => ({ default: m.FooterV2 })));

export const metadata: Metadata = {
  title: "Търговци · 10 % от всяка сделка",
  description:
    "За търговци, които обикалят фирми на живо или по телефона: продаваш AI обучения, сайтове, автоматизации, гласов агент и маркетинг — получаваш 10 % от всяка сделка, без таван.",
  alternates: { canonical: "/targovci" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Продавай AI услуги — 10 % от всяка сделка",
    description: "Какво продаваш, колко печелиш и какво получаваш от нас. Без такса, без минимум.",
    locale: "bg_BG",
    type: "website",
  },
};

const Sekcia = ({ id, eyebrow, title, sub, children }: { id: string; eyebrow: string; title: React.ReactNode; sub?: string; children: React.ReactNode }) => (
  <section id={id} className="v2-section" style={{ paddingBlock: "clamp(40px, 6vw, 80px)" }}>
    <div className="v2-wrap">
      <div className="v2-head" style={{ marginBottom: "clamp(22px, 3.5vw, 36px)" }}>
        <p className="v2-eyebrow">{eyebrow}</p>
        <h2 className="v2-title-plain">{title}</h2>
        {sub && (
          <p className="max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
            {sub}
          </p>
        )}
      </div>
      {children}
    </div>
  </section>
);

function Prizivi({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      <a href={TARGOVCI_VIBER} className="v2-btn v2-btn-primary">
        Пиши ни „ДА“ във Viber
      </a>
      <a href={`tel:${TARGOVCI_TEL}`} className="v2-btn">
        Обади се · {TARGOVCI_TEL_DISPLAY}
      </a>
    </div>
  );
}

export default function TargovciPage() {
  return (
    <div data-v2 className="v2-scope" style={{ background: "var(--v2-void)", minHeight: "100vh" }}>
      <NavbarV2 />
      <main data-v2 style={{ paddingTop: 90 }}>
        {/* Героят */}
        <section className="v2-section" style={{ paddingBlock: "clamp(40px, 7vw, 88px)" }}>
          <div className="v2-wrap">
            <p className="v2-eyebrow">За търговци · Пловдив и цяла България</p>
            <h1 className="v2-title mt-3" style={{ fontSize: "clamp(2rem, 5.8vw, 3.8rem)", lineHeight: 1.05 }}>
              Ти намираш фирмата. <span className="v2-grad">Ние правим AI системата.</span> Ти взимаш 10 %.
            </h1>
            <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
              Обикаляш фирми на живо или звъниш по телефона? Продавай им това, което всяка фирма търси сега: AI обучения,
              сайтове, автоматизации, гласов агент, който вдига телефона, и маркетинг с AI. Получаваш 10 % от всяка сделка —
              без таван, без такса, без минимум.
            </p>
            <div className="mt-8">
              <Prizivi />
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["10 %", "от всяка сделка, без таван"],
                [evro(komisiona(7900)), "от един Команден център"],
                [evro(komisiona(6900)), "от едно обучение по маркетинг"],
                ["0 €", "за да започнеш — никакви такси"],
              ].map(([s, t]) => (
                <div key={t} className="v2-card flex flex-col gap-1 p-5">
                  <span className="v2-grad text-[clamp(1.8rem,4.2vw,2.8rem)] font-extrabold leading-none tracking-tight">{s}</span>
                  <span className="text-[14px] font-semibold leading-snug" style={{ color: "var(--v2-ink)" }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Какво продаваш */}
        <Sekcia
          id="uslugi"
          eyebrow="Какво продаваш"
          title={
            <>
              Осем услуги. <span className="v2-grad">Всяка фирма има нужда поне от една.</span>
            </>
          }
          sub="Цените са тези, които казваме на клиентите. До всяка — колко получаваш ти."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {USLUGI.map((u) => (
              <article key={u.id} className="v2-card flex min-w-0 flex-col gap-3 p-5">
                <h3 className="text-lg font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
                  {u.ime}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-[var(--v2-muted)]">{u.kakvo}</p>
                <p className="text-[13px] leading-snug text-[var(--v2-faint)]">За кого: {u.zaKogo}</p>
                <div className="mt-auto border-t border-[var(--v2-line)] pt-3">
                  <p className="v2-mono text-[11px] uppercase tracking-[0.16em] text-[var(--v2-faint)]">
                    {u.primer ? "по оферта, напр. " : "цена "}
                    {[u.cena ? evro(u.cena) : null, u.mesechno ? `${evro(u.mesechno)}/мес` : null].filter(Boolean).join(" + ")}
                  </p>
                  <p className="mt-1 text-[17px] font-extrabold" style={{ color: "var(--v2-mint)" }}>
                    твоите{" "}
                    {[u.cena ? evro(komisiona(u.cena)) : null, u.mesechno ? `${evro(komisiona(u.mesechno))}/мес` : null]
                      .filter(Boolean)
                      .join(" + ")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Sekcia>

        {/* Калкулаторът */}
        <Sekcia
          id="kalkulator"
          eyebrow="Колко печелиш"
          title={
            <>
              Сметни си сам. <span className="v2-grad">Натисни + и −.</span>
            </>
          }
          sub="Еднократните комисионни идват с всяка нова сделка. Месечните се трупат: всеки клиент на абонамент ти носи 10 % всеки месец, докато плаща."
        >
          <Kalkulator />
        </Sekcia>

        {/* Как работи */}
        <Sekcia id="kak" eyebrow="Как работи" title="Пет стъпки — от вратата на фирмата до парите ти">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STAPKI.map((s, i) => (
              <li key={s.zaglavie} className="v2-card flex flex-col gap-2 p-5">
                <span className="v2-mono text-[12px] text-[var(--v2-cyan-2)]">0{i + 1}</span>
                <p className="text-[15.5px] font-bold leading-snug text-[var(--v2-ink)]">{s.zaglavie}</p>
                <p className="text-[14px] leading-relaxed text-[var(--v2-muted)]">{s.tekst}</p>
              </li>
            ))}
          </ol>
        </Sekcia>

        {/* Анализът */}
        <Sekcia
          id="analiz"
          eyebrow="Анализът за 10 минути"
          title={
            <>
              Шест въпроса. <span className="v2-grad">И знаеш какво да му предложиш.</span>
            </>
          }
          sub="Питаш собственика, слушаш отговора и записваш. Чуеш ли знака — вече знаеш коя услуга му трябва."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {ANALIZ.map((a, i) => (
              <div key={a.pitai} className="v2-card flex flex-col gap-2 p-5">
                <p className="text-[15.5px] font-bold leading-snug text-[var(--v2-ink)]">
                  <span className="v2-mono mr-2 text-[12px] text-[var(--v2-cyan-2)]">{i + 1}.</span>„{a.pitai}“
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--v2-muted)]">Знакът: {a.znak}</p>
                <p className="text-[14.5px] font-semibold" style={{ color: "var(--v2-mint)" }}>
                  → {a.predlagash}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[14.5px] leading-relaxed text-[var(--v2-muted)]">
            Искаш да му покажеш как изглежда? Отвори на телефона{" "}
            <Link href="/demo" className="font-semibold text-[var(--v2-cyan-2)] underline underline-offset-4">
              демото за неговия бранш
            </Link>{" "}
            или{" "}
            <Link href="/uspehi" className="font-semibold text-[var(--v2-cyan-2)] underline underline-offset-4">
              видеата с истински резултати
            </Link>
            .
          </p>
        </Sekcia>

        {/* Направено при клиенти */}
        <Sekcia
          id="klienti"
          eyebrow="Направено при истински клиенти"
          title={
            <>
              Не продаваш обещания. <span className="v2-grad">Продаваш неща, които вече работят.</span>
            </>
          }
          sub="Системи, които сме построили за български фирми и работят и днес."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CLIENT_CASES.map((c) => (
              <article key={c.name} className="v2-card flex min-w-0 flex-col gap-3 p-6" style={{ ["--v2-c" as string]: c.accent }}>
                <p className="v2-mono text-[10.5px] uppercase tracking-[0.22em]" style={{ color: c.accent }}>
                  {c.branch}
                  {c.city ? ` · ${c.city}` : ""}
                </p>
                <p className="text-[15px] leading-relaxed text-[var(--v2-muted)]">{c.built}</p>
                <p className="mt-auto border-t border-[var(--v2-line)] pt-3 text-sm font-semibold text-[var(--v2-ink)]">{c.result}</p>
              </article>
            ))}
          </div>
        </Sekcia>

        <DovolniKlientiV3 />

        {/* Какво получаваш */}
        <Sekcia
          id="poluchavash"
          eyebrow="Какво получаваш"
          title={
            <>
              Ти не си сам на терена. <span className="v2-grad">Целият ни екип е зад теб.</span>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POLUCHAVASH.map((p) => (
              <div key={p.zaglavie} className="v2-card flex flex-col gap-2 p-5">
                <p className="text-[16px] font-bold text-[var(--v2-ink)]">{p.zaglavie}</p>
                <p className="text-[14px] leading-relaxed text-[var(--v2-muted)]">{p.tekst}</p>
              </div>
            ))}
          </div>
        </Sekcia>

        {/* Въпроси */}
        <Sekcia id="vaprosi" eyebrow="Въпроси" title="Каквото ще ни попиташ">
          <div className="mx-auto grid max-w-[860px] gap-3">
            {VAPROSI.map((q) => (
              <details key={q.v} className="v2-card group p-5">
                <summary className="cursor-pointer list-none text-[16px] font-bold text-[var(--v2-ink)]">
                  <span className="mr-2 text-[var(--v2-cyan-2)] group-open:hidden">+</span>
                  <span className="mr-2 hidden text-[var(--v2-cyan-2)] group-open:inline">−</span>
                  {q.v}
                </summary>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--v2-muted)]">{q.o}</p>
              </details>
            ))}
          </div>
        </Sekcia>

        {/* Призивът */}
        <section className="v2-section" style={{ paddingBlock: "clamp(48px, 8vw, 104px)" }}>
          <div className="v2-wrap">
            <div className="v2-card v2-glow is-always mx-auto flex max-w-[820px] flex-col items-center gap-5 p-8 text-center sm:p-12">
              <h2 className="v2-title-plain">
                Искаш ли да работим заедно? <span className="v2-grad">Пиши ни „ДА“.</span>
              </h2>
              <p className="max-w-[56ch] text-[16px] leading-relaxed text-[var(--v2-muted)]">
                Във Viber или по телефона. Пращаме ти материалите и демотата — и тръгваш към първата фирма.
              </p>
              <Prizivi center />
              <p className="v2-mono mt-2 text-[11px] text-[var(--v2-faint)]">ProMarketing · Ивайло Петев · 🌐 petevai.com · promarketing.pw</p>
            </div>
          </div>
        </section>
      </main>
      <FooterV2 />
    </div>
  );
}
