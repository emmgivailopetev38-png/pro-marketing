"use client";
import { useState } from "react";
import { Phone, Mail, User, MessageSquare, Send, Loader2, Check } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

export function QuickLeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("success");
        setForm({ full_name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
        setError(json?.details || json?.error || "Грешка при изпращане");
      }
    } catch {
      setStatus("error");
      setError("Грешка при изпращане. Опитай отново.");
    }
  }

  return (
    <section
      id="kontakti"
      className="relative overflow-hidden border-y border-[var(--color-border-default)] py-24 md:py-32 scroll-mt-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.08) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-[1fr_1.2fr] md:gap-16 md:px-10">
        {/* Left side: pitch */}
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            Свържи се
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] md:text-5xl">
            Остави си контакта —<br />
            <span style={{ color: "var(--color-accent-cyan)" }}>ние се обаждаме.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-secondary)]">
            Не искаш да резервираш среща в календара? Просто остави име, имейл и
            телефон — обаждаме ти се в рамките на работния ден за безплатна
            консултация.
          </p>
          <div className="mt-8 space-y-2 text-sm text-[var(--color-text-tertiary)]">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              Или директно на <a href="tel:+359877399963" className="text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">+359 877 399 963</a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4" style={{ color: "var(--color-accent-cyan)" }} />
              <a href="mailto:ivailo@promarketing.pw" className="hover:text-[var(--color-accent-cyan)]">ivailo@promarketing.pw</a>
            </p>
          </div>
        </div>

        {/* Right side: form */}
        <form
          onSubmit={onSubmit}
          className="relative rounded-2xl border p-6 backdrop-blur md:p-8"
          style={{
            borderColor: "var(--color-border-bright)",
            background: "rgba(13, 18, 33, 0.7)",
            boxShadow: "0 0 60px rgba(6,182,212,0.08)",
          }}
        >
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-cyan)]/10">
                <Check className="h-8 w-8" style={{ color: "var(--color-accent-cyan)" }} />
              </div>
              <h3 className="font-display text-2xl font-bold">Получихме данните ти!</h3>
              <p className="mt-2 max-w-xs text-sm text-[var(--color-text-secondary)]">
                Обаждаме ти се в рамките на работния ден. Междувременно — спокойно разгледай{" "}
                <a href="/pitch" className="underline hover:text-[var(--color-accent-cyan)]">презентацията</a>.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]"
              >
                Изпрати още един →
              </button>
            </div>
          ) : (
            <>
              <FieldRow icon={<User className="h-4 w-4" />} label="Име" htmlFor="ql-name">
                <input
                  id="ql-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Иван Иванов"
                  className="w-full bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]/60"
                />
              </FieldRow>

              <FieldRow icon={<Mail className="h-4 w-4" />} label="Имейл" htmlFor="ql-email">
                <input
                  id="ql-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ime@example.com"
                  className="w-full bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]/60"
                />
              </FieldRow>

              <FieldRow icon={<Phone className="h-4 w-4" />} label="Телефон" htmlFor="ql-phone">
                <input
                  id="ql-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+359 88 123 4567"
                  className="w-full bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]/60"
                />
              </FieldRow>

              <FieldRow icon={<MessageSquare className="h-4 w-4" />} label="Кратко съобщение (опционално)" htmlFor="ql-msg">
                <textarea
                  id="ql-msg"
                  rows={3}
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Какво те интересува? (по желание)"
                  className="w-full resize-none bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]/60"
                />
              </FieldRow>

              {error && (
                <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "var(--color-accent-cyan)",
                  color: "var(--color-bg-void)",
                }}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Изпращам…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Изпрати ми обаждане
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                ProMarketing LTD · Данните се обработват само за обратна връзка
              </p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

function FieldRow({
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
      className="mb-4 rounded-lg border px-4 py-3 transition-colors focus-within:border-[var(--color-accent-cyan)]"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]"
      >
        <span style={{ color: "var(--color-accent-cyan)" }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
