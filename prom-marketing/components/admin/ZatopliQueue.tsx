"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { STAGE_COLOR, STAGE_LABEL, type ContactRow } from "@/lib/contacts/types";
import { BAND_COLOR, BAND_LABEL, type WarmthResult, type WarmthBand } from "@/lib/contacts/warmth";
import {
  channelLinks,
  CHANNEL_COLOR,
  CHANNEL_ICON,
  CHANNEL_LABEL,
  type Channel,
} from "@/lib/contacts/channels";
import { warmMessage } from "@/lib/contacts/warm-message";
import { VERTICAL_DEMOS } from "@/lib/email/sequence-layout";
import { zatopliAction } from "@/app/admin/(protected)/zatopli/actions";

export interface ZatopliRow extends ContactRow {
  warmth: WarmthResult;
  link: string | null;
  last_messaged_at: string | null;
}

/** Колко дни след съобщение човекът е „вече писан" и слиза от главния списък. */
const RECENT_DAYS = 7;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function relative(iso: string): string {
  const d = daysAgo(iso);
  if (d === 0) return `днес`;
  if (d === 1) return `вчера`;
  if (d < 30) return `преди ${d} дни`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short", year: "2-digit" });
}

function isRecentlyMessaged(r: ZatopliRow): boolean {
  return r.last_messaged_at !== null && daysAgo(r.last_messaged_at) < RECENT_DAYS;
}

/** Насрочените се пазят от опашката — на тях вече е обещано нещо конкретно. */
function isScheduled(r: ZatopliRow): boolean {
  return r.next_followup_at !== null && new Date(r.next_followup_at) > new Date();
}

type FilterKey = "todo" | "hot" | "warm" | "untouched" | "cold" | "waiting";

const FILTERS: Array<{ key: FilterKey; label: string; hint: string }> = [
  { key: "todo", label: "За днес", hint: "всичко, което чака действие" },
  { key: "hot", label: "🔥 Звънни", hint: "вече вдигнаха ръка" },
  { key: "warm", label: "Затопли", hint: "има сигнал, но слаб" },
  { key: "untouched", label: "Недокоснати", hint: "не са чули нищо от нас" },
  { key: "cold", label: "Нов повод", hint: "получиха писма, нула реакция" },
  { key: "waiting", label: "Чакат", hint: "писано скоро или насрочено" },
];

export function ZatopliQueue({ rows }: { rows: ZatopliRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("todo");

  const { visible, counts } = useMemo(() => {
    const waiting = (r: ZatopliRow) => isRecentlyMessaged(r) || isScheduled(r);
    const todo = rows.filter((r) => !waiting(r));

    const match = (r: ZatopliRow): boolean => {
      switch (filter) {
        case "todo":
          return !waiting(r);
        case "waiting":
          return waiting(r);
        default:
          return !waiting(r) && r.warmth.band === (filter as WarmthBand);
      }
    };

    return {
      visible: rows.filter(match),
      counts: {
        todo: todo.length,
        hot: todo.filter((r) => r.warmth.band === "hot").length,
        warm: todo.filter((r) => r.warmth.band === "warm").length,
        untouched: todo.filter((r) => r.warmth.band === "untouched").length,
        cold: todo.filter((r) => r.warmth.band === "cold").length,
        waiting: rows.filter(waiting).length,
      } as Record<FilterKey, number>,
    };
  }, [rows, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            title={f.hint}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: filter === f.key ? "var(--color-accent-cyan)" : "var(--color-border-default)",
              background: filter === f.key ? "rgba(0,212,255,0.10)" : "transparent",
              color: filter === f.key ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
            }}
          >
            {f.label}
            <span className="font-mono text-[10px] opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <ZatopliCard key={r.id} row={r} />
        ))}
        {visible.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            Няма никого в този филтър.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
        Показани: {visible.length} от {rows.length} · съобщението се записва в картона чак когато натиснеш
        „Писах му“
      </p>
    </div>
  );
}

function ZatopliCard({ row: r }: { row: ZatopliRow }) {
  const [vertical, setVertical] = useState<string>("");
  const [formal, setFormal] = useState<boolean>(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState<Channel | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const generated = useMemo(
    () =>
      warmMessage({
        full_name: r.full_name,
        company: r.company,
        band: r.warmth.band,
        top_reason: r.warmth.reasons[0]?.label ?? null,
        link: r.link ?? "",
        vertical: vertical || null,
        formal,
      }).trimEnd(),
    [r, vertical, formal]
  );

  const text = draft ?? generated;
  const links = useMemo(() => channelLinks(r.phone, text), [r.phone, text]);
  const band = r.warmth.band;
  const messaged = isRecentlyMessaged(r);

  // Клипбордът се пълни при всеки канал — Viber и Telegram нямат друг начин да
  // получат текста, а при WhatsApp е застраховка, ако адресът се отреже.
  async function grab(channel: Channel) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(channel);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      // Клипбордът може да е забранен — линкът пак трябва да се отвори.
    }
    setOpen(true);
  }

  return (
    <div
      className="rounded-xl border p-4 transition-colors"
      style={{
        borderColor: band === "hot" ? "rgba(34,197,94,0.45)" : "var(--color-border-default)",
        background: band === "hot" ? "rgba(34,197,94,0.05)" : "rgba(13,18,33,0.4)",
      }}
    >
      {/* Кой е и колко е топъл */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/clients/${r.id}`}
              className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-cyan)]"
            >
              {r.full_name || r.email || r.phone || "—"}
            </Link>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${BAND_COLOR[band]}22`, color: BAND_COLOR[band] }}
            >
              {BAND_LABEL[band]} · {r.warmth.score}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${STAGE_COLOR[r.stage]}22`, color: STAGE_COLOR[r.stage] }}
            >
              {STAGE_LABEL[r.stage]}
            </span>
          </div>

          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {[r.company, r.phone, r.email].filter(Boolean).join(" · ") || "без контакти"}
          </p>

          {/* Защо е топъл — фактите, не оценката */}
          {r.warmth.reasons.length > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {r.warmth.reasons
                .slice(0, 3)
                .map((x) => `${x.label} · ${relative(x.occurred_at)}`)
                .join(" — ")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              нула реакции · в базата от {relative(r.created_at)}
            </p>
          )}

          {messaged && r.last_messaged_at && (
            <p className="mt-1 text-xs" style={{ color: "#facc15" }}>
              вече писано {relative(r.last_messaged_at)}
            </p>
          )}
        </div>

        {/* Каналите */}
        <div className="flex flex-wrap items-center gap-2">
          {links.map((l) =>
            l.href ? (
              <a
                key={l.channel}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                onClick={() => grab(l.channel)}
                title={l.caveat ?? CHANNEL_LABEL[l.channel]}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: `${CHANNEL_COLOR[l.channel]}55`,
                  color: CHANNEL_COLOR[l.channel],
                  background: `${CHANNEL_COLOR[l.channel]}10`,
                }}
              >
                <span aria-hidden>{CHANNEL_ICON[l.channel]}</span>
                {copied === l.channel ? "копирано ✓" : CHANNEL_LABEL[l.channel]}
              </a>
            ) : null
          )}
          {!r.phone && (
            <span className="rounded-lg border border-dashed border-[var(--color-border-default)] px-2.5 py-1.5 text-xs text-[var(--color-text-tertiary)]">
              няма телефон
            </span>
          )}
        </div>
      </div>

      {/* Съобщението */}
      <div className="mt-3 rounded-lg border border-[var(--color-border-default)] bg-[rgba(0,0,0,0.25)] p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <select
            value={vertical}
            onChange={(e) => {
              setVertical(e.target.value);
              setDraft(null);
            }}
            className="rounded-md border border-[var(--color-border-default)] bg-[rgba(13,18,33,0.8)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
          >
            <option value="">бранш · общо</option>
            {VERTICAL_DEMOS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setFormal((f) => !f);
              setDraft(null);
            }}
            className="rounded-md border border-[var(--color-border-default)] px-2 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent-cyan)]"
          >
            {formal ? "на Вие" : "на ти"}
          </button>

          {draft !== null && (
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md px-2 py-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
            >
              върни текста
            </button>
          )}

          {!r.link && (
            <span className="text-xs" style={{ color: "#fb923c" }}>
              без личен линк
            </span>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setDraft(e.target.value)}
          rows={7}
          className="w-full resize-y rounded-md border border-[var(--color-border-default)] bg-transparent p-2 font-mono text-xs leading-relaxed text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent-cyan)]"
        />
      </div>

      {/* Какво стана после — записва се чак тук */}
      {open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {links
            .filter((l) => l.href && l.channel !== "phone")
            .map((l) => (
              <form key={l.channel} action={zatopliAction}>
                <input type="hidden" name="contact_id" value={r.id} />
                <input type="hidden" name="action" value="sent" />
                <input type="hidden" name="channel" value={l.channel} />
                <input type="hidden" name="message" value={text} />
                <QueueButton label={`✓ Писах по ${CHANNEL_LABEL[l.channel]}`} tone="#22c55e" />
              </form>
            ))}
          <form action={zatopliAction}>
            <input type="hidden" name="contact_id" value={r.id} />
            <input type="hidden" name="action" value="reached" />
            <QueueButton label="🤝 Чухме се" tone="#00d4ff" />
          </form>
          <form action={zatopliAction}>
            <input type="hidden" name="contact_id" value={r.id} />
            <input type="hidden" name="action" value="called" />
            <QueueButton label="📞 Звъннах · не вдига" tone="#facc15" />
          </form>
          <form action={zatopliAction}>
            <input type="hidden" name="contact_id" value={r.id} />
            <input type="hidden" name="action" value="snooze" />
            <QueueButton label="😴 Не сега" tone="#7da8cc" />
          </form>
          <form action={zatopliAction}>
            <input type="hidden" name="contact_id" value={r.id} />
            <input type="hidden" name="action" value="not_interested" />
            <QueueButton label="✕ Не се интересува" tone="#64748b" />
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
        >
          отбележи какво стана →
        </button>
      )}
    </div>
  );
}

function QueueButton({ label, tone }: { label: string; tone: string }) {
  return (
    <button
      type="submit"
      className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{ borderColor: `${tone}55`, color: tone, background: `${tone}10` }}
    >
      {label}
    </button>
  );
}
