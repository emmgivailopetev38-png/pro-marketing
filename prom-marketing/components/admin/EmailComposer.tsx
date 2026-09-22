"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Template {
  id: string;
  label: string;
  subject: (vars: Record<string, string>) => string;
  body: (vars: Record<string, string>) => string;
  defaultVars?: Record<string, string>;
}

const TEMPLATES: Template[] = [
  {
    id: "blank",
    label: "Празно съобщение",
    subject: () => "",
    body: () => "",
  },
  {
    id: "offer-generic",
    label: "Оферта · персонална страница",
    defaultVars: {
      firstName: "[Име]",
      slug: "krasimira",
    },
    subject: (v) =>
      `${v.firstName}, твоята персонална оферта от ProMarketing е готова`,
    body: (v) =>
      `Здравей, ${v.firstName},

Благодаря за интереса. Подготвих ти персонална страница с детайлна оферта — не PDF, не template, а конкретно за твоя бизнес:

👉 https://promarketing.pw/oferta/${v.slug}

Какво ще видиш:
— Какво ще построим конкретно за теб
— Стойност на всеки детайл с прозрачна разбивка
— 1 месец от старт до launch
— Всички текущи разходи

Запази 45-минутен разговор директно от страницата, или ми се обади на 0877 399 963.

Поздрави,
Ивайло Петев
ProMarketing LTD
+359 877 399 963
promarketing.pw`,
  },
  {
    id: "followup",
    label: "Follow-up · след първи разговор",
    defaultVars: { firstName: "[Име]" },
    subject: (v) => `${v.firstName}, продължение след нашия разговор`,
    body: (v) =>
      `Здравей, ${v.firstName},

Благодаря за времето днес. Както обещах, изпращам ти няколко конкретни стъпки за по-нататък:

1. [стъпка едно]
2. [стъпка две]
3. [стъпка три]

Кажи кога ти е удобно за следваща среща — мога утре сутрин или в петък следобед.

Поздрави,
Ивайло Петев
ProMarketing LTD
+359 877 399 963`,
  },
];

export function EmailComposer() {
  const [templateId, setTemplateId] = useState("blank");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const tpl = TEMPLATES.find((t) => t.id === templateId)!;

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id)!;
    const defaultVars = t.defaultVars ?? {};
    setVars(defaultVars);
    setSubject(t.subject(defaultVars));
    setBody(t.body(defaultVars));
  };

  const setVar = (key: string, value: string) => {
    const next = { ...vars, [key]: value };
    setVars(next);
    setSubject(tpl.subject(next));
    setBody(tpl.body(next));
  };

  const send = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Попълни Получател, Тема и Текст");
      return;
    }
    setBusy(true);
    try {
      // Plain text → simple HTML (preserve line breaks)
      const html = body
        .split("\n\n")
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          html,
          text: body,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? `HTTP ${res.status}`);
      } else {
        toast.success(`Изпратено · Resend id: ${data.id?.slice(0, 12)}…`);
        if (templateId === "blank") {
          setTo("");
          setSubject("");
          setBody("");
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Грешка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass space-y-4 rounded-xl p-6">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Шаблон
          </label>
          <select
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {tpl.defaultVars && Object.keys(tpl.defaultVars).length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Object.keys(tpl.defaultVars).map((key) => (
              <div key={key}>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                  {key}
                </label>
                <input
                  value={vars[key] ?? ""}
                  onChange={(e) => setVar(key, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass space-y-4 rounded-xl p-6">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            До
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="mt-2 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Тема
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Текст
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="mt-2 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-[var(--color-accent-cyan)]"
          />
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            Празните редове стават параграфи. Единичните се запазват като нов ред.
          </p>
        </div>
      </div>

      <Button onClick={send} disabled={busy} className="w-full sm:w-auto">
        {busy ? "Изпращане…" : "Изпрати"}
      </Button>
    </div>
  );
}
