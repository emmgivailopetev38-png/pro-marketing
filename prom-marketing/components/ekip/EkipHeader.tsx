"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function EkipHeader({ name, isOwner }: { name: string; isOwner: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/ekip/auth", { method: "DELETE" }).catch(() => {});
    router.push("/ekip/login");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[var(--color-bg-void)]/90 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">ProMarketing · звънене</p>
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
    </header>
  );
}
