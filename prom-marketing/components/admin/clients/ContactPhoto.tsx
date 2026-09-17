"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initials, moodOf } from "@/lib/contacts/dnevnik";

const SIZE = { sm: "h-11 w-11 text-sm", md: "h-16 w-16 text-lg", lg: "h-24 w-24 text-2xl" } as const;

/**
 * Кръгчето с човека: снимката, ако я има, иначе инициали; настроението в ъгъла.
 * С `editable` се качва от телефона (камера или галерия), взима се от адрес
 * (профил, сайт) или се маха — през /api/admin/contacts/[id]/photo.
 */
export function ContactPhoto({
  contactId,
  name,
  src,
  mood,
  size = "md",
  editable = false,
}: {
  contactId: string;
  name: string | null;
  src: string | null;
  mood?: string | null;
  size?: keyof typeof SIZE;
  editable?: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<string | null>(src);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const m = moodOf(mood);
  const api = `/api/admin/contacts/${contactId}/photo`;

  async function send(init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(api, init);
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; src?: string | null; error?: string };
      if (!r.ok || j.error) throw new Error(j.error ?? `Грешка ${r.status}`);
      setCurrent(j.src ?? null);
      setMenu(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не стана");
    } finally {
      setBusy(false);
    }
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const fd = new FormData();
    fd.set("file", f);
    void send({ method: "POST", body: fd });
  }

  function fromUrl() {
    const url = window.prompt("Адрес на снимката (профил, сайт, снимка от срещата):", "https://");
    if (!url || !/^https?:\/\//.test(url)) return;
    void send({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
  }

  const circle = (
    <div
      className={`relative flex ${SIZE[size]} shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[var(--color-accent-cyan)]/15 font-bold text-[var(--color-accent-cyan)]`}
    >
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
      {busy && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs">…</span>}
    </div>
  );

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div className="relative">
        {editable ? (
          <button type="button" onClick={() => setMenu((v) => !v)} title="Снимка" className="rounded-full focus:outline-none">
            {circle}
          </button>
        ) : (
          circle
        )}
        {m && (
          <span
            className="absolute -bottom-1 -right-1 rounded-full border border-black/40 px-1 text-base leading-none"
            style={{ background: "var(--color-bg-void)" }}
            title={`Последно настроение: ${m.label}`}
          >
            {m.emoji}
          </span>
        )}
      </div>
      {editable && menu && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-white/10 bg-[var(--color-bg-deep)] p-1 text-xs shadow-xl">
          <button type="button" onClick={() => fileRef.current?.click()} className="block w-full rounded px-2 py-1.5 text-left hover:bg-white/5">
            📷 Качи снимка (камера / галерия)
          </button>
          <button type="button" onClick={fromUrl} className="block w-full rounded px-2 py-1.5 text-left hover:bg-white/5">
            🔗 От адрес (профил, сайт, среща)
          </button>
          {current && (
            <button
              type="button"
              onClick={() => void send({ method: "DELETE" })}
              className="block w-full rounded px-2 py-1.5 text-left text-red-300 hover:bg-red-500/10"
            >
              ✕ Махни снимката
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && <p className="max-w-[12rem] text-center text-[10px] text-red-300">{error}</p>}
    </div>
  );
}
