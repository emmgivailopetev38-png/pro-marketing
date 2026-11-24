"use client";
import { useState } from "react";
import type { ClientLink } from "@/lib/team/klient-materiali";

/**
 * Линковете за клиента с копиране. Видеата преди срещата приемат името на
 * човека (?ime=Иван) и го поздравяват — пиши името и копирай.
 */
export function ClientLinks({ links }: { links: ClientLink[] }) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const urlFor = (l: ClientLink) => (l.personal && name.trim() ? `${l.url}?ime=${encodeURIComponent(name.trim())}` : l.url);
  async function copy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    } catch {
      setCopied(null);
    }
  }
  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        Името на човека (за поздрава във видеото):
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="напр. Иван"
          className="w-40 rounded-md border border-white/15 bg-black/20 px-2 py-1 text-sm"
        />
      </label>
      <ul className="space-y-2">
        {links.map((l) => {
          const url = urlFor(l);
          return (
            <li key={l.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-sm font-semibold">{l.title}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{l.about}</p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Кога: {l.when}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copy(l.id, url)}
                  className="rounded-md border border-[var(--color-accent-cyan)]/50 px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-cyan)]"
                >
                  {copied === l.id ? "✓ копирано" : "📋 Копирай линка"}
                </button>
                <a href={url} target="_blank" rel="noreferrer" className="break-all font-mono text-[11px] text-[var(--color-text-tertiary)] underline">
                  {url}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
