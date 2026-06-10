"use client";
import { useState } from "react";
import { Phone, Mail, User, MessageSquare, Send, Loader2, Check, Building2 } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

type Status = "idle" | "submitting" | "success" | "error";

export function QuickLeadFormV2() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_activity: "",
    message: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    track("lead_form_submit_attempted", { has_message: form.message.length > 0 });
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("success");
        track("lead_form_submitted", { source: "homepage_quick_form" });
        setForm({ full_name: "", email: "", phone: "", company_activity: "", message: "" });
      } else {
        setStatus("error");
        track("lead_form_submit_failed", { status: res.status, error: json?.error });
        setError(json?.details || json?.error || "Грешка при изпращане");
      }
    } catch (e) {
      setStatus("error");
      track("lead_form_submit_failed", { error: String(e) });
      setError("Грешка при изпращане. Опитай отново.");
    }
  }

  return (
    <section id="kontakti" className="v2-section scroll-mt-20">
      <div className="v2-wrap">
        <div className="relative grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          {/* Left side: pitch */}
          <div className="v2-reveal is-in">
            <span className="v2-eyebrow">Свържи се</span>
            <h2
              className="v2-title-plain mt-4"
              style={{ overflowWrap: "break-word", hyphens: "auto", wordBreak: "break-word" }}
              lang="bg"
            >
              Остави си контакта —<br />
              <span className="v2-grad">ние се обаждаме.</span>
            </h2>
            <p className="v2-sub mt-5 max-w-md">
              Не искаш да резервираш среща в календара? Просто остави име, имейл и
              телефон — обаждаме ти се в рамките на работния ден за безплатна
              консултация.
            </p>

            {/* Signature core — sits under the pitch, atmospheric */}
            <div className="relative mt-10 hidden h-[260px] w-full max-w-md overflow-hidden rounded-[var(--v2-r)] md:block">
              <NeuralCore radius={1.15} nodeCount={200} spin={0.8} />
            </div>

            <div className="mt-8 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-[color:var(--v2-muted)]">
                <Phone className="h-4 w-4" style={{ color: "var(--v2-cyan)" }} />
                Или директно на{" "}
                <a
                  href="tel:+359877399963"
                  className="text-[color:var(--v2-ink)] transition-colors hover:text-[color:var(--v2-cyan)]"
                >
                  +359 877 399 963
                </a>
              </p>
              <p className="flex items-center gap-2 text-[color:var(--v2-muted)]">
                <Mail className="h-4 w-4" style={{ color: "var(--v2-cyan)" }} />
                <a
                  href="mailto:ivailo@promarketing.pw"
                  className="transition-colors hover:text-[color:var(--v2-cyan)]"
                >
                  ivailo@promarketing.pw
                </a>
              </p>
            </div>
          </div>

          {/* Right side: form */}
          <form
            onSubmit={onSubmit}
            className="v2-glass v2-glow v2-reveal is-in relative p-6 md:p-8"
            style={{ ["--d" as string]: "0.1s" }}
          >
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "rgba(34, 211, 238, 0.1)" }}
                >
                  <Check className="h-8 w-8" style={{ color: "var(--v2-cyan)" }} />
                </div>
                <h3 className="v2-title-plain" style={{ fontSize: "1.5rem", margin: 0 }}>
                  Получихме данните ти!
                </h3>
                <p className="v2-sub mt-2 max-w-xs" style={{ fontSize: "0.875rem" }}>
                  Обаждаме ти се в рамките на работния ден. Междувременно — спокойно разгледай{" "}
                  <a
                    href="/pitch"
                    className="underline transition-colors hover:text-[color:var(--v2-cyan)]"
                  >
                    презентацията
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="v2-mono mt-6 text-xs uppercase tracking-[0.2em] text-[color:var(--v2-faint)] transition-colors hover:text-[color:var(--v2-cyan)]"
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
                    className="w-full bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
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
                    className="w-full bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
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
                    className="w-full bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
                  />
                </FieldRow>

                <FieldRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Фирма и дейност"
                  htmlFor="ql-company"
                >
                  <input
                    id="ql-company"
                    type="text"
                    maxLength={200}
                    autoComplete="organization"
                    value={form.company_activity}
                    onChange={(e) => setForm((f) => ({ ...f, company_activity: e.target.value }))}
                    placeholder="напр. Хотел Алба · хотелиерство · Варна"
                    className="w-full bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
                  />
                </FieldRow>

                <FieldRow
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Кратко съобщение (опционално)"
                  htmlFor="ql-msg"
                >
                  <textarea
                    id="ql-msg"
                    rows={3}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Какво те интересува? (по желание)"
                    className="w-full resize-none bg-transparent text-base text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
                  />
                </FieldRow>

                {error && (
                  <p
                    className="mt-4 rounded-md px-3 py-2 text-xs"
                    style={{
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#fca5a5",
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="v2-btn v2-btn-primary is-lg mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
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
                <p className="v2-mono mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-[color:var(--v2-faint)]">
                  ProMarketing LTD · Данните се обработват само за обратна връзка
                </p>
              </>
            )}
          </form>
        </div>
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
      className="mb-4 rounded-[var(--v2-r-sm)] px-4 py-3 transition-colors focus-within:border-[color:var(--v2-line-bright)]"
      style={{
        border: "1px solid var(--v2-line)",
        background: "rgba(4, 6, 13, 0.4)",
      }}
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
