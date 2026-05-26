import Link from "next/link";
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
    <div className="px-4 py-8 md:px-10 md:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            CRM · в реално време
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-editorial)] text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
            Клиенти
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {showAll
              ? "Всички контакти от Meta лийдове, Cal.com срещи и ръчно добавени."
              : "Само клиентите, на които сме изпратили имейл."}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href="/admin/clients"
            className="rounded-full border px-4 py-2 transition-colors"
            style={{
              borderColor: showAll ? "var(--color-accent-cyan)" : "var(--color-border-default)",
              background: showAll ? "rgba(0,212,255,0.1)" : "transparent",
              color: showAll ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
            }}
          >
            Всички контакти
          </Link>
          <Link
            href="/admin/clients?view=emailed"
            className="rounded-full border px-4 py-2 transition-colors"
            style={{
              borderColor: !showAll ? "var(--color-accent-cyan)" : "var(--color-border-default)",
              background: !showAll ? "rgba(0,212,255,0.1)" : "transparent",
              color: !showAll ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
            }}
          >
            ✉️ Само с имейл
          </Link>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Грешка при зареждане: {error.message}
        </div>
      )}

      <ClientsTable initialRows={rows} />
    </div>
  );
}
