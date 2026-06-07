import Link from "next/link";
import { Mail } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { ClientsTable } from "@/components/admin/clients/ClientsTable";
import type { ContactRow } from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  // Default: всички контакти (по-полезно за CRM преглед). 'emailed' филтрира само тези с изпратен имейл.
  const showAll = view !== "emailed";

  // Preview mode: use service client so we don't depend on auth/RLS.
  const supabase = createServiceClient();

  let rows: ContactRow[] = [];
  let error: { message: string } | null = null;

  if (showAll) {
    const { data, error: e } = await supabase
      .from("contacts")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    rows = (data ?? []) as ContactRow[];
    error = e;
  } else {
    // Default view: only contacts to whom we've actually sent an email.
    const { data: emailed } = await supabase
      .from("contact_activities")
      .select("contact_id")
      .eq("activity_type", "email_sent");
    const ids = Array.from(new Set((emailed ?? []).map((r) => r.contact_id)));
    if (ids.length > 0) {
      const { data, error: e } = await supabase
        .from("contacts")
        .select("*")
        .in("id", ids)
        .order("updated_at", { ascending: false });
      rows = (data ?? []) as ContactRow[];
      error = e;
    }
  }

  return (
    <div className="cc-bg min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="hud text-[var(--color-accent-cyan)]">CRM · в реално време</p>
              <h1 className="cc-title mt-2 font-display text-3xl font-bold md:text-4xl">Клиенти</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {showAll
                  ? "Всички контакти от Meta лийдове, Cal.com срещи и ръчно добавени."
                  : "Само клиентите, на които сме изпратили имейл."}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/clients" className={showAll ? "cc-btn cc-btn-primary" : "cc-btn"}>
                Всички контакти
              </Link>
              <Link href="/admin/clients?view=emailed" className={!showAll ? "cc-btn cc-btn-primary" : "cc-btn"}>
                <Mail className="h-4 w-4" strokeWidth={1.75} /> Само с имейл
              </Link>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Грешка при зареждане: {error.message}
          </div>
        )}

        <ClientsTable initialRows={rows} />
      </div>
    </div>
  );
}
