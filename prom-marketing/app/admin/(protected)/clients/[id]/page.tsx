import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { ContactDetail } from "@/components/admin/clients/ContactDetail";
import type { ActivityRow, ContactRow } from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Preview mode: bypass RLS via service client.
  const supabase = createServiceClient();

  const [{ data: contact }, { data: activities }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("contact_activities")
      .select("*")
      .eq("contact_id", id)
      .order("occurred_at", { ascending: false })
      .limit(200),
  ]);

  if (!contact) notFound();

  return (
    <div className="px-4 py-8 md:px-10 md:py-12">
      <Link
        href="/admin/clients"
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
      >
        ← Всички клиенти
      </Link>
      <ContactDetail
        contact={contact as ContactRow}
        initialActivities={(activities ?? []) as ActivityRow[]}
      />
    </div>
  );
}
