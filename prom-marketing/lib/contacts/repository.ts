import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { ContactStage } from "./types";

/**
 * Find-or-create a contact by email or phone, then optionally log an
 * activity in the same call. Idempotent on the `unique_by` field given.
 *
 * Used by the email/send route, the Cal.com webhook, and the meta-lead
 * importer so the contacts dashboard stays in sync automatically.
 */
export async function upsertContactAndLog(args: {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: string;
  source_ref?: string | null;
  initial_stage?: ContactStage;
  /** Bump stage to this value if the current stage is "lead" or "contacted". */
  bump_stage_to?: ContactStage;
  activity?: {
    type: string;
    title: string;
    body?: string | null;
    occurred_at?: string;
    metadata?: Record<string, unknown>;
    created_by?: string | null;
    /** If true, skip insert when an activity with the same dedupe_key already exists. */
    dedupe_key?: string;
  };
}): Promise<{ contact_id: string | null; activity_id: string | null; error: string | null }> {
  const supabase = createServiceClient();

  const email = args.email?.trim().toLowerCase() || null;
  const phone = args.phone?.trim() || null;
  if (!email && !phone) {
    return { contact_id: null, activity_id: null, error: "email or phone required" };
  }

  // Find existing contact.
  let existing: { id: string; stage: ContactStage; full_name: string | null; phone: string | null } | null = null;
  if (email) {
    const { data } = await supabase
      .from("contacts")
      .select("id, stage, full_name, phone")
      .eq("email", email)
      .maybeSingle();
    existing = data;
  }
  if (!existing && phone) {
    const { data } = await supabase
      .from("contacts")
      .select("id, stage, full_name, phone")
      .eq("phone", phone)
      .is("email", null)
      .maybeSingle();
    existing = data;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    // Patch missing fields and bump stage if requested.
    const patch: Record<string, unknown> = {};
    if (args.full_name && !existing.full_name) patch.full_name = args.full_name;
    if (phone && !existing.phone) patch.phone = phone;
    if (
      args.bump_stage_to &&
      (existing.stage === "lead" || existing.stage === "contacted")
    ) {
      patch.stage = args.bump_stage_to;
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from("contacts").update(patch).eq("id", contactId);
    }
  } else {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        full_name: args.full_name ?? null,
        email,
        phone,
        company: args.company ?? null,
        stage: args.initial_stage ?? "lead",
        source: args.source,
        source_ref: args.source_ref ?? null,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { contact_id: null, activity_id: null, error: error?.message ?? "insert failed" };
    }
    contactId = data.id;
  }

  if (!args.activity) {
    return { contact_id: contactId, activity_id: null, error: null };
  }

  // Dedup-on-key: skip if an activity with this metadata key already exists.
  if (args.activity.dedupe_key) {
    const dk = args.activity.dedupe_key;
    const { data: dup } = await supabase
      .from("contact_activities")
      .select("id")
      .eq("contact_id", contactId)
      .eq("activity_type", args.activity.type)
      .contains("metadata", { dedupe_key: dk })
      .maybeSingle();
    if (dup) {
      return { contact_id: contactId, activity_id: dup.id, error: null };
    }
  }

  const metadata = {
    ...(args.activity.metadata ?? {}),
    ...(args.activity.dedupe_key ? { dedupe_key: args.activity.dedupe_key } : {}),
  };

  const { data: act, error: actErr } = await supabase
    .from("contact_activities")
    .insert({
      contact_id: contactId,
      activity_type: args.activity.type,
      title: args.activity.title,
      body: args.activity.body ?? null,
      occurred_at: args.activity.occurred_at ?? new Date().toISOString(),
      metadata,
      created_by: args.activity.created_by ?? null,
    })
    .select("id")
    .single();

  if (actErr) {
    return { contact_id: contactId, activity_id: null, error: actErr.message };
  }
  return { contact_id: contactId, activity_id: act?.id ?? null, error: null };
}
