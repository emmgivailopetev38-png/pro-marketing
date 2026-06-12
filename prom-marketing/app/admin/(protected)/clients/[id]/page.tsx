import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { ContactDetail } from "@/components/admin/clients/ContactDetail";
import { ContactLedger } from "@/components/admin/clients/ContactLedger";
import type { ActivityRow, ContactRow } from "@/lib/contacts/types";
import type {
  InvoiceRow,
  PaymentRow,
  ManualReviewRow,
  OfferRow,
  ProjectRow,
  ProjectTaskRow,
  RecurringServiceRow,
} from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Preview mode: bypass RLS via service client.
  const supabase = createServiceClient();

  const [
    { data: contact },
    { data: activities },
    { data: invoices },
    { data: payments },
    { data: reviews },
    { data: offers },
    { data: projects },
    { data: recurring },
  ] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("contact_activities")
      .select("*")
      .eq("contact_id", id)
      .order("occurred_at", { ascending: false })
      .limit(1000),
    supabase.from("invoices").select("*").eq("contact_id", id).order("issue_date", { ascending: false }),
    supabase.from("payments").select("*").eq("contact_id", id).order("paid_at", { ascending: false }),
    supabase
      .from("manual_review_items")
      .select("*")
      .eq("related_contact_id", id)
      .in("status", ["open", "needs_user", "blocked"])
      .order("created_at", { ascending: false }),
    supabase.from("offers").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("recurring_services").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
  ]);

  if (!contact) notFound();

  // Задачите на проектите на този контакт (за прогрес x/y).
  const projectIds = ((projects ?? []) as ProjectRow[]).map((p) => p.id);
  const { data: tasks } = projectIds.length
    ? await supabase.from("project_tasks").select("*").in("project_id", projectIds)
    : { data: [] as ProjectTaskRow[] };

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
      <div className="mt-8">
        <ContactLedger
          invoices={(invoices ?? []) as InvoiceRow[]}
          payments={(payments ?? []) as PaymentRow[]}
          reviews={(reviews ?? []) as ManualReviewRow[]}
          offers={(offers ?? []) as OfferRow[]}
          projects={(projects ?? []) as ProjectRow[]}
          tasks={(tasks ?? []) as ProjectTaskRow[]}
          recurring={(recurring ?? []) as RecurringServiceRow[]}
        />
      </div>
    </div>
  );
}
