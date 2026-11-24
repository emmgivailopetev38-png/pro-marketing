"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Search, Sparkles } from "lucide-react";

export interface EkipNavItem {
  href: string;
  label: string;
  module: string;
}

const SHORT: Record<string, string> = {
  ekipat: "👥 Екипът",
  biznes: "📊 Бизнесът",
  liidove: "📋 Лийдове",
  klasacia: "🏆 Сделки и класация",
  asistent: "🤖 AI асистент",
  uebinar: "🎥 Уебинарът",
  oferti: "📄 Оферти · PDF",
  zvanene: "📞 Звънене",
  prodazhbi: "💼 Продажби",
  proekti: "🛠 Проекти",
  zadachi: "✅ Задачи",
  saobshtenia: "💬 Съобщения",
  materiali: "📚 Материали",
  ceni: "💶 Оферти и цени",
  komisioni: "🏅 Комисионни",
  napredak: "📈 Напредък",
  belezhki: "📝 Бележки",
  demo: "🎬 Демо",
};

/** Групите в менюто вляво — като в истински CRM: работата горе, числата, продажбата, помощта. */
const GROUPS: Array<{ title: string; modules: string[] }> = [
  { title: "Работа", modules: ["zvanene", "prodazhbi", "liidove", "zadachi", "saobshtenia"] },
  { title: "Числа", modules: ["napredak", "klasacia", "ekipat", "biznes"] },
  { title: "Продажба", modules: ["ceni", "oferti", "uebinar", "demo", "materiali", "proekti", "komisioni"] },
  { title: "Помощ", modules: ["asistent", "belezhki"] },
];

function label(n: EkipNavItem): string {
  return SHORT[n.module] ?? n.label;
}

/**
 * Шапката на /ekip. На компютър — меню вляво (по групи, като истински CRM) и
 * лента горе с търсачката, асистента и изхода. На телефон — лента горе и
 * менюто се плъзга хоризонтално. Модулите са тези, които човекът вижда
 * (ролята + правата му).
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
  const byModule = new Map(nav.map((n) => [n.module, n]));
  const grouped = GROUPS.map((g) => ({ title: g.title, items: g.modules.map((m) => byModule.get(m)).filter((n): n is EkipNavItem => !!n) })).filter(
    (g) => g.items.length > 0
  );
  const placed = new Set(GROUPS.flatMap((g) => g.modules));
  const rest = nav.filter((n) => !placed.has(n.module));
  if (rest.length) grouped.push({ title: "Още", items: rest });
  const current = nav.find((n) => n.module === section);
  const canSearch = byModule.has("liidove");
  const canAsk = byModule.has("asistent");
  const badgeFor = (m: string) => (m === "saobshtenia" && unread > 0 ? unread : 0);

  return (
    <>
      {/* Меню вляво — компютър */}
      <aside className="ekip-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-[#0b0f17]/95 backdrop-blur lg:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-accent-cyan)]">ProMarketing CRM</p>
          <p className="mt-1 truncate text-sm font-semibold">{name}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Модули">
          {grouped.map((g) => (
            <div key={g.title} className="mb-3">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map((n) => {
                  const active = n.module === section;
                  const badge = badgeFor(n.module);
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                          active
                            ? "bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)] shadow-[inset_2px_0_0_var(--color-accent-cyan)]"
                            : "text-[var(--color-text-secondary)] hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <span className="truncate">{label(n)}</span>
                        {badge > 0 && <span className="ml-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="space-y-1.5 border-t border-white/10 p-3">
          {isOwner && (
            <Link href="/admin" className="block rounded-lg border border-white/10 px-3 py-1.5 text-center text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent-cyan)]/60">
              Админ CRM
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-red-400/60 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" /> Изход
          </button>
        </div>
      </aside>

      {/* Лента горе */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--color-bg-void)]/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] lg:hidden">ProMarketing · екип</p>
            <p className="truncate text-sm font-semibold lg:text-base">
              <span className="lg:hidden">{name}</span>
              <span className="hidden lg:inline">{current ? label(current) : "ProMarketing CRM"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canSearch && (
              <form action="/ekip/liidove" className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 md:flex">
                <Search className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                <input name="q" placeholder="Търси лийд, телефон…" className="w-44 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-tertiary)]" />
              </form>
            )}
            {canAsk && section !== "asistent" && (
              <Link
                href="/ekip/asistent"
                className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:border-violet-300"
              >
                <Sparkles className="h-3.5 w-3.5" /> Асистент
              </Link>
            )}
            {isOwner && (
              <Link
                href="/admin"
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent-cyan)]/60 lg:hidden"
              >
                CRM
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-red-400/60 hover:text-red-300 lg:hidden"
            >
              <LogOut className="h-3.5 w-3.5" /> Изход
            </button>
          </div>
        </div>
        {nav.length > 1 && (
          <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="Модули">
            {nav.map((n) => {
              const active = n.module === section;
              const badge = badgeFor(n.module);
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
                  {label(n)}
                  {badge > 0 && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{badge}</span>}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
