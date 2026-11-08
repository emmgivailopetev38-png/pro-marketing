"use client";
/* Формата на /obuchenie-az → POST /api/leads/obuchenie-az.
   Задължителни: име, телефон, съгласие. UTM-ите от адреса отиват в скрити
   полета; пикселът и сървърът (CAPI) пращат Lead с едно и също event_id. */
import { useState } from "react";
import { Check, Loader2, Phone } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { ga4Event, gadsConversion } from "@/lib/google/gtag-client";
import { newEventId, track as pixelTrack } from "@/lib/meta/pixel-client";
import { EMPLOYEE_OPTIONS, UTM_KEYS, normalizeBgPhone, type Utm } from "@/lib/leads/obuchenie-az";

type Status = "idle" | "sending" | "done" | "error";

const field =
  "w-full rounded-xl border border-[var(--v2-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-base text-[var(--v2-ink)] outline-none transition placeholder:text-[var(--v2-faint)] focus:border-[var(--v2-cyan)]";
const label = "mb-1.5 block text-sm font-medium text-[var(--v2-muted)]";

/** UTM-ите от адреса на страницата (рекламата ги слага) — четат се при изпращане. */
function utmFromUrl(): Utm {
  const u: Utm = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = q.get(k);
      if (v) u[k] = v.slice(0, 200);
    }
  } catch {
    /* без UTM */
  }
  return u;
}

export function ObuchenieAzForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ full_name: "", phone: "", email: "", company: "", employees: "", consent: false, website: "" });


  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setError(null);
    if (f.full_name.trim().length < 2) return setError("Напиши име и фамилия.");
    if (!normalizeBgPhone(f.phone)) return setError("Телефонът не изглежда верен — напиши го като 0888 123 456.");
    if (!f.consent) return setError("Отметни съгласието, за да можем да ти звъннем.");
    setStatus("sending");
    const eventId = newEventId();
    const utm = utmFromUrl();
    track("obuchenie_az_submit_attempted", { employees: f.employees || null });
    try {
      const res = await fetch("/api/leads/obuchenie-az", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: f.full_name,
          phone: f.phone,
          email: f.email || undefined,
          company: f.company || undefined,
          employees: f.employees || undefined,
          consent: true,
          utm,
          event_id: eventId,
          website: f.website || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setStatus("error");
        setError(json.error || "Нещо се обърка. Опитай пак или звънни на 0876 447 159.");
        track("obuchenie_az_submit_failed", { status: res.status });
        return;
      }
      pixelTrack("Lead", { eventID: eventId, params: { content_name: "obuchenie_az", content_category: "ai_training_az" } });
      gadsConversion("lead", { transactionId: eventId });
      ga4Event("generate_lead", { form: "ObuchenieAzForm" });
      track("obuchenie_az_submitted", { employees: f.employees || null, ...utm });
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Няма връзка. Опитай пак или звънни на 0876 447 159.");
    }
  }

  if (status === "done") {
    return (
      <div className="v2-glass p-7 text-center sm:p-9" role="status">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(52,211,153,0.12)" }}>
          <Check className="h-8 w-8" style={{ color: "var(--v2-mint)" }} aria-hidden />
        </div>
        <p className="font-display text-xl font-bold text-[var(--v2-ink)] sm:text-2xl">Готово!</p>
        <p className="mx-auto mt-2 max-w-sm text-[var(--v2-muted)]">
          Звъним ти до минути (делник 10:00–18:00) от{" "}
          <a href="tel:+359876447159" className="font-semibold text-[var(--v2-ink)] underline decoration-[var(--v2-cyan)]/50 underline-offset-4">
            0876 447 159
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="v2-glass grid gap-4 p-5 sm:p-8">
      <div>
        <label htmlFor="az-name" className={label}>
          Име и фамилия *
        </label>
        <input id="az-name" className={field} required autoComplete="name" maxLength={120} placeholder="Иван Иванов" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
      </div>
      <div>
        <label htmlFor="az-phone" className={label}>
          Телефон *
        </label>
        <input id="az-phone" className={field} type="tel" inputMode="tel" required autoComplete="tel" maxLength={40} placeholder="0888 123 456" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="az-email" className={label}>
            Имейл
          </label>
          <input id="az-email" className={field} type="email" inputMode="email" autoComplete="email" maxLength={200} placeholder="ime@firma.bg" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label htmlFor="az-company" className={label}>
            Фирма
          </label>
          <input id="az-company" className={field} autoComplete="organization" maxLength={200} placeholder="Име на фирмата" value={f.company} onChange={(e) => set("company", e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="az-emp" className={label}>
          Служители на трудов договор
        </label>
        <select id="az-emp" className={`${field} appearance-none`} value={f.employees} onChange={(e) => set("employees", e.target.value)}>
          <option value="">Избери</option>
          {EMPLOYEE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* honeypot — скрито от хората и от екранните четци */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="az-website">Уебсайт</label>
        <input id="az-website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--v2-muted)]">
        <input
          type="checkbox"
          required
          checked={f.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--v2-cyan)]"
        />
        <span>
          Съгласен съм да ме потърсите по телефон и имейл ·{" "}
          <a href="/privacy" target="_blank" rel="noopener" className="text-[var(--v2-cyan)] underline underline-offset-4">
            Политика за поверителност
          </a>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="v2-btn v2-btn-primary is-lg w-full justify-center disabled:opacity-70">
        {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Phone className="h-5 w-5" aria-hidden />}
        {status === "sending" ? "Изпращаме…" : "Звъннете ми"}
      </button>
      <p className="text-center text-xs text-[var(--v2-faint)]">Звъним до минути в делник 10:00–18:00 · 0876 447 159</p>
    </form>
  );
}
