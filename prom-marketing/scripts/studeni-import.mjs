// Студените обаждания — пакетът от таблици → порции за POST /api/crm/prospects (26.09.2026).
//
//   node --experimental-strip-types scripts/studeni-import.mjs \
//     --ready  "…/02_Call_Ready_пълни_данни.csv" --ready "…/01_Списък_за_обаждане.csv" \
//     --researched "…/03_Проучени_лийдове_3300.csv" --out /tmp/studeni --date 2026-09-26
//
// Нищо не пише в базата. Прави файлове <out>/NN-<пакет>.json — всеки е готово тяло
// за заявката (до 500 реда) — и казва какво е разпознало. Пращат се от VPS-а
// (там е токенът и няма Vercel checkpoint):
//   for f in /tmp/studeni/*.json; do curl -s -X POST -H "Authorization: Bearer $HERMES_API_TOKEN" \
//     -H "content-type: application/json" --data-binary @"$f" https://promarketing.pw/api/crm/prospects; echo; done
//
// Готовите фирми (01 + 02, едни и същи) се сливат по телефон — вторият файл допълва
// празното. Редът: готовите преди проучените, във всеки пакет София първа, после
// градовете по брой фирми.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROSPECT_FIELDS, cityPriorities, mapHeaders, parseCsv, phoneKey, rowToProspect, FIRST_CITY, UNKNOWN_CITY_PRIORITY } from "../lib/team/prospects-rules.ts";

const args = process.argv.slice(2);
const all = (flag) => args.flatMap((a, i) => (a === flag && args[i + 1] ? [args[i + 1]] : []));
const one = (flag, dflt) => all(flag)[0] ?? dflt;
const ready = all("--ready");
const researched = all("--researched");
const out = one("--out", "/tmp/studeni");
const date = one("--date", new Date().toISOString().slice(0, 10));
const CHUNK = 500;

if (ready.length + researched.length === 0) {
  console.error("Дай поне един файл: --ready <csv> и/или --researched <csv>");
  process.exit(1);
}

function readTable(path) {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const [headers, ...data] = rows;
  const map = mapHeaders(headers);
  const used = new Set(Object.values(map).flat());
  const report = {
    file: path.split("/").pop(),
    rows: data.length,
    fields: Object.fromEntries(PROSPECT_FIELDS.filter((f) => map[f]).map((f) => [f, map[f].map((i) => headers[i])])),
    missing: PROSPECT_FIELDS.filter((f) => !map[f]),
    ignored: headers.filter((_, i) => !used.has(i)),
  };
  return { rows: data.map((cells) => rowToProspect(cells, map)).filter((r) => r.company), report };
}

const keyOf = (r) => phoneKey(r.phone) ?? `${String(r.company).toLowerCase()}|${r.city ?? ""}`;

/** Сливане: първият запис печели, следващите попълват само празното. */
function merge(lists) {
  const byKey = new Map();
  for (const list of lists) {
    for (const r of list) {
      const k = keyOf(r);
      const prev = byKey.get(k);
      if (!prev) byKey.set(k, { ...r });
      else for (const f of PROSPECT_FIELDS) if ((prev[f] === undefined || prev[f] === null || prev[f] === "") && r[f]) prev[f] = r[f];
    }
  }
  return [...byKey.values()];
}

function withPriority(rows, offset) {
  const pr = cityPriorities(rows.map((r) => r.city ?? null));
  return rows.map((r) => ({ ...r, priority: offset + (r.city ? pr.get(r.city) ?? UNKNOWN_CITY_PRIORITY : UNKNOWN_CITY_PRIORITY) }));
}

function summary(name, rows) {
  const cities = new Map();
  for (const r of rows) cities.set(r.city ?? "—", (cities.get(r.city ?? "—") ?? 0) + 1);
  return {
    batch: name,
    unique: rows.length,
    withPhone: rows.filter((r) => phoneKey(r.phone)).length,
    withOpener: rows.filter((r) => r.opener).length,
    [FIRST_CITY]: cities.get(FIRST_CITY) ?? 0,
    topCities: [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([c, n]) => `${c} ${n}`).join(", "),
  };
}

const readyTables = ready.map(readTable);
const researchedTables = researched.map(readTable);
const readyRows = withPriority(merge(readyTables.map((t) => t.rows)), 0);
const readyKeys = new Set(readyRows.map(keyOf));
const researchedAll = merge(researchedTables.map((t) => t.rows));
const researchedRows = withPriority(researchedAll, 99);

mkdirSync(out, { recursive: true });
let n = 0;
const write = (batch, rows) => {
  for (let i = 0; i < rows.length; i += CHUNK) {
    n += 1;
    const file = join(out, `${String(n).padStart(2, "0")}-${batch}.json`);
    writeFileSync(file, JSON.stringify({ batch, rows: rows.slice(i, i + CHUNK) }));
  }
};
if (readyRows.length) write(`gotovi-${date}`, readyRows);
if (researchedRows.length) write(`prouchen-${date}`, researchedRows);

console.log(
  JSON.stringify(
    {
      files: [...readyTables, ...researchedTables].map((t) => t.report),
      ready: readyRows.length ? summary(`gotovi-${date}`, readyRows) : null,
      researched: researchedRows.length
        ? { ...summary(`prouchen-${date}`, researchedRows), alsoInReady: researchedAll.filter((r) => readyKeys.has(keyOf(r))).length }
        : null,
      out,
      requests: n,
    },
    null,
    2
  )
);
