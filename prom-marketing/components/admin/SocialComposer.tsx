"use client";
import { useState } from "react";
import type { CSSProperties } from "react";
import { toast } from "sonner";

interface Account {
  id: string;
  platform: string;
  username: string | null;
  profile_photo_url: string | null;
}

const PLATFORM_COLOR: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  linkedin: "#0A66C2",
  x: "#7dd3fc",
  tiktok: "#22d3ee",
  youtube: "#FF0000",
  pinterest: "#E60023",
  bluesky: "#0a7aff",
  threads: "#a78bfa",
};

export function SocialComposer({ accounts }: { accounts: Account[] }) {
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [media, setMedia] = useState("");
  const [schedule, setSchedule] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selectAll = () =>
    setSelected(selected.length === accounts.length ? [] : accounts.map((a) => a.id));

  const publish = async () => {
    if (!caption.trim()) return toast.error("Напиши текст за поста");
    if (selected.length === 0) return toast.error("Избери поне един канал");
    const when = schedule ? `за ${new Date(schedule).toLocaleString("bg-BG")}` : "сега";
    if (!window.confirm(`Публикувай в ${selected.length} канал(а) ${when}?`)) return;
    setBusy(true);
    try {
      const mediaUrls = media.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/admin/social/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caption,
          accountIds: selected,
          media: mediaUrls.length ? mediaUrls : undefined,
          scheduledAt: schedule || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Грешка при публикуване");
        return;
      }
      toast.success(schedule ? "Постът е насрочен ✓" : "Постът е публикуван ✓");
      setCaption("");
      setSelected([]);
      setMedia("");
      setSchedule("");
    } catch {
      toast.error("Грешка във връзката");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cc-panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Нов пост</h3>
        <span className="hud">{caption.length} симв.</span>
      </div>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder="Какво да публикуваме…"
        className="w-full rounded-lg border border-[var(--color-border-default)] bg-black/30 p-3 text-sm outline-none transition focus:border-[var(--color-accent-cyan)]/60"
      />

      <input
        value={media}
        onChange={(e) => setMedia(e.target.value)}
        placeholder="Линкове към снимки (по желание, разделени със запетая)"
        className="w-full rounded-lg border border-[var(--color-border-default)] bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-[var(--color-accent-cyan)]/60"
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="hud">Канали · избрани {selected.length}/{accounts.length}</p>
          <button onClick={selectAll} className="text-xs text-[var(--color-accent-cyan)] hover:underline">
            {selected.length === accounts.length ? "Изчисти" : "Избери всички"}
          </button>
        </div>
        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const on = selected.includes(a.id);
            const col = PLATFORM_COLOR[a.platform] ?? "#06b6d4";
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                type="button"
                className="flex items-center gap-2 rounded-lg border p-2 text-left transition"
                style={{ borderColor: on ? col : "var(--color-border-default)", background: on ? `${col}1a` : "rgba(255,255,255,0.02)" } as CSSProperties}
              >
                {a.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.profile_photo_url} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: col }} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[var(--color-text-primary)]">{a.username || "—"}</span>
                  <span className="block text-[10px] capitalize text-[var(--color-text-tertiary)]">{a.platform}</span>
                </span>
                {on && <span style={{ color: col }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-[var(--color-text-tertiary)]">Насрочи (по желание):</label>
        <input
          type="datetime-local"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="rounded-lg border border-[var(--color-border-default)] bg-black/30 px-3 py-1.5 text-sm outline-none transition focus:border-[var(--color-accent-cyan)]/60"
        />
        <button onClick={publish} disabled={busy} className="cc-btn cc-btn-primary ml-auto disabled:opacity-50">
          {busy ? "Публикувам…" : schedule ? "Насрочи пост" : "Публикувай сега"}
        </button>
      </div>
    </div>
  );
}
