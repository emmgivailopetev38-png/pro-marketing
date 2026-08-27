"use client";

import { useState, useTransition } from "react";
import { Share2, Copy, Check, X } from "lucide-react";
import { createSkriptShareLink } from "@/app/admin/(protected)/skript/actions";

/* Панелът, от който Ивайло си прави таен линк към този раздел.
   Линкът отваря само „Разговорът" — не е вход за CRM-а. */

const PERIODS: { label: string; days: number }[] = [
  { label: "30 дни", days: 30 },
  { label: "90 дни", days: 90 },
  { label: "1 година", days: 365 },
  { label: "безсрочен", days: 0 },
];

export function ShareLink() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [days, setDays] = useState(90);
  const [includeProgress, setIncludeProgress] = useState(false);
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function make() {
    setError("");
    setCopied(false);
    startTransition(async () => {
      try {
        const res = await createSkriptShareLink({ name, days, includeProgress, code });
        setUrl(`${window.location.origin}${res.path}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Линкът не се направи");
      }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Копирането не мина — маркирай линка и го копирай на ръка.");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="cc-btn text-[13px]">
        <Share2 className="size-4" /> Сподели раздела
      </button>
    );
  }

  return (
    <div className="cc-panel w-full max-w-xl p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
            Таен линк
          </p>
          <h3 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
            Само този раздел, за един човек
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            Отваря се без акаунт и не води доникъде другаде в CRM-а.
          </p>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Затвори" className="cc-btn px-2 py-2">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            За кого е
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Георги"
            className="w-full rounded-lg px-3 py-2 text-[14px]"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Валиден
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className="rounded-lg border px-3 py-1.5 text-[13px] transition"
                style={{
                  borderColor: days === p.days ? "var(--color-accent-cyan)" : "rgba(120,160,220,0.18)",
                  background: days === p.days ? "rgba(6,182,212,0.13)" : "transparent",
                  color: days === p.days ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Код за достъп <span className="opacity-70">(по желание)</span>
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="остави празно — стига само линкът"
            className="w-full rounded-lg px-3 py-2 text-[14px]"
          />
          <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
            Сложиш ли код, страницата го иска веднъж и го помни 30 дни. Прати го отделно от линка.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={includeProgress}
            onChange={(e) => setIncludeProgress(e.target.checked)}
            className="mt-1"
          />
          <span className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            Да вижда и <b className="text-[var(--color-text-primary)]">Напредък</b> — там излизат
            реални разбори с имена на клиенти и суми по сделки.
          </span>
        </label>

        <button onClick={make} disabled={pending} className="cc-btn cc-btn-primary disabled:opacity-50">
          <Share2 className="size-4" /> {pending ? "Правя го…" : "Направи линка"}
        </button>

        {error && <p className="text-[13px] text-[#fda4af]">{error}</p>}

        {url && (
          <div className="rounded-lg border border-[rgba(6,182,212,0.35)] bg-[rgba(6,182,212,0.07)] p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent-cyan)]">
              Готово — прати това
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg px-3 py-2 font-mono text-[12px]"
              />
              <button onClick={copy} className="cc-btn shrink-0 text-[13px]">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Копирано" : "Копирай"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
