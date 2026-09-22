"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { salesAction, salesDnevnikAction } from "@/app/ekip/prodazhbi/actions";
import { DnevnikForm } from "@/components/admin/clients/DnevnikForm";
import { STAGE_COLOR, STAGE_LABEL, type ContactStage } from "@/lib/contacts/types";
import { moodOf, REMIND_PRESETS } from "@/lib/contacts/dnevnik";
import { SERVICE_TYPES, SERVICE_TYPE_LABEL } from "@/lib/team/service-types";
import type { SalesRow } from "@/lib/team/sales";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Един картон в таблото на продавача. Отгоре кой е и докъде е, после
 * бутоните: записах разговор · оферта · спечелен · загубен · напомняне ·
 * предай на Ивайло. Картата не изчезва след действие — човекът вижда какво е
 * станало и решава нататък.
 */

const PANEL = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const FIELD =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]";
const STAGES: ContactStage[] = ["contacted", "discovery", "presentation_sent", "offer_sent", "negotiating"];

function when(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

function ago(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `преди ${Math.max(1, Math.round(diff / 60))} мин`;
  if (diff < 86400) return `преди ${Math.round(diff / 3600)} ч`;
  return `преди ${Math.round(diff / 86400)} дни`;
}

function Submit({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "go" | "win" | "bad" }) {
  const { pending } = useFormStatus();
  const cls =
    tone === "go"
      ? "border-[var(--color-accent-cyan)]/50 text-[var(--color-accent-cyan)]"
      : tone === "win"
        ? "border-emerald-400/50 text-emerald-300"
        : tone === "bad"
          ? "border-rose-400/40 text-rose-300"
          : "border-white/15 text-[var(--color-text-secondary)]";
  return (
    <button type="submit" disabled={pending} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${cls}`}>
      {pending ? "…" : children}
    </button>
  );
}

function Result({ res }: { res: EkipActionResult | null }) {
  if (!res) return null;
  return <p className={`mt-2 text-xs ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</p>;
}

type Panel = "none" | "dnevnik" | "offer" | "won" | "lost" | "remind" | "handoff" | "stage";

export function SalesCard({ row, mode, isOwner = false }: { row: SalesRow; mode: "today" | "overdue" | "handed" | "pipeline" | "won" | "lost"; isOwner?: boolean }) {
  const [panel, setPanel] = useState<Panel>("none");
  const [res, act] = useActionState(salesAction, null);
  const color = STAGE_COLOR[row.stage as ContactStage] ?? "#7da8cc";
  const mood = moodOf(row.mood);
  const closed = row.stage === "won" || row.stage === "lost";
  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? "none" : p));

  return (
    <article id={`sales-${row.id}`} className={PANEL} style={{ borderColor: mode === "overdue" ? "rgba(251,113,133,.35)" : mode === "today" ? "rgba(252,211,77,.35)" : undefined }}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug">
            {row.full_name ?? row.company ?? "Без име"}
            {mood && (
              <span className="ml-2 text-base" title={mood.label}>
                {mood.emoji}
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            {[row.company, row.business].filter(Boolean).join(" · ") || "—"}
            {row.deal_value_eur != null ? ` · ${row.deal_value_eur.toLocaleString("bg-BG")} €` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
          {STAGE_LABEL[row.stage as ContactStage] ?? row.stage}
        </span>
      </header>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {row.phone && (
          <a href={`tel:${row.phone}`} className="rounded-full border border-[var(--color-accent-cyan)]/40 px-3 py-1 font-semibold text-[var(--color-accent-cyan)]">
            📞 {row.phone}
          </a>
        )}
        {row.email && (
          <a href={`mailto:${row.email}`} className="rounded-full border border-white/10 px-3 py-1 text-[var(--color-text-secondary)]">
            ✉️ {row.email}
          </a>
        )}
        {isOwner && (
          <a href={`/admin/clients/${row.id}`} className="rounded-full border border-white/10 px-3 py-1 text-[var(--color-text-tertiary)]">
            картонът
          </a>
        )}
      </div>

      <div className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
        {row.next_followup_at && (
          <p>
            🔔 да го чуя: <b className={mode === "overdue" ? "text-rose-300" : "text-amber-200"}>{when(row.next_followup_at)}</b>
          </p>
        )}
        {row.next_meeting && (
          <p>
            📅 среща: <b className="text-emerald-300">{when(row.next_meeting)}</b>
          </p>
        )}
        {row.promises.length > 0 && (
          <ul className="space-y-0.5">
            {row.promises.slice(0, 4).map((p) => (
              <li key={p.id}>
                {p.who === "them" ? "🤝 той обеща:" : "🫡 аз обещах:"} {p.text}
              </li>
            ))}
          </ul>
        )}
        {row.last_activity && (
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {row.last_activity.by ?? "—"} · {row.last_activity.title} · {ago(row.last_activity.at)}
          </p>
        )}
      </div>

      {!closed && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => toggle("dnevnik")} className="rounded-xl border border-[var(--color-accent-cyan)]/50 px-3 py-2 text-xs font-semibold text-[var(--color-accent-cyan)]">
            ✍️ Записах разговор
          </button>
          <button type="button" onClick={() => toggle("offer")} className="rounded-xl border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-200">
            💎 Пратих оферта
          </button>
          <button type="button" onClick={() => toggle("won")} className="rounded-xl border border-emerald-400/50 px-3 py-2 text-xs font-semibold text-emerald-300">
            🏆 Спечелен
          </button>
          <button type="button" onClick={() => toggle("remind")} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            🔔 Чуване
          </button>
          <button type="button" onClick={() => toggle("stage")} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            🔄 Етап
          </button>
          <button type="button" onClick={() => toggle("lost")} className="rounded-xl border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-300">
            ✕ Загубен
          </button>
          {!isOwner && (
            <button type="button" onClick={() => toggle("handoff")} className="rounded-xl border border-violet-400/40 px-3 py-2 text-xs font-semibold text-violet-200">
              🤝 На Ивайло
            </button>
          )}
        </div>
      )}

      {panel === "dnevnik" && (
        <div className="mt-3 rounded-xl border border-white/10 p-3">
          <DnevnikForm contactId={row.id} compact action={salesDnevnikAction} onSaved={() => setPanel("none")} />
        </div>
      )}

      {panel === "offer" && (
        <form action={act} className="mt-3 space-y-2 rounded-xl border border-amber-400/20 p-3">
          <input type="hidden" name="contact_id" value={row.id} />
          <input type="hidden" name="action" value="offer" />
          <div className="grid grid-cols-2 gap-2">
            <input name="deal_value" inputMode="decimal" placeholder="сума в € (с ДДС)" defaultValue={row.deal_value_eur ?? ""} className={FIELD} />
            <select name="remind_preset" defaultValue="3d" className={FIELD}>
              {REMIND_PRESETS.map((r) => (
                <option key={r.key} value={r.key}>
                  чуване {r.label}
                </option>
              ))}
            </select>
          </div>
          <input name="note" placeholder="какво съдържа офертата, с една дума" className={FIELD} />
          <Submit tone="go">Запиши офертата</Submit>
        </form>
      )}

      {panel === "won" && (
        <form action={act} className="mt-3 space-y-2 rounded-xl border border-emerald-400/20 p-3">
          <input type="hidden" name="contact_id" value={row.id} />
          <input type="hidden" name="action" value="won" />
          <select name="service_type" required defaultValue="" className={FIELD}>
            <option value="" disabled>
              вид услуга — по нея е комисионната
            </option>
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SERVICE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <input name="deal_value" inputMode="decimal" placeholder="сума на сделката в € (с ДДС)" defaultValue={row.deal_value_eur ?? ""} className={FIELD} />
          <input name="note" placeholder="какво точно купи, кога стартира" className={FIELD} />
          <Submit tone="win">🏆 Отбележи спечелен</Submit>
        </form>
      )}

      {panel === "lost" && (
        <form action={act} className="mt-3 space-y-2 rounded-xl border border-rose-400/20 p-3">
          <input type="hidden" name="contact_id" value={row.id} />
          <input type="hidden" name="action" value="lost" />
          <input name="note" placeholder="защо — с негови думи, за да се учим" className={FIELD} />
          <Submit tone="bad">Отбележи загубен</Submit>
        </form>
      )}

      {panel === "remind" && (
        <form action={act} className="mt-3 space-y-2 rounded-xl border border-white/10 p-3">
          <input type="hidden" name="contact_id" value={row.id} />
          <input type="hidden" name="action" value="remind" />
          <div className="grid grid-cols-2 gap-2">
            <select name="remind_preset" defaultValue="tomorrow" className={FIELD}>
              {REMIND_PRESETS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
            <input type="datetime-local" name="remind_at" className={FIELD} title="или точен ден и час" />
          </div>
          <input name="note" placeholder="за какво ще говорите" className={FIELD} />
          <Submit>Запиши напомняне</Submit>
        </form>
      )}

      {panel === "stage" && (
        <form action={act} className="mt-3 flex flex-wrap gap-2 rounded-xl border border-white/10 p-3">
          <input type="hidden" name="contact_id" value={row.id} />
          <input type="hidden" name="action" value="stage" />
          <select name="stage" defaultValue={row.stage} className={`${FIELD} max-w-xs`}>
            {STAGES.map((st) => (
              <option key={st} value={st}>
                {STAGE_LABEL[st]}
              </option>
            ))}
          </select>
          <Submit>Смени етапа</Submit>
        </form>
      )}

      {panel === "handoff" && (
        <form action={act} className="mt-3 space-y-2 rounded-xl border border-violet-400/20 p-3">
          <input type="hidden" name="contact_id" value={row.id} />
          <input type="hidden" name="action" value="handoff" />
          <input type="datetime-local" name="retry_at" className={FIELD} title="докога Ивайло да звънне" />
          <input name="note" placeholder="какво каза човекът и защо е за Ивайло" className={FIELD} />
          <Submit>🤝 Предай на Ивайло</Submit>
        </form>
      )}

      <Result res={res} />
    </article>
  );
}
