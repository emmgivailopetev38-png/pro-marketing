"use client";
/* =====================================================================
   AuditLanding — /automation-audit: лендинг „Безплатен AI одит”.
   Целта е ЕДНО нещо: телефонът. Формата е минимална (име + телефон,
   имейл по желание) и праща към /api/leads/submit (телефонът е
   единственото задължително поле там). Това е и лендингът на
   лийд кампаниите „само телефони”.
   ===================================================================== */
import { useState } from "react";
import { Check, PhoneCall, ShieldCheck, Timer } from "lucide-react";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { track } from "@/lib/analytics/track";
import { track as pixelTrack } from "@/lib/meta/pixel-client";

function PhoneForm({ location }: { location: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    track("audit_lead_submitted", { location });
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          phone,
          message: `Заявка за безплатен AI одит (от /automation-audit, секция: ${location})`,
        }),
      });
      if (!res.ok) throw new Error("bad");
      pixelTrack("Lead", { params: { content_name: "automation_audit" } });
      setState("done");
    } catch {
      setState("error");
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60";

  if (state === "done") {
    return (
      <div className="rounded-3xl border border-emerald-300/40 bg-[rgba(52,211,153,0.08)] p-7 text-center">
        <p className="text-3xl">📞</p>
        <h3 className="mt-3 text-xl font-bold text-white">Прието! Ще ти позвъним днес.</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-300">
          Одитът е 30 минути, по телефона или в Zoom — както ти е удобно. Междувременно:
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <a href="/demo" className="rounded-full bg-[var(--color-accent-cyan)] px-6 py-3 font-bold text-[var(--color-bg-void)]">
            Виж живото демо →
          </a>
          <a href="/booking" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-slate-200">
            Или запази точен час
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={input} placeholder="Твоето име" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      <input
        className={input}
        placeholder="Телефон — звъним ние, днес"
        type="tel"
        required
        minLength={6}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-7 py-4 text-base font-bold text-[var(--color-bg-void)] shadow-[0_0_44px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_70px_rgba(34,211,238,0.65)] disabled:opacity-60"
      >
        <PhoneCall className="h-5 w-5" />
        {state === "sending" ? "Изпращаме…" : "Искам безплатния одит"}
      </button>
      {state === "error" && <p className="text-sm text-rose-400">Нещо се обърка — опитай пак или звънни на 0877 399 963.</p>}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Без спам, без насрочени продажби — само одитът.
      </p>
    </form>
  );
}

const PAINS = [
  { who: "E-commerce магазини", what: "изоставени колички, бавни отговори, ръчни поръчки" },
  { who: "B2B и услуги", what: "оферти без follow-up, запитвания в 5 канала, Excel хаос" },
  { who: "Лични брандове", what: "съобщения без отговор, продажби на ръка, съдържание на парче" },
];

export function AuditLanding() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(90vw 60vh at 20% 10%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(80vw 60vh at 85% 85%, rgba(52,211,153,0.1), transparent 60%)",
        }}
      />

      {/* HERO — формата е веднага видима */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/40 bg-[rgba(52,211,153,0.08)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300">
            <Timer className="h-3.5 w-3.5" /> 30 минути · безплатно · без ангажимент
          </span>
          <h1 className="mt-5 text-[clamp(34px,5.4vw,60px)] font-bold leading-[1.06] tracking-tight">
            Безплатен <span className="text-cyan-300">AI одит</span>:
            <br />
            кои процеси ти <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">губят пари?</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-300 md:text-lg">
            Не продаваме софтуер на сляпо. Първо намираме процесите, които ти ядат време и
            клиенти — и ти казваме кои се автоматизират първи и какво ще ти върнат.
          </p>
          <ul className="mt-6 space-y-2.5">
            {[
              "Звъним ти още днес — 30 минути по телефона или в Zoom",
              "Излизаш с конкретен план: какво, в какъв ред, какво връща",
              "Без ангажимент — планът е твой, каквото и да решиш",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-slate-200">
                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                  <Check className="h-3 w-3 text-emerald-300" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div id="kontakti" className="rounded-3xl border border-cyan-400/30 bg-[rgba(7,12,16,0.9)] p-6 shadow-[0_0_80px_-18px_rgba(34,211,238,0.5)] md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300">Остави телефон — ние звъним</p>
          <h2 className="mb-5 mt-2 text-2xl font-bold leading-snug">
            Одитът е <span className="text-emerald-300">безплатен</span>. Загубеното време не е.
          </h2>
          <PhoneForm location="hero" />
        </div>
      </section>

      {/* За кого */}
      <section className="relative mx-auto max-w-6xl px-6 py-12">
        <SectionReveal>
          <h2 className="text-center text-3xl font-bold">Какво откриваме най-често</h2>
        </SectionReveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <SectionReveal key={p.who} delay={i * 80}>
              <div className="h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6">
                <h3 className="font-bold text-white">{p.who}</h3>
                <p className="mt-2 text-sm text-slate-400">{p.what}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Финална форма */}
      <section className="relative mx-auto max-w-xl px-6 pb-24 pt-8">
        <SectionReveal>
          <div className="rounded-3xl border border-cyan-400/30 bg-[rgba(7,12,16,0.9)] p-6 md:p-8">
            <h2 className="mb-5 text-center text-2xl font-bold">
              Остави си телефона — <span className="text-cyan-300">звъним днес</span>
            </h2>
            <PhoneForm location="final" />
          </div>
        </SectionReveal>
        <p className="mt-8 text-center text-xs text-slate-600">
          ProMarketing · promarketing.pw ·{" "}
          <a href="/privacy" className="underline underline-offset-2">Поверителност</a>
        </p>
      </section>
    </main>
  );
}
