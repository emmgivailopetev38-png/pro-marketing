#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const FILES = [
  "C:/Users/User/Downloads/Multi_ad_objects_leads_Leads_2026-05-21_2026-05-24/АЙ банери Автоматизации на биснеси и маркетинг общ/АЙ банери Автоматизации на биснеси и маркетинг общ_Leads_2026-05-24_2026-05-24.xls",
  "C:/Users/User/Downloads/Multi_ad_objects_leads_Leads_2026-05-21_2026-05-24/АЙ банери Автоматизации на биснеси и маркетинг – само …/АЙ банери Автоматизации на биснеси и маркетинг – само СРМ_Leads_2026-05-24_2026-05-24.xls",
];

function parse(xml) {
  const rows = [];
  const rowRe = /<Row[^>]*>([\s\S]*?)<\/Row>/g;
  const cellRe = /<Cell[^>]*>\s*<Data[^>]*>([\s\S]*?)<\/Data>\s*<\/Cell>/g;
  let m;
  while ((m = rowRe.exec(xml))) {
    const row = [];
    const inner = m[1];
    let c;
    while ((c = cellRe.exec(inner))) row.push(c[1].trim());
    rows.push(row);
  }
  return rows;
}

for (const file of FILES) {
  const rows = parse(fs.readFileSync(file, "utf8"));
  console.log("\n=== " + path.basename(path.dirname(file)) + " ===");
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 14) continue;
    const name = r[13] || "";
    const phone = r[14] || "";
    const email = r[12] || "";
    const note = r[15] || "(няма бележка)";
    console.log(` · ${name.padEnd(28)} ${email.padEnd(35)} ${phone.padEnd(16)} БЕЛЕЖКА: ${note}`);
  }
}
