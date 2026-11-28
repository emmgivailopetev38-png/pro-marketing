"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import { newEventId, track as pixelTrack } from "@/lib/meta/pixel-client";
import {
  SKORO_MS,
  eVgradenBrauzar,
  prochetiZapisan,
  viberDeepLink,
  zapisGreshka,
  zapisanKlyuch,
  zapisanStoinost,
} from "@/lib/uebinar/zapis";

/**
 * Формата за записване за /na-zhivo — един прозорец, който се отваря от всеки
 * бутон с `data-zapis` на страницата. Без отделна страница за потвърждение
 * (Стефчо, 21.11.2026): след записване прозорецът показва „Записан си“ и
 * линк за календара.
 *
 * 28.11.2026 — записването се помни в браузъра (localStorage). Преди това човек
 * натискаше бутона за Viber, връщаше се, страницата беше заредена наново и не
 * личеше, че е записан → записваше се пак (един човек 3 пъти за 7 минути). Сега
 * при връщане вижда отново потвърждението с бутона за Viber.
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
  /**
   * Поканата за Viber канала на обучението — ДИРЕКТНИЯТ линк (invite.viber.com), не нашият
   * /viber: телефонът отваря приложението направо само когато се натисне самият линк на Viber,
   * а не пренасочване от друг адрес. Първата стъпка след записването, когато го има.
   */
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
  /** Записан при предишно зареждане на страницата (върнал се е) — името идва от браузъра. */
  const [predi, setPredi] = useState<string | null>(null);
  const [vgraden, setVgraden] = useState(false);

  // Върнал ли се е вече записан човек? (След зареждането — на сървъра няма localStorage.)
  useEffect(() => {
    setVgraden(eVgradenBrauzar(navigator.userAgent));
    let z = null;
    try {
      z = prochetiZapisan(window.localStorage.getItem(zapisanKlyuch(slug)));
    } catch {
      /* без достъп до localStorage (частен режим) — формата работи както преди */
    }
    if (!z) return;
    setPredi(z.ime);
    setState("done");
    // Току-що се е записал и се връща (от Viber или календара) → показваме му пак потвърждението.
    if (Date.now() - z.ts < SKORO_MS) {
      const d = ref.current;
      try {
        if (d && !d.open) d.showModal();
      } catch {
        /* прозорецът не може да се отвори сега — ще се отвори от бутона */
      }
    }
  }, [slug]);

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

  /** Едно изпращане към сървъра; при прекъсната връзка или грешка на сървъра — още един опит след малко. */
  async function izprati(payload: string): Promise<{ ok: true; already: boolean } | { ok: false; status: number | null; kod: string | null }> {
    for (let opit = 0; opit < 2; opit++) {
      try {
        const r = await fetch("/api/uebinar/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        const j = (await r.json().catch(() => null)) as { ok?: boolean; already?: boolean; error?: string } | null;
        if (r.ok) return { ok: true, already: j?.already === true };
        // 4xx = данните не са наред → нов опит със същите данни е безсмислен.
        if (r.status < 500) return { ok: false, status: r.status, kod: j?.error ?? null };
        if (opit === 1) return { ok: false, status: r.status, kod: j?.error ?? null };
      } catch {
        if (opit === 1) return { ok: false, status: null, kod: null };
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
    return { ok: false, status: null, kod: null };
  }

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
    const r = await izprati(
      JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
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
    );
    if (!r.ok) {
      setState("error");
      setError(zapisGreshka(r.status, r.kod));
      track("uebinar_register_error", { uebinar: slug, status: r.status ?? 0, kod: r.kod ?? "", varianta });
      return;
    }
    setState("done");
    try {
      window.localStorage.setItem(zapisanKlyuch(slug), zapisanStoinost(name, Date.now()));
    } catch {
      /* без localStorage — само няма да се помни при връщане */
    }
    // Вече записан (върнал се е и е пуснал формата пак) → не е ново записване за Meta и статистиката.
    if (r.already) {
      track("uebinar_registered_again", { uebinar: slug, varianta });
      return;
    }
    track("uebinar_registered", { uebinar: slug, varianta });
    pixelTrack("CompleteRegistration", {
      eventID: eventId,
      params: { content_name: `uebinar-${slug}`, status: "registered", ...(varianta ? { varianta } : {}) },
    });
  }

  /** „Записвам друг човек“ — връща празната форма (записът в браузъра остава за първия). */
  function novZapis() {
    setPredi(null);
    setName("");
    setPhone("");
    setEmail("");
    setAgree(false);
    setError(null);
    setState("idle");
  }

  const malkoIme = (name.trim() || predi || "").split(/\s+/)[0];
  const viberApp = viberDeepLink(viberHref);

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
              {malkoIme ? ` ${malkoIme}, ще се видим на живо.` : ""}
            </h2>
            <p className="nz-done-date">{dateLabel}</p>
            {viberHref ? (
              <>
                {/* Страницата за потвърждение (картата на Стефчо, 25.11): първо Viber канала, после календара */}
                <p>Остана една стъпка: влез в моя Viber канал „Ивайло Петев · Допълнителен доход с AI“. Там ще пусна линка за влизане в неделя.</p>
                <a className="nz-btn" href={viberHref} target="_blank" rel="noopener noreferrer">
                  ВЛЕЗ ВЪВ VIBER КАНАЛА
                </a>
                {viberApp ? (
                  <p className="nz-done-help">
                    Ако Viber не се отвори, <a href={viberApp}>натисни тук</a>.
                    {vgraden ? " Ако пак не става, натисни трите точки горе и избери „Отвори в браузъра“." : ""}
                  </p>
                ) : null}
                <a className="nz-btn-sec" href={calendarHref} target="_blank" rel="noopener noreferrer">
                  {calendarLabel}
                </a>
                <p className="nz-done-help">Пратих ти и имейл с потвърждение. Линкът за влизане ще дойде там и във Viber канала.</p>
              </>
            ) : (
              <>
                <p>{doneBody}</p>
                <a className="nz-btn" href={calendarHref} target="_blank" rel="noopener noreferrer">
                  {calendarLabel}
                </a>
              </>
            )}
            {predi !== null ? (
              <p className="nz-done-help">
                <button type="button" className="nz-link" onClick={novZapis}>
                  Записвам друг човек
                </button>
              </p>
            ) : null}
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

            {/* Капан за ботове — човек не го вижда. Името НЕ е „website“: браузърите попълват такова
                поле сами (автоматично попълване) и тогава сървърът взима истински човек за бот. */}
            <input
              className="nz-hp"
              tabIndex={-1}
              autoComplete="off"
              name="pm_ostavi_prazno"
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
