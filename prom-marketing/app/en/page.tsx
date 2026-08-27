import type { Metadata } from "next";
import Link from "next/link";
import "@/app/v2/v2-design.css";
import { NavbarV2 } from "@/components/landing/v2/NavbarV2";
import { FooterV2 } from "@/components/landing/v2/FooterV2";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, graph, serviceSchema, webPageSchema } from "@/lib/seo/schema";
import { KW, ORG, SITE_URL, abs } from "@/lib/seo/site";

/* =====================================================================
   Английската страница.

   Тя е ЧЕСТНИЯТ вариант на идеята „да сложим скрити английски думи".
   Скрит текст — бял на бяло, нулев шрифт, скрит div — е нарушение на
   правилата на Google за скрито съдържание и води до понижаване или
   изваждане от индекса. Дребна печалба, много голям риск за домейн,
   който тепърва трупа авторитет.

   Работещият начин е този: истинска страница на английски, свързана с
   българската през hreflang. Google я показва на англоговорящите, а
   българската — на българските търсения. Катя има клиент от Шотландия
   точно по този път.

   Страницата е нарочно кратка. Основният фокус е България; тук стои
   толкова, колкото един чуждестранен клиент трябва да прочете, за да
   вземе решение дали да пише.
   ===================================================================== */

const PATH = "/en";

const TITLE = "AI Automation Agency in Bulgaria — AI Agents, Chatbots & CRM";
const DESCRIPTION =
  "AI agents, Bulgarian-speaking chatbots, voice agents and custom CRM systems for " +
  "businesses in Bulgaria and the EU. Based in Plovdiv. Free first consultation.";

export const metadata: Metadata = {
  // absolute: без него шаблонът лепи марката отгоре и заглавието
  // излиза над 60 знака, тоест Google го реже в ключовата дума.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [...KW.en],
  alternates: {
    canonical: abs(PATH),
    languages: { "bg-BG": SITE_URL, en: abs(PATH), "x-default": SITE_URL },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bg_BG"],
    url: abs(PATH),
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "What does ProMarketing actually build?",
    a: "AI systems that take over repetitive work: agents that qualify inbound enquiries and draft quotes, chatbots that answer in Bulgarian or English around the clock, voice agents that pick up the phone, and a CRM that runs on your own domain and fills itself in.",
  },
  {
    q: "Do you work with clients outside Bulgaria?",
    a: "Yes. We are based in Plovdiv, Bulgaria and work remotely across the EU and beyond. Everything we build is bilingual by default — the same agent can handle Bulgarian and English customers.",
  },
  {
    q: "Why hire a Bulgarian team for AI automation?",
    a: "Western European and US agencies charge two to four times more for the same build. We are a small senior team, so you talk to the person who writes the system rather than to an account manager. And for Bulgarian-language work — voice, chat, sales calls — nobody offshore comes close.",
  },
  {
    q: "How long does a first project take?",
    a: "Two to four weeks for a single well-defined process. A connected system with CRM, chat, phone and reporting takes six to ten weeks. We always start with one process that pays for itself before moving to the next.",
  },
  {
    q: "Who owns the system and the data?",
    a: "You do. The CRM and dashboards live on your domain and in your database. If you ever move on, you export everything and keep working.",
  },
];

const SERVICES = [
  { title: "AI agents", text: "Software colleagues that qualify enquiries, draft quotes, update the CRM and chase silent leads.", href: "/ai-agenti" },
  { title: "AI chatbots", text: "Website, Messenger, Instagram and Viber. Natural Bulgarian and English, 24/7, with a clean handover to a human.", href: "/ai-chatbot" },
  { title: "Voice AI agents", text: "Answer the phone in natural Bulgarian, take bookings, confirm appointments and follow up after quotes.", href: "/glasov-ai-agent" },
  { title: "Custom AI CRM", text: "Your own CRM on your own domain — no per-seat pricing, filled in automatically from every channel.", href: "/ai-crm" },
  { title: "Process automation", text: "Invoices, documents, reporting and hand-offs between tools, wired into one system that runs itself.", href: "/ai-avtomatizacia" },
  { title: "Paid ads & video", text: "Meta and Google campaigns plus AI-produced video creative, feeding the automation behind it.", href: "/demo" },
];

export default function Page() {
  return (
    <>
      <JsonLd
        json={graph(
          webPageSchema({
            path: PATH,
            name: TITLE,
            description: DESCRIPTION,
            breadcrumbs: [{ name: "English", path: PATH }],
          }),
          serviceSchema({
            path: PATH,
            name: "AI automation for business",
            serviceType: "AI automation consultancy",
            description: DESCRIPTION,
          }),
          faqSchema(PATH, FAQ),
        )}
      />

      <div data-v2 className="v2-scope">
        <NavbarV2 />

        <main data-v2 id="top" lang="en">
          <section className="v2-section relative overflow-hidden pt-32">
            <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
            <div className="v2-wrap">
              <nav aria-label="Breadcrumb" className="v2-mono mb-6 text-[12px]">
                <Link href="/" className="text-[var(--v2-muted)] hover:text-[var(--v2-cyan)]" hrefLang="bg">
                  Начало (Bulgarian)
                </Link>
                <span className="mx-2 text-[var(--v2-faint)]">/</span>
                <span className="text-[var(--v2-cyan)]">English</span>
              </nav>

              <span className="v2-eyebrow">AI AUTOMATION · BULGARIA</span>

              <h1 className="v2-title-plain mt-4 max-w-4xl text-[clamp(30px,5vw,56px)] leading-[1.08]">
                AI automation agency in <span className="v2-grad">Bulgaria</span>
              </h1>

              <div className="v2-card mt-8 max-w-3xl p-6 md:p-7">
                <p className="v2-mono mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--v2-cyan)]">
                  In short
                </p>
                <p className="text-[17px] leading-[1.65] text-[var(--v2-ink)] md:text-[18px]">
                  ProMarketing builds AI agents, chatbots, voice agents and custom CRM systems for
                  small and mid-sized businesses. We are based in {ORG.city}, Bulgaria, we work in
                  Bulgarian and English, and we start with one process that pays for itself before
                  building the next one.
                </p>
              </div>

              <p className="mt-7 max-w-3xl text-[16px] leading-[1.75] text-[var(--v2-muted)] md:text-[17px]">
                Most companies do not lose customers because they are bad at what they do. They lose
                them because the enquiry arrived at 21:40, the quote went out three days later, and by
                then the customer had already spoken to somebody else. That gap is what we close.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/booking" className="v2-btn v2-btn-primary">
                  Book a free consultation
                </Link>
                <a href={`mailto:${ORG.email}`} className="v2-btn">
                  {ORG.email}
                </a>
              </div>
            </div>
          </section>

          <div className="v2-divider" />

          <section className="v2-section relative">
            <div className="v2-wrap">
              <span className="v2-eyebrow">WHAT WE BUILD</span>
              <h2 className="v2-title-plain mt-4 text-[clamp(24px,3.6vw,38px)]">
                Six things, done properly
              </h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((s) => (
                  <Link
                    key={s.title}
                    href={s.href}
                    hrefLang="bg"
                    className="v2-card block p-5 transition hover:border-[var(--v2-cyan)]"
                  >
                    <h3
                      className="text-[16px] font-bold text-[var(--v2-ink)]"
                      style={{ fontFamily: "var(--v2-font-display)" }}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.6] text-[var(--v2-muted)]">{s.text}</p>
                    <span className="v2-mono mt-4 inline-block text-[12px] text-[var(--v2-cyan)]">
                      Details in Bulgarian →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <div className="v2-divider" />

          <section className="v2-section relative">
            <div className="v2-wrap max-w-4xl">
              <span className="v2-eyebrow">FAQ</span>
              <h2 className="v2-title-plain mt-4 text-[clamp(24px,3.6vw,38px)]">
                What people ask first
              </h2>
              <div className="mt-8 space-y-3">
                {FAQ.map((item) => (
                  <details key={item.q} className="v2-card group p-5 md:p-6">
                    <summary className="cursor-pointer list-none text-[16px] font-semibold text-[var(--v2-ink)] md:text-[17px]">
                      <span className="mr-3 inline-block text-[var(--v2-cyan)] transition-transform group-open:rotate-90">
                        ›
                      </span>
                      {item.q}
                    </summary>
                    <p className="mt-4 pl-6 text-[15px] leading-[1.75] text-[var(--v2-muted)] md:text-[16px]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="v2-section relative overflow-hidden">
            <div aria-hidden className="v2-aurora pointer-events-none absolute inset-0" />
            <div className="v2-wrap relative max-w-3xl text-center">
              <h2 className="v2-title-plain text-[clamp(26px,4vw,42px)] leading-[1.12]">
                Tell us what keeps repeating
              </h2>
              <p className="mt-5 text-[16px] leading-[1.75] text-[var(--v2-muted)] md:text-[17px]">
                Half an hour is enough to map which processes eat the most hours and what each one is
                worth automating. You keep the list either way.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/booking" className="v2-btn v2-btn-primary">
                  Book a free consultation
                </Link>
                <Link href="/demo" className="v2-btn" hrefLang="bg">
                  See the live demo
                </Link>
              </div>
              <p className="v2-mono mt-6 text-[12px] text-[var(--v2-faint)]">
                {ORG.city}, Bulgaria · {ORG.phoneDisplay} · VAT {ORG.vatId}
              </p>
            </div>
          </section>
        </main>

        <FooterV2 />
      </div>
    </>
  );
}
