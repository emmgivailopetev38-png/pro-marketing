"use client";
// ⌘K / Ctrl+K command palette — jump to any admin destination instantly.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Sparkles,
  Users,
  Target,
  Calendar,
  Inbox,
  Mail,
  BarChart3,
  Receipt,
  Wallet,
  Calculator,
  Repeat,
  Satellite,
  FolderOpen,
  SearchCheck,
  Bot,
  MessageCircle,
  Share2,
  Megaphone,
  LineChart,
  Clapperboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

type Cmd = { href: string; label: string; group: string; icon: LucideIcon; kw?: string };

const COMMANDS: Cmd[] = [
  { href: "/admin", label: "Преглед", group: "Команден център", icon: LayoutDashboard, kw: "dashboard home nachalo pregled" },
  { href: "/admin/new-leads", label: "Нови лидове", group: "Команден център", icon: Sparkles, kw: "new leads novi" },
  { href: "/admin/clients", label: "Клиенти", group: "CRM", icon: Users, kw: "clients klienti contacts kontakti" },
  { href: "/admin/follow-up", label: "Follow-up", group: "CRM", icon: Target, kw: "followup proslejavane" },
  { href: "/admin/bookings", label: "Срещи", group: "CRM", icon: Calendar, kw: "bookings meetings srehti calendar" },
  { href: "/admin/leads", label: "Meta лидове", group: "CRM", icon: Inbox, kw: "meta leads lidove facebook" },
  { href: "/admin/email", label: "Имейл", group: "CRM", icon: Mail, kw: "email imeil mail" },
  { href: "/admin/accounting", label: "Счетоводно табло", group: "Счетоводство", icon: BarChart3, kw: "accounting schetovodstvo finansi" },
  { href: "/admin/invoices", label: "Фактури", group: "Счетоводство", icon: Receipt, kw: "invoices fakturi" },
  { href: "/admin/payments", label: "Плащания", group: "Счетоводство", icon: Wallet, kw: "payments plashtania" },
  { href: "/admin/expenses", label: "Разходи", group: "Счетоводство", icon: Calculator, kw: "expenses razhodi" },
  { href: "/admin/recurring", label: "Абонаменти", group: "Счетоводство", icon: Repeat, kw: "recurring subscriptions abonamenti mrr" },
  { href: "/admin/gps", label: "GPS устройства", group: "Счетоводство", icon: Satellite, kw: "gps devices ustroistva" },
  { href: "/admin/documents", label: "Документи", group: "Счетоводство", icon: FolderOpen, kw: "documents dokumenti ocr" },
  { href: "/admin/manual-review", label: "Ръчна проверка", group: "Счетоводство", icon: SearchCheck, kw: "manual review ruchna proverka" },
  { href: "/admin/chatbots", label: "Чатботове", group: "Канали и AI", icon: Bot, kw: "chatbots chatbotove ai" },
  { href: "/admin/messenger", label: "Messenger", group: "Канали и AI", icon: MessageCircle, kw: "messenger facebook" },
  { href: "/admin/whatsapp", label: "WhatsApp", group: "Канали и AI", icon: MessageCircle, kw: "whatsapp" },
  { href: "/admin/social", label: "Соц. мрежи", group: "Канали и AI", icon: Share2, kw: "social socialni mreji" },
  { href: "/admin/ads", label: "Реклами", group: "Канали и AI", icon: Megaphone, kw: "ads reklami campaigns" },
  { href: "/admin/meta-ads", label: "Meta анализ", group: "Канали и AI", icon: LineChart, kw: "meta ads analiz analytics" },
  { href: "/admin/demo", label: "Demo", group: "Канали и AI", icon: Clapperboard, kw: "demo mostri" },
  { href: "/admin/settings", label: "Настройки", group: "Система", icon: Settings, kw: "settings nastroiki config" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COMMANDS;
    return COMMANDS.filter((c) =>
      `${c.label} ${c.group} ${c.kw ?? ""}`.toLowerCase().includes(s)
    );
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const go = (c?: Cmd) => {
    const target = c ?? results[active];
    if (!target) return;
    setOpen(false);
    router.push(target.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="cc-panel relative w-full max-w-[560px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Командна палитра"
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Търси страница или действие…"
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
          <kbd className="hud rounded border border-[var(--color-border-default)] px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--color-text-tertiary)]">Няма резултат</p>
          ) : (
            results.map((c, i) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.href + c.label}
                  onClick={() => go(c)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === active ? "bg-[var(--color-accent-cyan)]/12" : "hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${i === active ? "text-[var(--color-accent-cyan)]" : "text-[var(--color-text-tertiary)]"}`}
                    strokeWidth={1.75}
                  />
                  <span className="flex-1 text-sm text-[var(--color-text-primary)]">{c.label}</span>
                  <span className="hud">{c.group}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border-default)] px-4 py-2 hud">
          <span>↑↓ навигация · ⏎ избор</span>
          <span>⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
