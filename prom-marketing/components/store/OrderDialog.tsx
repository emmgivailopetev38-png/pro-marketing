"use client";
/* =====================================================================
   OrderDialog — бутон „Поръчай сега” + мини форма (име, имейл, телефон,
   бележка) за мигновена поръчка на услуга. POST /api/order → CRM +
   имейли. Работи навсякъде, където има услуга за продаване.
   ===================================================================== */
import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { track as pixelTrack } from "@/lib/meta/pixel-client";

export function OrderDialog({
  service,
  buttonLabel = "Поръчай сега",
  className,
}: {
  /** Името на услугата — влиза в поръчката и в CRM активитито. */
  service: string;
  buttonLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    track("store_order_submitted", { service });
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, phone, service, note }),
      });
      if (!res.ok) throw new Error("bad");
      pixelTrack("Lead", { params: { content_name: "store_order", content_category: service } });
      setState("done");
    } catch {
      setState("error");
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[15px] text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60";

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); track("store_order_opened", { service }); }}
        className={
          className ??
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3.5 font-bold text-[var(--color-bg-void)] shadow-[0_0_36px_rgba(34,211,238,0.35)] transition hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]"
        }
      >
        <ShoppingCart className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Поръчка: ${service}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-cyan-400/30 bg-[rgba(7,12,16,0.97)] p-6 shadow-[0_0_80px_-16px_rgba(34,211,238,0.5)] md:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">Поръчка · без предплащане</p>
                <h3 className="mt-1 text-lg font-bold leading-snug text-white">{service}</h3>
              </div>
              <button
                type="button"
                aria-label="Затвори"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {state === "done" ? (
              <div className="py-6 text-center">
                <p className="text-3xl">🎉</p>
                <h4 className="mt-3 text-lg font-bold text-white">Поръчката е приета!</h4>
                <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
                  Ще ти позвъним в следващите часове, за да уточним детайлите и да стартираме.
                  Проверù и пощата си.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-5 rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  Готово
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <input className={input} placeholder="Твоето име" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <input className={input} placeholder="Имейл" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                <input className={input} placeholder="Телефон (за уточняване на детайлите)" type="tel" required minLength={6} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                <textarea className={`${input} min-h-[70px] resize-none`} placeholder="Бележка (по желание): за какъв бизнес е, срокове…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3.5 font-bold text-[var(--color-bg-void)] shadow-[0_0_36px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] disabled:opacity-60"
                >
                  {state === "sending" ? "Изпращаме…" : "Потвърди поръчката →"}
                </button>
                {state === "error" && <p className="text-sm text-rose-400">Нещо се обърка — опитай пак.</p>}
                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  Без предварително плащане — първо се чуваме и уточняваме, после плащаш.{" "}
                  <a href="/usloviya-kursove" target="_blank" className="underline underline-offset-2">Условия</a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
