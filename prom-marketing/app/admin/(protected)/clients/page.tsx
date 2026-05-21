import { createClient } from "@/lib/supabase/server";
import { ClientsTable } from "@/components/admin/clients/ClientsTable";
import type { ContactRow } from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

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
            Всички контакти от Meta лийдове, Cal.com срещи и ръчно добавени. Обновява се live.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Грешка при зареждане: {error.message}
        </div>
      )}

      <ClientsTable initialRows={(data ?? []) as ContactRow[]} />
    </div>
  );
}
