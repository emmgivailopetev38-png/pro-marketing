"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Orbit,
  Sparkles,
  Lightbulb,
  Users,
  Target,
  Calendar,
  Inbox,
  Mail,
  FileSignature,
  Briefcase,
  BarChart3,
  Receipt,
  Wallet,
  Calculator,
  Repeat,
  Satellite,
  FolderOpen,
  SearchCheck,
  GraduationCap,
  Bot,
  MessageCircle,
  Share2,
  Megaphone,
  LineChart,
  Clapperboard,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/Logo";
import { cn } from "@/lib/utils";
import { CopilotWidget } from "@/components/admin/CopilotWidget";
import { QuickAddContact } from "@/components/admin/QuickAddContact";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { CommandBar } from "@/components/admin/CommandBar";

type LinkItem = { href: string; label: string; icon: LucideIcon };
type LinkGroup = { label: string; items: LinkItem[] };

const LINK_GROUPS: LinkGroup[] = [
  {
    label: "Команден център",
    items: [
      { href: "/admin", label: "Преглед", icon: LayoutDashboard },
      { href: "/admin/jarvis", label: "JARVIS", icon: Bot },
      { href: "/admin/deck", label: "Командна палуба", icon: Orbit },
      { href: "/admin/new-leads", label: "Нови лидове", icon: Sparkles },
      { href: "/admin/insights", label: "Оптимизация", icon: Lightbulb },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/admin/clients", label: "Клиенти", icon: Users },
      { href: "/admin/follow-up", label: "Follow-up", icon: Target },
      { href: "/admin/bookings", label: "Срещи", icon: Calendar },
      { href: "/admin/leads", label: "Meta лидове", icon: Inbox },
      { href: "/admin/email", label: "Имейл", icon: Mail },
      { href: "/admin/offers", label: "Оферти", icon: FileSignature },
      { href: "/admin/projects", label: "Проекти", icon: Briefcase },
    ],
  },
  {
    label: "Счетоводство",
    items: [
      { href: "/admin/accounting", label: "Счетоводно табло", icon: BarChart3 },
      { href: "/admin/invoices", label: "Фактури", icon: Receipt },
      { href: "/admin/payments", label: "Плащания", icon: Wallet },
      { href: "/admin/expenses", label: "Разходи", icon: Calculator },
      { href: "/admin/recurring", label: "Абонаменти", icon: Repeat },
      { href: "/admin/gps", label: "GPS устройства", icon: Satellite },
      { href: "/admin/documents", label: "Документи", icon: FolderOpen },
      { href: "/admin/manual-review", label: "Ръчна проверка", icon: SearchCheck },
      { href: "/admin/agent-rules", label: "Правила за работниците", icon: GraduationCap },
    ],
  },
  {
    label: "Канали и AI",
    items: [
      { href: "/admin/chatbots", label: "Чатботове", icon: Bot },
      { href: "/admin/messenger", label: "Messenger", icon: MessageCircle },
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/admin/social", label: "Соц. мрежи", icon: Share2 },
      { href: "/admin/ads", label: "Реклами", icon: Megaphone },
      { href: "/admin/meta-ads", label: "Meta анализ", icon: LineChart },
      { href: "/admin/demo", label: "Demo", icon: Clapperboard },
    ],
  },
  {
    label: "Система",
    items: [{ href: "/admin/settings", label: "Настройки", icon: Settings }],
  },
];

const ALL_LINKS = LINK_GROUPS.flatMap((g) => g.items);

function NavList({ path, onNav }: { path: string; onNav?: () => void }) {
  return (
    <nav className="mt-6 flex flex-col gap-4 overflow-y-auto pr-1">
      {LINK_GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            {g.label}
          </p>
          {g.items.map((l) => {
            const active = path === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={onNav}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]"
                    : "text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_var(--color-accent-cyan)]" />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active
                      ? "text-[var(--color-accent-cyan)]"
                      : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-cyan)]"
                  )}
                  strokeWidth={1.75}
                />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sectionLabel =
    [...ALL_LINKS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((l) => path === l.href || path.startsWith(l.href + "/"))?.label ?? "Команден център";

  const signOut = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="min-h-screen">
      <div className="cc-boot" aria-hidden />
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/80 px-4 py-3 backdrop-blur">
        <Link href="/admin" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Отвори меню"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-primary)] transition-colors hover:bg-white/5"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-2 border-r border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-6 transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Админ навигация"
      >
        <div className="flex items-center justify-between">
          <Link href="/admin" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            aria-label="Затвори меню"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-primary)] transition-colors hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavList path={path} onNav={() => setOpen(false)} />
        <div className="mt-auto">
          <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">{email}</p>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Изход
          </Button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-2 border-r border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/60 p-6 md:flex">
        <Link href="/admin">
          <Logo />
        </Link>
        <NavList path={path} />
        <div className="mt-auto">
          <p className="mb-2 text-xs text-[var(--color-text-tertiary)]">{email}</p>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Изход
          </Button>
        </div>
      </aside>
      <main className="md:pl-64">
        <div className="cc-bg min-h-screen">
          <div className="cc-scan" aria-hidden />
          <div className="cc-grain" aria-hidden />
          <CommandBar section={sectionLabel} />
          {children}
        </div>
      </main>
      <QuickAddContact />
      <CopilotWidget />
      <CommandPalette />
    </div>
  );
}

export { ALL_LINKS };
