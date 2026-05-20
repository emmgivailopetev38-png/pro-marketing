// Diff "already called" leads (from XML .xls exports) against the full
// meta_leads set in Supabase. Prints the remaining (not-yet-called) leads.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
//   node scripts/diff-called-leads.mjs <root-folder-with-xls-files>

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Need SUPABASE_URL + SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const root = process.argv[2];
if (!root) { console.error("Usage: <root-folder>"); process.exit(1); }

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (entry.toLowerCase().endsWith(".xls")) out.push(p);
  }
  return out;
}

// Parse Microsoft XML Spreadsheet 2003. Each <Row> has <Cell><Data ...>value</Data></Cell>.
// Cells with no Data tag are empty placeholders.
function parseXmlSpreadsheet(xml) {
  const rows = [];
  const rowRe = /<Row[^>]*>([\s\S]*?)<\/Row>/g;
  let m;
  while ((m = rowRe.exec(xml)) !== null) {
    const cells = [];
    const cellRe = /<Cell[^>]*>([\s\S]*?)<\/Cell>/g;
    let c;
    while ((c = cellRe.exec(m[1])) !== null) {
      const dataMatch = c[1].match(/<Data[^>]*>([\s\S]*?)<\/Data>/);
      cells.push(dataMatch ? decodeXmlEntities(dataMatch[1].trim()) : "");
    }
    rows.push(cells);
  }
  return rows;
}

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, d) => String.fromCharCode(parseInt(d, 16)));
}

function normalizePhone(p) {
  if (!p) return null;
  const digits = p.replace(/\D+/g, "");
  if (digits.length < 6) return null;
  // Drop country code variants
  return digits.replace(/^359/, "").replace(/^0/, "");
}

function normalizeEmail(e) {
  if (!e) return null;
  const t = e.trim().toLowerCase();
  return t.length > 0 ? t : null;
}

// Collect called identifiers (email + normalized phone)
const xlsFiles = walk(root);
console.log(`Found ${xlsFiles.length} .xls files`);

const calledEmails = new Set();
const calledPhones = new Set();
const calledNames = new Set();
let totalCalledRows = 0;

for (const file of xlsFiles) {
  const xml = readFileSync(file, "utf8");
  const rows = parseXmlSpreadsheet(xml);
  if (rows.length === 0) continue;
  const header = rows[0].map((h) => h.toLowerCase());
  const idx = (name) => header.findIndex((h) => h.includes(name.toLowerCase()));
  const emailIdx = idx("email");
  const phoneIdx = idx("phone");
  const nameIdx = Math.max(idx("full_name"), idx("full name"), idx("name"));
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const email = emailIdx >= 0 ? normalizeEmail(r[emailIdx]) : null;
    const phone = phoneIdx >= 0 ? normalizePhone(r[phoneIdx]) : null;
    const name = nameIdx >= 0 ? r[nameIdx] : null;
    if (email) calledEmails.add(email);
    if (phone) calledPhones.add(phone);
    if (name && !email && !phone) calledNames.add(name.toLowerCase());
    if (email || phone) totalCalledRows++;
  }
}

console.log(`\nCalled leads collected:`);
console.log(`  Unique emails: ${calledEmails.size}`);
console.log(`  Unique phones: ${calledPhones.size}`);
console.log(`  Total rows scanned: ${totalCalledRows}`);

// Fetch all leads from Supabase
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/meta_leads?select=id,meta_lead_id,full_name,email,phone,form_name,created_time,imported_at&order=created_time.desc.nullslast&limit=1000`,
  { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
);
const allLeads = await res.json();
console.log(`\nLeads in Supabase: ${allLeads.length}`);

const remaining = [];
const alreadyCalled = [];
for (const lead of allLeads) {
  const email = normalizeEmail(lead.email);
  const phone = normalizePhone(lead.phone);
  const calledByEmail = email && calledEmails.has(email);
  const calledByPhone = phone && calledPhones.has(phone);
  if (calledByEmail || calledByPhone) {
    alreadyCalled.push(lead);
  } else {
    remaining.push(lead);
  }
}

console.log(`\n=== ALREADY CALLED: ${alreadyCalled.length} ===`);
for (const l of alreadyCalled) {
  console.log(`  ✓ ${l.full_name ?? "—"} | ${l.email ?? ""} | ${l.phone ?? ""} | ${l.form_name ?? ""}`);
}

console.log(`\n=== REMAINING TO CALL: ${remaining.length} ===`);
for (const l of remaining) {
  const d = l.created_time ? new Date(l.created_time).toISOString().slice(0, 16).replace("T", " ") : "—";
  console.log(`  ${d}  ${l.full_name ?? "—"}  |  ${l.email ?? ""}  |  ${l.phone ?? ""}  |  ${l.form_name ?? ""}`);
}

// Write remaining as JSON to disk for easy download / programmatic use.
const outPath = "C:\\Users\\User\\Downloads\\remaining-leads.json";
writeFileSync(outPath, JSON.stringify(remaining, null, 2));
console.log(`\nWrote remaining leads to ${outPath}`);

// Mark in DB: set source suffix ":called" for matched leads so admin UI can hide them.
if (alreadyCalled.length > 0) {
  const ids = alreadyCalled.map((l) => l.id);
  const upd = await fetch(`${SUPABASE_URL}/rest/v1/meta_leads?id=in.(${ids.join(",")})`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ source: "csv_upload:meta_lead_center_export_2026-05-20:called" }),
  });
  console.log(`\nMarked ${alreadyCalled.length} as 'called' in DB (status ${upd.status})`);
}
