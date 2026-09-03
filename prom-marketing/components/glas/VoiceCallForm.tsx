"use client";

/* ---------------------------------------------------------------------------
   VoiceCallForm — формата на /glas: четири полета, после жив разговор.
   ---------------------------------------------------------------------------
   Разликата с `VoiceReceptionButton` (бутонът в героя на началната страница)
   е нарочна и е една: тук формата НЕ е в прозорче, а стои разгъната на
   страницата. Трафикът от реклама не търси бутони — той вижда полета или
   си отива. Затова и целият лендинг е построен около нея.

   Редът пак е форма → разговор, по същите две причини:

   1. Лийдът се хваща ПРЕДИ линията да е отворена. Платеният клик, който е
      затворил след трийсет секунди, поне остава като телефон в CRM-а.
   2. Агентът получава имейла НАПИСАН. Продиктуваният на глас имейл е
      най-честата счупена среща.

   Микрофонът се пуска с втори натиск, вътре в самия говорител — браузърът
   иска жест от потребителя, а „Разреши микрофона?" веднага след изпратена
   форма изглежда като капан.
--------------------------------------------------------------------------- */

import { useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Loader2,
  Mail,
  Mic,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { track } from "@/lib/analytics/track";
import { newEventId, track as pixelTrack } from "@/lib/meta/pixel-client";

const WIDGET_SRC = "https://unpkg.com/@elevenlabs/convai-widget-embed";

/** Падащото меню е по-бързо от писане на телефон и дава чист текст на агента. */
const BUSINESSES = [
  "Онлайн магазин",
  "Магазин с обект",
  "Услуги или кабинет",
  "Ресторант или хотел",
  "Сервиз или монтажи",
  "Транспорт и доставки",
  "Друго",
];

type Vars = Record<string, string>;
type Step = "form" | "connecting" | "live" | "closed";

export function VoiceCallForm({ location }: { location: string }) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [closedText, setClosedText] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");

  const holder = useRef<HTMLDivElement>(null);

  /** Говорителят се зарежда веднъж за целия живот на страницата. */
  function ensureWidgetScript() {
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.type = "text/javascript";
    document.body.appendChild(s);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "connecting") return;
    setError(null);
    setStep("connecting");
    track("glas_lead_submitted", { location });

    /* Един и същ идентификатор за пиксела в браузъра и за събитието от
       сървъра — иначе Meta брои един лийд два пъти. */
    const eventId = newEventId();

    try {
      const res = await fetch("/api/voice/public/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          business: business || undefined,
          channel: "reklama",
          page: "/glas",
          event_id: eventId,
        }),
      });
      const data = (await res.json()) as {
        agent_id?: string;
        variables?: Vars;
        error?: string;
        spoken?: string;
      };

      /* Изчерпаният месечен таван не е грешка, а различен изход: човекът е
         истински лийд и вече е в CRM-а — праща се към календара, не към
         съобщение в червено. */
      if (res.status === 429) {
        pixelTrack("Lead", { eventID: eventId, params: { content_name: "glas_reklama" } });
        setClosedText(data.spoken ?? "Гласовото демо е заето в момента.");
        setStep("closed");
        return;
      }

      if (!res.ok || !data.agent_id) {
        setStep("form");
        setError(
          data.spoken ??
            (data.error === "invalid"
              ? "Провери имейла и телефона — нещо не се получи."
              : "Точно сега линията не се отваря. Пробвай пак след минута.")
        );
        return;
      }

      pixelTrack("Lead", { eventID: eventId, params: { content_name: "glas_reklama" } });

      ensureWidgetScript();
      if (holder.current) {
        holder.current.innerHTML = "";
        const el = document.createElement("elevenlabs-convai");
        // Идентификаторът, не подписан адрес: агентът е публичен и се пази с
        // allowlist за promarketing.pw. Виж /api/voice/public/session.
        el.setAttribute("agent-id", data.agent_id);
        if (data.variables) el.setAttribute("dynamic-variables", JSON.stringify(data.variables));
        el.setAttribute("variant", "expanded");
        holder.current.appendChild(el);
      }
      setStep("live");
      track("glas_voice_live", { location });
    } catch {
      setStep("form");
      setError("Няма връзка със сървъра. Пробвай пак.");
    }
  }

  const valid =
    name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    phone.trim().length >= 6 &&
    business !== "";

  /* --- Живият разговор ------------------------------------------------- */
  if (step === "live") {
    return (
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-[rgba(52,211,153,0.08)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> На линия
        </span>
        <h3 className="mt-3 text-2xl font-bold leading-snug text-white">
          Натисни микрофона и <span className="text-cyan-300">говори</span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Коста знае кой си — не му диктувай имейл. Кажи му с какво се занимаваш и го помоли
          да ти запише час. Прекъсни го насред изречение: спира и слуша.
        </p>

        <div ref={holder} className="mt-4" />

        <div className="mt-4 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
          <strong className="block font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
            Пробвай с
          </strong>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            <li>„Имам онлайн магазин и не смогвам с обажданията за поръчки.“</li>
            <li>„Колко струва това и за колко време се пуска?“</li>
            <li>„Запиши ме за четвъртък сутринта.“</li>
          </ul>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Mic className="h-3.5 w-3.5 text-cyan-300" /> Нужен е микрофон. Ако си без такъв —{" "}
          <a href="/booking" className="underline underline-offset-2 hover:text-slate-300">
            запази час от календара
          </a>
          .
        </p>
      </div>
    );
  }

  /* --- Таванът е изчерпан ---------------------------------------------- */
  if (step === "closed") {
    return (
      <div className="text-center">
        <p className="text-3xl">📅</p>
        <h3 className="mt-3 text-xl font-bold text-white">Данните са при нас.</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">{closedText}</p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <a
            href="/booking"
            className="rounded-full bg-[var(--color-accent-cyan)] px-6 py-3 font-bold text-[var(--color-bg-void)]"
          >
            Запази час от календара →
          </a>
          <a
            href="tel:+14754269084"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-slate-200"
          >
            Или звънни на агента
          </a>
        </div>
      </div>
    );
  }

  /* --- Формата ---------------------------------------------------------- */
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[rgba(34,211,238,0.07)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
        <CalendarCheck className="h-3.5 w-3.5" /> Живо демо · сега
      </span>
      <h2 className="mt-3 text-2xl font-bold leading-snug text-white">
        Остави трите неща и <span className="text-cyan-300">говори с агента</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        Той сам ти записва часа при Ивайло — в истинския календар, докато си на линията.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-2.5">
        <Field icon={<User className="h-4 w-4" />}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Име"
            autoComplete="name"
            required
            className="w-full bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-slate-500"
          />
        </Field>
        <Field icon={<Phone className="h-4 w-4" />}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="Телефон"
            autoComplete="tel"
            required
            minLength={6}
            className="w-full bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-slate-500"
          />
        </Field>
        <Field icon={<Mail className="h-4 w-4" />}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            placeholder="Имейл — там отива потвърждението за часа"
            autoComplete="email"
            required
            className="w-full bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-slate-500"
          />
        </Field>
        <Field icon={<Building2 className="h-4 w-4" />}>
          <select
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            required
            aria-label="Какъв бизнес имаш"
            className="w-full appearance-none bg-transparent py-3.5 text-[15px] text-white outline-none"
          >
            <option value="" disabled className="text-slate-500">
              Какъв бизнес имаш
            </option>
            {BUSINESSES.map((b) => (
              <option key={b} value={b} className="bg-[#070c10] text-white">
                {b}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="pt-1 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={!valid || step === "connecting"}
          className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-7 py-4 text-base font-bold text-[var(--color-bg-void)] shadow-[0_0_44px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_70px_rgba(34,211,238,0.65)] disabled:opacity-45 disabled:shadow-none"
        >
          {step === "connecting" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Свързвам…
            </>
          ) : (
            <>
              Пусни разговора сега <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Разговорът е с AI и той сам ти го
        казва. Нужен е микрофон.
      </p>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 transition focus-within:border-cyan-400/60">
      <span className="shrink-0 text-cyan-300">{icon}</span>
      {children}
    </div>
  );
}
