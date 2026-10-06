"use client";
import { useState } from "react";
import { track as pixelTrack } from "@/lib/meta/pixel-client";
import { track } from "@/lib/analytics/track";
import { KINO_ROLES, normalizePhone } from "@/lib/kino/people";
import { fbIds, firstTouchUtm, newKinoEventId, postJson } from "@/lib/kino/browser";

/**
 * Билетната каса. Телефонът е задължителен (БГ формат) — по него идват
 * SMS напомнянето и обаждането преди премиерата. Имейлът — за билета.
 * След успех: пикселът (CompleteRegistration със същия event_id като
 * сървъра) и направо към билета.
 */
export function RegisterForm({
  submitLabel = "Вземи безплатен билет",
  compact = false,
  goTo = "bilet",
}: {
  submitLabel?: string;
  compact?: boolean;
  /** след успех: към билета (по подразбиране) или направо в залата */
  goTo?: "bilet" | "zala";
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "mailed">("idle");
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const role = String(fd.get("role") ?? "");
    const pain = String(fd.get("pain") ?? "").trim();
    const consent = fd.get("consent") === "on";

    if (name.length < 2) return setError({ field: "name", message: "Как да те запишем? Напиши името си." });
    const ph = normalizePhone(phone);
    if (!ph.ok) return setError({ field: "phone", message: ph.reason });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError({ field: "email", message: "Провери имейла — на него идва билетът." });
    if (!role) return setError({ field: "role", message: "Избери какво описва теб най-добре." });
    if (!consent) return setError({ field: "consent", message: "Отметни съгласието — без него не можем да ти напомним." });

    setError(null);
    setState("sending");
    const eventId = newKinoEventId("kino_reg");
    track("kino_register_submitted", { role });
    const { ok, data } = await postJson<{ ok?: boolean; ticketUrl?: string; sentByEmail?: boolean; isNew?: boolean; error?: string; field?: string }>("/api/kino/register", {
      name,
      phone,
      email,
      role,
      pain: pain || undefined,
      consent: true,
      utm: firstTouchUtm(),
      eventId,
      page: window.location.origin + window.location.pathname,
      website: String(fd.get("website") ?? "") || undefined,
      ...fbIds(),
    });
    if (!ok || !data.ok) {
      setState("idle");
      setError({ field: data.field, message: data.error ?? "Нещо се обърка — опитай пак след малко." });
      return;
    }
    // Само първото записване е конверсия (сървърът праща CAPI със същия event_id само тогава).
    if (data.isNew !== false) {
      pixelTrack("CompleteRegistration", {
        eventID: eventId,
        params: { content_name: "ВЪЛНАТА · онлайн кино", content_category: "kino", status: role },
      });
    }
    track("kino_registered", { role });
    if (data.sentByEmail || !data.ticketUrl) {
      // Познаваме те с друг имейл — билетът е по пощата, не на страницата.
      setState("mailed");
      return;
    }
    setState("done");
    window.location.assign(goTo === "zala" ? data.ticketUrl.replace("/kino/bilet", "/kino/zala") : data.ticketUrl);
  }

  const invalid = (f: string) => (error?.field === f ? true : undefined);

  return (
    <form className="k-form" onSubmit={onSubmit} noValidate aria-describedby="k-form-error">
      <div className="k-form-row">
        <label className="k-field">
          <span className="k-label">Име</span>
          <input className="k-input" name="name" autoComplete="name" placeholder="Иван Петров" aria-invalid={invalid("name")} required />
        </label>
        <label className="k-field">
          <span className="k-label">
            Телефон <small>· за напомнянето в деня</small>
          </span>
          <input
            className="k-input"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0888 123 456"
            aria-invalid={invalid("phone")}
            required
          />
        </label>
      </div>
      <label className="k-field">
        <span className="k-label">
          Имейл <small>· там идва билетът</small>
        </span>
        <input className="k-input" name="email" type="email" inputMode="email" autoComplete="email" placeholder="ime@firma.bg" aria-invalid={invalid("email")} required />
      </label>

      <fieldset className="k-field" style={{ border: 0, padding: 0, margin: 0 }} aria-invalid={invalid("role")}>
        <legend className="k-label" style={{ marginBottom: 6 }}>
          Имаш ли бизнес?
        </legend>
        <div className="k-choices k-choices--2">
          {KINO_ROLES.map((r) => (
            <label className="k-choice" key={r.id}>
              <input type="radio" name="role" value={r.id} />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      {!compact && (
        <label className="k-field">
          <span className="k-label">
            Какво ти яде най-много време? <small>· по желание</small>
          </span>
          <textarea className="k-textarea" name="pain" maxLength={1000} placeholder="Например: телефонът звъни, докато шофирам; офертите ги пиша вечер…" />
        </label>
      )}

      <label className="k-check">
        <input type="checkbox" name="consent" aria-invalid={invalid("consent")} />
        <span>
          Искам напомняне за прожекцията по имейл, SMS и Viber и съм съгласен Pro Marketing да обработва данните ми според{" "}
          <a className="k-link" href="/privacy" target="_blank" rel="noopener">
            политиката за поверителност
          </a>
          .
        </span>
      </label>

      <div className="k-hp" aria-hidden="true">
        <label>
          Уебсайт
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div id="k-form-error" aria-live="polite">
        {error && <p className="k-error">{error.message}</p>}
        {state === "done" && <p className="k-ok">Билетът е твой! Отваряме го…</p>}
        {state === "mailed" && (
          <p className="k-ok">Готово — мястото ти е запазено. Билетът с линка към залата е на имейла ти (виж и „Промоции“).</p>
        )}
      </div>

      <button type="submit" className="k-btn k-btn--primary k-btn--block" disabled={state !== "idle"}>
        {state === "sending" ? "Запазваме мястото ти…" : state === "done" || state === "mailed" ? "Готово ✓" : `🎟️ ${submitLabel}`}
      </button>
      <p className="k-muted" style={{ fontSize: "0.82rem", margin: 0, textAlign: "center" }}>
        Безплатно. Без карта. Около 40 минути филм + до 15 минути на живо.
      </p>
    </form>
  );
}
