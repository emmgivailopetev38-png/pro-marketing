// One-off CSV import using Supabase REST API + service role key.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/one-off-import-csv.mjs <path-to-csv> [label]

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const [, , csvPath, labelArg] = process.argv;
if (!csvPath) {
  console.error("Usage: node scripts/one-off-import-csv.mjs <path-to-csv> [label]");
  process.exit(1);
}
const label = labelArg ?? "csv_upload:" + csvPath.split(/[\\/]/).pop();

const text = readFileSync(csvPath, "utf8");

function parseCsv(text) {
  const rows = [];
  let cur = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else { cell += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(cell); cell = ""; }
      else if (ch === "\r") { /* skip */ }
      else if (ch === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
      else cell += ch;
    }
  }
  if (cell.length > 0 || cur.length > 0) { cur.push(cell); rows.push(cur); }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const obj = {};
      for (let j = 0; j < header.length; j++) obj[header[j]] = (row[j] ?? "").trim();
      return obj;
    });
}

function parseFlexibleDate(raw) {
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (m) {
    let hour = parseInt(m[4], 10);
    const ampm = m[6]?.toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], hour, +m[5])).toISOString();
  }
  return null;
}

function lower(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k.toLowerCase().trim()] = (v ?? "").trim();
  return out;
}
function pick(r, ...keys) {
  for (const k of keys) {
    const v = r[k.toLowerCase()];
    if (v && v.trim().length > 0) return v.trim();
  }
  return null;
}
function synthesize(...parts) {
  const joined = parts.filter(Boolean).join("|");
  return "syn_" + createHash("sha256").update(joined).digest("hex").slice(0, 24);
}

const rows = parseCsv(text);
const leads = [];
for (const row of rows) {
  const r = lower(row);
  const name = pick(r, "full_name", "full name", "name", "име");
  const email = pick(r, "email", "email_address", "email address", "имейл");
  const phone = pick(r, "phone_number", "phone number", "phone", "телефон");
  const createdRaw = pick(r, "created_time", "creation_time", "submit_time", "created", "date added");
  if (!name && !email && !phone) continue;
  const realId = pick(r, "id", "lead_id");
  const formName = pick(r, "form_name", "form name", "form");
  const formId = pick(r, "form_id", "form id");
  const meta_lead_id = realId ?? synthesize(email, phone, createdRaw, formName);
  leads.push({
    meta_lead_id,
    form_id: formId ?? formName ?? label,
    form_name: formName,
    campaign_id: pick(r, "campaign_id", "campaign id"),
    campaign_name: pick(r, "campaign_name", "campaign name", "source"),
    ad_id: pick(r, "ad_id", "ad id"),
    ad_name: pick(r, "ad_name", "ad name"),
    full_name: name,
    email,
    phone,
    field_data: row,
    raw_payload: row,
    source: label,
    created_time: parseFlexibleDate(createdRaw),
  });
}

console.log(`Parsed ${leads.length} leads from ${csvPath}`);

const res = await fetch(`${SUPABASE_URL}/rest/v1/meta_leads`, {
  method: "POST",
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=ignore-duplicates,return=representation",
  },
  body: JSON.stringify(leads),
});
const body = await res.text();
console.log(`Status: ${res.status}`);
console.log(body.slice(0, 500));
