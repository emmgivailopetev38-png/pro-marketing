"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export interface EkipNavItem {
  href: string;
  label: string;
  module: string;
}

const SHORT: Record<string, string> = {
  zvanene: "📞 Звънене",
  prodazhbi: "💼 Продажби",
  proekti: "🛠 Проекти",
  zadachi: "✅ Задачи",
  saobshtenia: "💬 Съобщения",
  materiali: "📚 Материали",
  ceni: "💶 Цени",
  komisioni: "🏆 Комисионни",
};

/**
 * Шапката на /ekip: кой си, кои модули виждаш (по ролята и правата) и
 * непрочетените съобщения. На телефон менюто се плъзга хоризонтално.
 */
export function EkipHeader({
  name,
  isOwner,
  nav = [],
  section,
  unread = 0,
}: {
  name: string;
  isOwner: boolean;
  nav?: EkipNavItem[];
  section?: string;
  unread?: number;
}) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/ekip/auth", { method: "DELETE" }).catch(() => {});
    router.push("/ekip/login");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--color-bg-void)]/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">ProMarketing · екип</p>
          <p className="truncate text-sm font-semibold">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              href="/admin"
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent-cyan)]/60"
            >
              CRM
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-red-400/60 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" /> Изход
          </button>
        </div>
      </div>
      {nav.length > 1 && (
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2" aria-label="Модули">
          {nav.map((n) => {
            const active = n.module === section;
            const badge = n.module === "saobshtenia" && unread > 0 ? unread : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                  active
                    ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]"
                    : "border-white/10 text-[var(--color-text-secondary)]"
                }`}
              >
                {SHORT[n.module] ?? n.label}
                {badge > 0 && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{badge}</span>}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
