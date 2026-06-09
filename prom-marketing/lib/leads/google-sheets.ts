/**
 * Fetch a Google Sheet as CSV without OAuth.
 *
 * The user publishes their lead-sync Sheet to the web, or uses a "share
 * with anyone who has the link" doc. Both expose a CSV endpoint via:
 *   https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv
 *
 * This module accepts that URL OR any direct CSV URL — Meta's "Send to
 * Google Sheets" integration writes columns:
 *   id, created_time, ad_id, ad_name, adset_id, adset_name,
 *   campaign_id, campaign_name, form_id, form_name, is_organic,
 *   platform, full_name, email, phone_number, custom_disclaimer_responses, ...
 */

const SPREADSHEET_ID_RE = /docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/;
const GID_RE = /[?#&]gid=([0-9]+)/;

export function normalizeSheetUrl(url: string): string {
  const idMatch = url.match(SPREADSHEET_ID_RE);
  if (!idMatch) return url;
  const id = idMatch[1];
  const gidMatch = url.match(GID_RE);
  const gid = gidMatch ? gidMatch[1] : "0";
  // Use the export endpoint (clean RFC-4180 CSV). The gviz/tq endpoint mangles
  // multi-line / quoted cells and can desync a streaming CSV parser.
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export async function fetchSheetCsv(url: string): Promise<string> {
  const normalized = normalizeSheetUrl(url);
  const res = await fetch(normalized, {
    redirect: "follow",
    cache: "no-store",
    headers: { "User-Agent": "ProMarketing-LeadSync/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Sheet fetch failed: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  if (text.trim().startsWith("<")) {
    throw new Error("Sheet returned HTML — make sure it's shared as 'Anyone with link can view'");
  }
  return text;
}

export interface CsvRow {
  [columnName: string]: string;
}

/** Minimal RFC 4180 CSV parser. Handles quoted fields with embedded commas/newlines. */
export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(cell);
        cell = "";
      } else if (ch === "\r") {
        // ignore — \n handles row break
      } else if (ch === "\n") {
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell);
    rows.push(cur);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const obj: CsvRow = {};
      for (let j = 0; j < header.length; j++) {
        obj[header[j]] = (row[j] ?? "").trim();
      }
      return obj;
    });
}
