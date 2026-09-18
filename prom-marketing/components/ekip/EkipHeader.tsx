"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/** Кой раздел стои отпред — звъненето на сетъра или проектите на доставката. */
export type EkipSection = "zvanene" | "proekti";

const SECTION_LABEL: Record<EkipSection, string> = {
  zvanene: "звънене",
  proekti: "проекти",
};

export function EkipHeader({
  name,
  isOwner,
  section = "zvanene",
}: {
  name: string;
  isOwner: boolean;
  section?: EkipSection;
}) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/ekip/auth", { method: "DELETE" }).catch(() => {});
    router.push("/ekip/login");
    router.refresh();
  }
  const pill =
    "rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent-cyan)]/60";
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[var(--color-bg-void)]/90 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          ProMarketing · {SECTION_LABEL[section]}
        </p>
        <p className="truncate text-sm font-semibold">{name}</p>
      </div>
      <div className="flex items-center gap-2">
        {/* Собственикът гледа и двете табла; човекът от екипа стои в своето. */}
        {isOwner && (
          <Link href={section === "proekti" ? "/ekip" : "/ekip/proekti"} className={pill}>
            {section === "proekti" ? "Звънене" : "Проекти"}
          </Link>
        )}
        {isOwner && (
          <Link href="/admin" className={pill}>
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
