"use client";
import { useCallback, useState } from "react";
import { track as pixelTrack } from "@/lib/meta/pixel-client";
import { track } from "@/lib/analytics/track";
import { KINO } from "@/lib/kino/config";
import { quotePlan, formatEur, type KinoPlan } from "@/lib/kino/pricing";
import { sofiaDayLabel, sofiaTimeLabel } from "@/lib/kino/time";
import { APP_TEAM, APP_START, labelOf } from "@/lib/kino/questions";
import { fbIds, newKinoEventId, postJson } from "@/lib/kino/browser";
import { KinoCal } from "./KinoCal";

/* =====================================================================
   Поканата: трите бутона. Изплуват с надписите (залата решава кога),
   и в лепкавата лента долу.
   ✓ Ивайло, 06.10: съдържанието (Академията · 12 седмици живи групови
   срещи · агенти и шаблони · „AI картата“), 30 места, гаранцията, 1 900 €.
   ⚠ ЧЕРНОВА: формулировките, името, вноската и капарото
   (всичко идва от lib/kino/config.ts).
   ===================================================================== */

export type OfferPanel = null | "stream" | "call";

export interface OfferActions {
  panel: OfferPanel;
  open: (p: OfferPanel, scroll?: boolean) => void;
  busy: KinoPlan | null;
  message: string | null;
  checkout: (plan: KinoPlan) => Promise<void>;
  click: (button: string) => void;
}

export function useOfferActions({ token, from, pos }: { token: string | null; from: "zala" | "plashtane"; pos?: () => number }): OfferActions {
  const [panel, setPanel] = useState<OfferPanel>(null);
  const [busy, setBusy] = useState<KinoPlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const open = useCallback((p: OfferPanel, scroll = true) => {
    setPanel(p);
    if (scroll) {
      window.requestAnimationFrame(() => document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, []);

  const click = useCallback(
    (button: string) => {
      track("kino_offer_click", { button });
      if (token) void postJson("/api/kino/track", { k: "ev", t: token, type: "click", value: button, pos: pos?.() });
    },
    [token, pos],
  );

  const checkout = useCallback(
    async (plan: KinoPlan) => {
      if (!token) {
        setMessage("Плащането работи с личния линк от билета ти — отвори го от имейла.");
        return;
      }
      setBusy(plan);
      setMessage(null);
      click(plan);
      const eventId = newKinoEventId("kino_ic");
      pixelTrack("InitiateCheckout", { eventID: eventId, params: { content_name: `kino-${plan}`, currency: "EUR" } });
      const { ok, data } = await postJson<{ url?: string; error?: string; fallback?: string }>("/api/kino/checkout", {
        t: token,
        plan,
        from,
        eventId,
        ...fbIds(),
      });
      if (ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setBusy(null);
      setMessage(data.error ?? "Плащането не се отвори. Опитай пак след малко.");
      if (data.fallback === "call") open("call");
    },
    [token, from, click, open],
  );

  return { panel, open, busy, message, checkout, click };
}

function PriceBlock({ depositPaid }: { depositPaid: number }) {
  const full = quotePlan("full", { depositPaidEur: depositPaid });
  const inst = quotePlan("installments", { depositPaidEur: depositPaid });
  const close = Date.parse(KINO.screening.replayUntilISO);
  return (
    <div className="k-price">
      <div className="k-price-main">
        <span className="k-price-big">{formatEur(full.unitEur)}</span>
        <span className="k-price-old">с ДДС · веднъж, не всеки месец</span>
      </div>
      <p>
        Или на {inst.count} месечни вноски по <strong>{formatEur(inst.unitEur)}</strong> — и толкова. Абонаментът спира сам
        след последната.
      </p>
      {depositPaid > 0 ? (
        <p>Капарото ти ({formatEur(depositPaid)}) се приспада от първото плащане — мястото ти е запазено.</p>
      ) : (
        <p>
          Записването в потока е отворено до {sofiaDayLabel(close)}, {sofiaTimeLabel(close)} — тогава филмът сваля и потокът
          затваря. Местата са {KINO.seats}.
        </p>
      )}
    </div>
  );
}

/**
 * Третият бутон: кратка заявка → CRM (kino_precall) → календарът (Cal.com).
 * Четири въпроса, за да дойдем на разговора подготвени: бизнесът, екипът,
 * какво яде времето, кога иска да започне. Отговорите отиват и в бележката
 * на срещата в Cal.
 */
export function CallPanel({ token, name, email, onBookedTrack }: { token: string | null; name?: string | null; email?: string | null; onBookedTrack?: () => void }) {
  const [step, setStep] = useState<"survey" | "cal" | "booked">("survey");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const business = String(fd.get("business") ?? "").trim();
    const team = String(fd.get("team") ?? "");
    const timeEater = String(fd.get("timeEater") ?? "").trim() || undefined;
    const start = String(fd.get("start") ?? "");
    if (business.length < 2) return setError("Какъв е бизнесът ти? Две-три думи стигат.");
    if (!team) return setError("Колко сте в екипа?");
    if (!start) return setError("Кога искаш да започнеш?");
    setError(null);
    setSending(true);
    if (token) {
      const { ok, data } = await postJson<{ error?: string }>("/api/kino/answers", { kind: "precall", t: token, business, team, timeEater, start });
      if (!ok) {
        setSending(false);
        return setError(data.error ?? "Не се записа. Опитай пак.");
      }
    }
    track("kino_application", { team, start });
    setNotes(
      [
        `Заявка от „${KINO.title}“`,
        `Бизнес: ${business}`,
        `Екип: ${labelOf(APP_TEAM, team)}`,
        timeEater ? `Яде времето: ${timeEater}` : null,
        `Старт: ${labelOf(APP_START, start)}`,
      ]
        .filter(Boolean)
        .join(" · "),
    );
    setSending(false);
    setStep("cal");
  }

  const onBooked = useCallback(
    (uid: string | null) => {
      setStep("booked");
      track("kino_call_booked");
      pixelTrack("Schedule", { eventID: uid ? `cal_sched_${uid}` : newKinoEventId("kino_sched"), params: { content_name: "kino-call" } });
      if (token) void postJson("/api/kino/track", { k: "ev", t: token, type: "booking", value: uid ?? undefined });
      onBookedTrack?.();
    },
    [token, onBookedTrack],
  );

  if (step === "booked") {
    return (
      <div className="k-panel" role="status" style={{ marginTop: 16 }}>
        <p className="k-h3">Записано! 📅</p>
        <p className="k-lead" style={{ marginTop: 6 }}>
          Потвърждението е в пощата ти. Ще се чуем в уговорения час — подготви си въпросите.
        </p>
      </div>
    );
  }
  if (step === "cal") {
    return (
      <div className="k-panel" style={{ marginTop: 16, padding: 8 }}>
        <KinoCal name={name} email={email} notes={notes} onBooked={onBooked} />
      </div>
    );
  }
  return (
    <form className="k-form k-panel" style={{ marginTop: 16 }} onSubmit={submit} noValidate>
      <p className="k-h3">Кратка заявка — и избираш час</p>
      <p className="k-muted" style={{ margin: "-4px 0 4px", fontSize: "0.9rem" }}>
        Четири въпроса, за да говорим за твоя бизнес, а не за общи неща. {KINO.cal.minutes} минути, пон–чт.
      </p>
      <label className="k-field">
        <span className="k-label">Какъв е бизнесът ти?</span>
        <input className="k-input" name="business" maxLength={160} autoComplete="organization" placeholder="Например: автосервиз, онлайн магазин, салон" />
      </label>
      <fieldset className="k-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="k-label" style={{ marginBottom: 6 }}>
          Колко сте в екипа?
        </legend>
        <div className="k-choices k-choices--3">
          {APP_TEAM.map((c) => (
            <label className="k-choice" key={c.id}>
              <input type="radio" name="team" value={c.id} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="k-field">
        <span className="k-label">
          Какво ти яде времето? <small>· по желание</small>
        </span>
        <textarea className="k-textarea" name="timeEater" maxLength={600} placeholder="Например: офертите, едни и същи въпроси по телефона, отчетите…" />
      </label>
      <fieldset className="k-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="k-label" style={{ marginBottom: 6 }}>
          Кога искаш да започнеш?
        </legend>
        <div className="k-choices k-choices--3">
          {APP_START.map((c) => (
            <label className="k-choice" key={c.id}>
              <input type="radio" name="start" value={c.id} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite">{error && <p className="k-error">{error}</p>}</div>
      <button type="submit" className="k-btn k-btn--primary" disabled={sending}>
        {sending ? "Секунда…" : "Покажи свободните часове"}
      </button>
    </form>
  );
}

export function OfferBlock({
  actions,
  token,
  depositPaid,
  bought,
  name,
  email,
  hours,
}: {
  actions: OfferActions;
  token: string | null;
  depositPaid: number;
  bought: boolean;
  name?: string | null;
  email?: string | null;
  /** „Твоето число“ от сцена 9.7 — поканата го връща на човека */
  hours?: number | null;
}) {
  const full = quotePlan("full", { depositPaidEur: depositPaid });
  const inst = quotePlan("installments", { depositPaidEur: depositPaid });
  const { panel, open, busy, message, checkout } = actions;

  if (bought) {
    return (
      <section id="oferta" className="k-offer" aria-labelledby="k-offer-title">
        <span className="k-kicker">Част втора</span>
        <h2 id="k-offer-title" className="k-h2">
          Ти вече си в потока. 🎉
        </h2>
        <p className="k-lead">Следващите стъпки са в пощата ти — и покана за Академията до 24 часа. Ще се видим на първата среща!</p>
      </section>
    );
  }

  return (
    <section id="oferta" className="k-offer" aria-labelledby="k-offer-title">
      <span className="k-kicker">Част втора</span>
      <h2 id="k-offer-title" className="k-h2">
        Част втора я снимаш ти.
      </h2>
      <p className="k-lead">Въпросът е само дали сам — или с екип. Ако искаш да го направим заедно, ето какво е {KINO.program.name}:</p>
      {hours != null && hours > 0 && (
        <p className="k-number-back">
          🔢 Твоето число: <strong>{hours} часа седмично</strong> — около {Math.round(hours * 52)} часа в годината. Точно тези часове са
          първата ни цел.
        </p>
      )}

      <ul className="k-stack">
        {KINO.program.stack.map((s) => (
          <li key={s.title}>
            <strong>{s.title}</strong>
            <span>{s.body}</span>
          </li>
        ))}
      </ul>
      <p className="k-muted" style={{ margin: "14px 0 0", fontSize: "0.9rem" }}>
        {KINO.program.anchor} Тук получаваш Академията, готовите агенти и шаблони, личната си AI карта — и 12 седмици, в които
        го правим заедно.
      </p>

      <PriceBlock depositPaid={depositPaid} />

      <div className="k-choose">
        <div className="k-option k-option--main">
          <p className="k-h3">1 · Влизам в потока</p>
          <p>Ако си готов. Плащаш наведнъж или на {inst.count} вноски — абонаментът спира сам след последната.</p>
          {panel === "stream" ? (
            <div className="k-sub-actions">
              <button type="button" className="k-btn k-btn--primary" disabled={!!busy} onClick={() => checkout("full")}>
                {busy === "full" ? "Отваряме плащането…" : `Плащам наведнъж · ${formatEur(full.dueNowEur)}`}
              </button>
              <button type="button" className="k-btn" disabled={!!busy} onClick={() => checkout("installments")}>
                {busy === "installments" ? "Отваряме плащането…" : `${inst.count} вноски × ${formatEur(inst.unitEur)}`}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="k-btn k-btn--primary"
              onClick={() => {
                actions.click("stream");
                open("stream", false);
              }}
            >
              Влизам в потока
            </button>
          )}
        </div>

        <div className="k-option">
          <p className="k-h3">2 · Пазя място с капаро</p>
          {depositPaid > 0 ? (
            <p>Капарото ти е платено — мястото ти е запазено. Избери час за разговора.</p>
          ) : (
            <p>
              {formatEur(KINO.prices.deposit)} — пазиш мястото си в потока до разговора ни. Приспадат се изцяло от цената.
            </p>
          )}
          {depositPaid > 0 ? (
            <button type="button" className="k-btn" onClick={() => open("call", false)}>
              Избери час
            </button>
          ) : (
            <button type="button" className="k-btn" disabled={!!busy} onClick={() => checkout("deposit")}>
              {busy === "deposit" ? "Отваряме плащането…" : `Пазя място · ${formatEur(KINO.prices.deposit)}`}
            </button>
          )}
        </div>

        <div className="k-option">
          <p className="k-h3">3 · Искам първо да поговорим</p>
          <p>
            {KINO.cal.minutes} минути, без ангажимент. И ако нямаш време да го учиш и искаш да го направим ние вместо теб — и за
            това е този бутон.
          </p>
          <button
            type="button"
            className="k-btn"
            onClick={() => {
              actions.click("call");
              open("call", false);
            }}
          >
            Избери час
          </button>
        </div>
      </div>

      <div aria-live="polite">{message && <p className="k-error" style={{ marginTop: 14 }}>{message}</p>}</div>
      {panel === "call" && <CallPanel token={token} name={name} email={email} />}

      <p className="k-muted" style={{ margin: "18px 0 0", fontSize: "0.9rem" }}>
        🛡️ <strong>Гаранция.</strong> {KINO.program.guarantee}
      </p>
      <p className="k-muted" style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>
        Местата в потока са {KINO.seats} — заради живите срещи: така всеки получава истинско внимание. Цената е крайна, с ДДС;
        плащането е през Stripe.
      </p>
    </section>
  );
}

export function StickyOfferBar({ actions, depositPaid }: { actions: OfferActions; depositPaid: number }) {
  return (
    <div className="k-sticky" role="region" aria-label="Трите бутона">
      <div className="k-sticky-inner">
        <button
          type="button"
          className="k-btn k-btn--primary"
          onClick={() => {
            actions.click("stream");
            actions.open("stream");
          }}
        >
          Влизам в потока
        </button>
        {depositPaid > 0 ? (
          <button type="button" className="k-btn" onClick={() => actions.open("call")}>
            Час за разговор
          </button>
        ) : (
          <button type="button" className="k-btn" disabled={!!actions.busy} onClick={() => actions.checkout("deposit")}>
            {actions.busy === "deposit" ? "…" : `Капаро ${formatEur(KINO.prices.deposit)}`}
          </button>
        )}
        <button
          type="button"
          className="k-btn"
          onClick={() => {
            actions.click("call");
            actions.open("call");
          }}
        >
          Да поговорим
        </button>
      </div>
    </div>
  );
}
