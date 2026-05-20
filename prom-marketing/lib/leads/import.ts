import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchSheetCsv, parseCsv, type CsvRow } from "./google-sheets";

export interface LeadSource {
  id: string;
  label: string;
  csv_url: string;
  form_id: string | null;
}

export interface NormalizedLead {
  meta_lead_id: string;
  form_id: string;
  form_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  field_data: Record<string, string>;
  source: string;
  created_time: string | null;
}

// Common Meta lead column names in Bulgarian + English.
const NAME_KEYS = ["full_name", "full name", "име", "name"];
const EMAIL_KEYS = ["email", "имейл"];
const PHONE_KEYS = ["phone_number", "phone", "телефон"];
const ID_KEYS = ["id", "lead_id"];
const CREATED_KEYS = ["created_time", "creation_time", "submit_time", "submitted_at"];

function pickFirst(row: CsvRow, keys: string[]): string | null {
  for (const key of Object.keys(row)) {
    if (keys.some((k) => key.toLowerCase().trim() === k)) {
      const v = row[key]?.trim();
      if (v) return v;
    }
  }
  return null;
}

export function normalizeLeadRow(row: CsvRow, sourceLabel: string): NormalizedLead | null {
  const id = pickFirst(row, ID_KEYS);
  if (!id) return null;

  return {
    meta_lead_id: id,
    form_id: row["form_id"] ?? row["form id"] ?? "",
    form_name: row["form_name"] ?? row["form name"] ?? null,
    campaign_id: row["campaign_id"] ?? row["campaign id"] ?? null,
    campaign_name: row["campaign_name"] ?? row["campaign name"] ?? null,
    ad_id: row["ad_id"] ?? row["ad id"] ?? null,
    ad_name: row["ad_name"] ?? row["ad name"] ?? null,
    full_name: pickFirst(row, NAME_KEYS),
    email: pickFirst(row, EMAIL_KEYS),
    phone: pickFirst(row, PHONE_KEYS),
    field_data: row,
    source: `google_sheets:${sourceLabel}`,
    created_time: pickFirst(row, CREATED_KEYS),
  };
}

export interface SyncResult {
  source_id: string;
  label: string;
  fetched: number;
  inserted: number;
  error: string | null;
}

export async function syncAllSources(): Promise<{
  results: SyncResult[];
  totalNewLeads: number;
  newLeads: NormalizedLead[];
}> {
  const supabase = createServiceClient();
  const { data: sources, error } = await supabase
    .from("meta_lead_sources")
    .select("id, label, csv_url, form_id")
    .eq("enabled", true);

  if (error || !sources) {
    return { results: [], totalNewLeads: 0, newLeads: [] };
  }

  const results: SyncResult[] = [];
  const newLeads: NormalizedLead[] = [];

  for (const source of sources as LeadSource[]) {
    const result: SyncResult = {
      source_id: source.id,
      label: source.label,
      fetched: 0,
      inserted: 0,
      error: null,
    };
    try {
      const csv = await fetchSheetCsv(source.csv_url);
      const rows = parseCsv(csv);
      const leads = rows
        .map((r) => normalizeLeadRow(r, source.label))
        .filter((l): l is NormalizedLead => l !== null)
        .map((l) => ({ ...l, form_id: l.form_id || source.form_id || source.label }));

      result.fetched = leads.length;

      if (leads.length > 0) {
        // Find which are new (not seen before by meta_lead_id)
        const ids = leads.map((l) => l.meta_lead_id);
        const { data: existing } = await supabase
          .from("meta_leads")
          .select("meta_lead_id")
          .in("meta_lead_id", ids);
        const seen = new Set((existing ?? []).map((r) => r.meta_lead_id));
        const fresh = leads.filter((l) => !seen.has(l.meta_lead_id));

        if (fresh.length > 0) {
          const rowsToInsert = fresh.map((l) => ({
            meta_lead_id: l.meta_lead_id,
            form_id: l.form_id,
            form_name: l.form_name,
            campaign_id: l.campaign_id,
            campaign_name: l.campaign_name,
            ad_id: l.ad_id,
            ad_name: l.ad_name,
            full_name: l.full_name,
            email: l.email,
            phone: l.phone,
            field_data: l.field_data,
            source: l.source,
            raw_payload: l.field_data,
            created_time: l.created_time ? new Date(l.created_time).toISOString() : null,
          }));
          const { error: insErr } = await supabase
            .from("meta_leads")
            .upsert(rowsToInsert, { onConflict: "meta_lead_id" });
          if (insErr) {
            result.error = `db: ${insErr.message.slice(0, 200)}`;
          } else {
            result.inserted = fresh.length;
            newLeads.push(...fresh);
          }
        }
      }
    } catch (e) {
      result.error = e instanceof Error ? e.message.slice(0, 240) : String(e);
    }

    await supabase
      .from("meta_lead_sources")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_count: result.inserted,
        last_sync_error: result.error,
      })
      .eq("id", source.id);

    results.push(result);
  }

  return {
    results,
    totalNewLeads: results.reduce((sum, r) => sum + r.inserted, 0),
    newLeads,
  };
}
