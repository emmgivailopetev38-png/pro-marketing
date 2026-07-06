import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { CommandDeck, type DeckBoard } from "@/components/admin/CommandDeck";

export const dynamic = "force-dynamic";

// Cheap head counts to make the boards feel alive. Every query is wrapped so a
// single failing table can never take the whole deck down.
async function safeCount(
  run: () => PromiseLike<{ count: number | null }>
): Promise<number | null> {
  try {
    const { count } = await run();
    return count ?? null;
  } catch {
    return null;
  }
}

export default async function CommandDeckPage() {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const UNPAID = ["sent", "awaiting_payment", "partially_paid", "overdue"];
  const ACTIVE_PROJECT = ["planned", "in_progress", "waiting_client"];

  const [contacts, upcoming, unprocessed, unpaid, openOffers, activeProjects] = await Promise.all([
    safeCount(() => supabase.from("contacts").select("*", { count: "exact", head: true }).neq("stage", "lost")),
    safeCount(() => supabase.from("bookings").select("*", { count: "exact", head: true }).neq("status", "cancelled").gte("scheduled_at", nowIso)),
    safeCount(() => supabase.from("meta_leads").select("*", { count: "exact", head: true }).eq("processed", false)),
    safeCount(() => supabase.from("invoices").select("*", { count: "exact", head: true }).in("status", UNPAID)),
    safeCount(() => supabase.from("offers").select("*", { count: "exact", head: true }).in("status", ["sent", "viewed"])),
    safeCount(() => supabase.from("projects").select("*", { count: "exact", head: true }).in("status", ACTIVE_PROJECT)),
  ]);

  const s = (v: number | null, label: string) => (v != null ? { value: String(v), label } : null);

  const boards: DeckBoard[] = [
    { key: "clients", href: "/admin/clients", label: "Клиенти", desc: "Всички контакти и профили", icon: "Users", color: "#22d3ee", code: "CRM.01", stat: s(contacts, "активни") },
    { key: "followup", href: "/admin/follow-up", label: "Follow-up", desc: "Кого да чуеш и кога", icon: "Target", color: "#f59e0b", code: "CRM.02", stat: null },
    { key: "bookings", href: "/admin/bookings", label: "Срещи", desc: "Календар и предстоящи", icon: "Calendar", color: "#a78bfa", code: "CRM.03", stat: s(upcoming, "предстоящи") },
    { key: "offers", href: "/admin/offers", label: "Оферти", desc: "Изпратени и приети", icon: "FileSignature", color: "#ec4899", code: "SALES.01", stat: s(openOffers, "отворени") },
    { key: "projects", href: "/admin/projects", label: "Проекти", desc: "Изпълнение на сделките", icon: "Briefcase", color: "#14b8a6", code: "SALES.02", stat: s(activeProjects, "активни") },
    { key: "invoices", href: "/admin/invoices", label: "Фактури", desc: "Издадени и чакащи плащане", icon: "Receipt", color: "#22c55e", code: "FIN.01", stat: s(unpaid, "неплатени") },
    { key: "accounting", href: "/admin/accounting", label: "Счетоводство", desc: "Приходи, разходи, печалба", icon: "BarChart3", color: "#facc15", code: "FIN.02", stat: null },
    { key: "recurring", href: "/admin/recurring", label: "Абонаменти", desc: "Повтарящ се месечен приход", icon: "Repeat", color: "#38bdf8", code: "FIN.03", stat: null },
    { key: "leads", href: "/admin/leads", label: "Meta лидове", desc: "Реклами → входящи лидове", icon: "Inbox", color: "#1877F2", code: "GROWTH.01", stat: s(unprocessed, "необработени") },
    { key: "meta-ads", href: "/admin/meta-ads", label: "Meta анализ", desc: "Разход, лидове, CPL", icon: "LineChart", color: "#fb923c", code: "GROWTH.02", stat: null },
    { key: "chatbots", href: "/admin/chatbots", label: "Чатботове", desc: "База знания и сесии", icon: "Bot", color: "#9b7bff", code: "AI.01", stat: null },
    { key: "demo", href: "/admin/demo", label: "Demo", desc: "Публични мостри за клиенти", icon: "Clapperboard", color: "#2dd4bf", code: "AI.02", stat: null },
  ];

  return (
    <div className="cc-content deck-page">
      <header className="deck-page-head">
        <div>
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Командна палуба</p>
          <h1 className="cc-title mt-2 font-display text-3xl font-bold md:text-5xl">Палубата</h1>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
            Таблата на командния център се носят във въздуха. Завърти ги и влез в което пожелаеш.
          </p>
        </div>
        <Link href="/admin" className="cc-btn">
          <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} /> Класически преглед
        </Link>
      </header>

      <CommandDeck boards={boards} />
    </div>
  );
}
