"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import { newEventId, track as pixelTrack } from "@/lib/meta/pixel-client";

/**
 * Формата за записване за /na-zhivo — един прозорец, който се отваря от всеки
 * бутон с `data-zapis` на страницата. Без отделна страница за потвърждение
 * (Стефчо, 21.11.2026): след записване прозорецът показва „Записан си“ и
 * линк за календара.
 */
export function ZapisForm({
  slug,
  title,
  dateLabel,
  button,
  consent,
  doneTitle,
  doneBody,
  calendarLabel,
  calendarHref,
  viberHref = null,
  varianta,
}: {
  slug: string;
  title: string;
  dateLabel: string;
  button: string;
  consent: string;
  doneTitle: string;
  doneBody: string;
  calendarLabel: string;
  calendarHref: string;
  /** Viber каналът на обучението (ivailopetev.com/viber) — първата стъпка след записването, когато го има */
  viberHref?: string | null;
  /** A/B тестът на лендинга — коя версия е видял човекът (lib/uebinar/ab.ts) */
  varianta?: "A" | "B";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Всеки бутон с data-zapis отваря прозореца (страницата остава сървърна).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest("[data-zapis]");
      if (!el) return;
      e.preventDefault();
      const d = ref.current;
      if (d && !d.open) {
        d.showModal();
        track("uebinar_form_open", { uebinar: slug, place: el.getAttribute("data-zapis") || "", varianta });
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug, varianta]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    if (phone.replace(/\D/g, "").length < 9) {
      setError("Провери телефона: трябват поне 9 цифри.");
      return;
    }
    if (!agree) {
      setError("Отбележи съгласието, за да ти пратим линка.");
      return;
    }
    setState("sending");
    const q = new URLSearchParams(window.location.search);
    const pick = (k: string) => q.get(k) || undefined;
    // Един и същ event_id за пиксела в браузъра и за сървъра (Conversions API).
    const eventId = newEventId();
    try {
      const r = await fetch("/api/uebinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          consent: true,
          utm_source: pick("utm_source"),
          utm_medium: pick("utm_medium"),
          utm_campaign: pick("utm_campaign"),
          utm_content: pick("utm_content"),
          utm_term: pick("utm_term"),
          fbclid: pick("fbclid"),
          event_id: eventId,
          varianta,
          website,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setState("done");
      track("uebinar_registered", { uebinar: slug, varianta });
      pixelTrack("CompleteRegistration", {
        eventID: eventId,
        params: { content_name: `uebinar-${slug}`, status: "registered", ...(varianta ? { varianta } : {}) },
      });
    } catch {
      setState("error");
      setError("Не успях да те запиша. Опитай пак след малко.");
    }
  }

  return (
    <dialog
      ref={ref}
      className="nz-dialog"
      aria-labelledby="nz-form-title"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="nz-dialog-in">
        <button type="button" className="nz-x" aria-label="Затвори" onClick={() => ref.current?.close()}>
          ×
        </button>

        {state === "done" ? (
          <div className="nz-done" role="status">
            <p className="nz-done-ico" aria-hidden>
              ✅
            </p>
            <h2 id="nz-form-title">
              {doneTitle}
              {name.trim() ? ` ${name.trim().split(" ")[0]}, ще се видим на живо.` : ""}
            </h2>
            <p className="nz-done-date">{dateLabel}</p>
            {viberHref ? (
              <>
                {/* Страницата за потвърждение (картата на Стефчо, 25.11): първо Viber канала, после календара */}
                <p>Остана една стъпка: влез в моя Viber канал „Ивайло Петев · Допълнителен доход с AI“. Там ще пусна линка за влизане в неделя.</p>
                <a className="nz-btn" href={viberHref} target="_blank" rel="noopener noreferrer">
                  ВЛЕЗ ВЪВ VIBER КАНАЛА
                </a>
                <a className="nz-btn-sec" href={calendarHref} target="_blank" rel="noopener noreferrer">
                  {calendarLabel}
                </a>
              </>
            ) : (
              <>
                <p>{doneBody}</p>
                <a className="nz-btn" href={calendarHref} target="_blank" rel="noopener noreferrer">
                  {calendarLabel}
                </a>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={submit} noValidate={false}>
            <h2 id="nz-form-title">{title}</h2>
            <p className="nz-form-date">{dateLabel}</p>
            <p className="nz-pointer" aria-hidden>👇👇👇</p>

            <label className="nz-field">
              <span>Име</span>
              <input
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как да те наричам"
              />
            </label>
            <label className="nz-field">
              <span>Телефон</span>
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0888 123 456"
              />
            </label>
            <label className="nz-field">
              <span>Имейл</span>
              <input
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ime@primer.bg"
              />
            </label>

            {/* Капан за ботове — човек не го вижда. */}
            <input
              className="nz-hp"
              tabIndex={-1}
              autoComplete="off"
              name="website"
              aria-hidden
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <label className="nz-consent">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                {consent}{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Поверителност
                </a>
              </span>
            </label>

            {error ? (
              <p className="nz-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="nz-btn nz-btn-full" disabled={state === "sending"}>
              {state === "sending" ? "Записвам те…" : button}
            </button>
            <p className="nz-form-foot">Безплатно е. Не въвеждаш карта.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
