"use client";
/* =====================================================================
   RobotWaitlistForm — „Запиши се първи" за робота. Минава през същата
   форма като останалия сайт (/api/leads/submit): контактът влиза в
   CRM-а, екипът получава известие, а съобщението казва, че е за робота.
   Само телефонът е задължителен — колкото по-малко полета, толкова
   повече записани.
   ===================================================================== */
import { useState } from "react";
import { Check, Phone, User } from "lucide-react";
import { track } from "@/lib/analytics/track";

const USES = ["Събития и партита", "Магазин", "Рецепция или хотел", "Друго"] as const;

type Status = "idle" | "submitting" | "success" | "error";

export function RobotWaitlistForm({ location }: { location: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [use, setUse] = useState<(typeof USES)[number] | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim() || undefined,
          phone,
          company_activity: use ? `Робот за: ${use}` : undefined,
          message: "🤖 Иска робот — записа се в списъка за поръчка (promarketing.pw/robot).",
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setStatus("success");
        track("robot_waitlist_submitted", { location, use });
      } else {
        setStatus("error");
        setError(res.status === 400 ? "Провери телефона — поне 6 цифри." : "Не се изпрати. Опитай пак след малко.");
        track("robot_waitlist_failed", { location, status: res.status });
      }
    } catch {
      setStatus("error");
      setError("Няма връзка. Опитай пак след малко.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center py-8 text-center" role="status">
        <span
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(34, 211, 238, 0.12)", boxShadow: "0 0 30px var(--v2-glow-cyan)" }}
        >
          <Check className="h-7 w-7" style={{ color: "var(--v2-cyan)" }} />
        </span>
        <p className="v2-title-plain" style={{ fontSize: "1.35rem", margin: 0 }}>
          Ти си в списъка.
        </p>
        <p className="v2-sub mt-2 max-w-xs" style={{ fontSize: "0.9rem" }}>
          Щом отворим поръчките, ти се обаждаме първи — с цената и датата.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <Field icon={<User className="h-4 w-4" />} label="Име" htmlFor={`${location}-name`}>
        <input
          id={`${location}-name`}
          type="text"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как да те наричаме"
          className="w-full bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
        />
      </Field>
      <Field icon={<Phone className="h-4 w-4" />} label="Телефон" htmlFor={`${location}-phone`}>
        <input
          id={`${location}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          minLength={6}
          maxLength={40}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08XX XXX XXX"
          className="w-full bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
        />
      </Field>

      <fieldset className="mb-5">
        <legend className="v2-mono mb-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--v2-faint)]">
          За какво ти трябва (по желание)
        </legend>
        <div className="flex flex-wrap gap-2">
          {USES.map((u) => {
            const on = use === u;
            return (
              <button
                key={u}
                type="button"
                aria-pressed={on}
                onClick={() => setUse(on ? null : u)}
                className="min-h-10 rounded-full px-3.5 text-sm transition-colors"
                style={{
                  border: `1px solid ${on ? "var(--v2-cyan)" : "var(--v2-line)"}`,
                  background: on ? "rgba(34, 211, 238, 0.12)" : "rgba(4, 6, 13, 0.4)",
                  color: on ? "var(--v2-cyan)" : "var(--v2-muted)",
                }}
              >
                {u}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p className="mb-3 text-sm" style={{ color: "#fb7185" }} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="v2-btn v2-btn-primary w-full justify-center disabled:opacity-60"
      >
        {status === "submitting" ? "Записваме…" : "Запиши ме първи"}
        <span aria-hidden className="v2-arrow">→</span>
      </button>
      <p className="mt-3 text-center text-xs text-[color:var(--v2-faint)]">
        Без спам. Обаждаме се веднъж — когато поръчките се отворят.
      </p>
    </form>
  );
}

function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-3 rounded-[var(--v2-r-sm)] px-4 py-3 transition-colors focus-within:border-[color:var(--v2-line-bright)]"
      style={{ border: "1px solid var(--v2-line)", background: "rgba(4, 6, 13, 0.4)" }}
    >
      <label
        htmlFor={htmlFor}
        className="v2-mono mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--v2-faint)]"
      >
        <span style={{ color: "var(--v2-cyan)" }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
