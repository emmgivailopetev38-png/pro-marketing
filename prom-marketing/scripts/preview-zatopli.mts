/**
 * Преглед на съобщенията от опашката „Затопли", преди първото да е тръгнало.
 *
 *   npx tsx scripts/preview-zatopli.mts [изходен-файл.html]
 *
 * Показва всяка от четирите ленти в двете обръщения, както човекът ще ги види
 * в чата — плюс адресите, които всеки канал получава. Никакъв достъп до база,
 * никакво изпращане.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { warmMessage } from "../lib/contacts/warm-message";
import { channelLinks, CHANNEL_LABEL, type Channel } from "../lib/contacts/channels";
import { BAND_LABEL, type WarmthBand } from "../lib/contacts/warmth";

const LINK = "https://promarketing.pw/z/a1b2c3d4e5";
const PHONE = "0877399963";

const out = process.argv[2] ?? "scripts/out/zatopli-preview.html";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** По един реалистичен случай за всяка лента. */
const CASES: Array<{
  band: WarmthBand;
  who: string;
  full_name: string;
  company: string | null;
  top_reason: string | null;
  vertical: string | null;
}> = [
  {
    band: "hot",
    who: "отвори офертата вчера, не вдига телефона",
    full_name: "Иван Петров",
    company: "Петров Транс ЕООД",
    top_reason: "отвори офертата",
    vertical: "transport",
  },
  {
    band: "warm",
    who: "говорил е с гласовия агент, но не е записал час",
    full_name: "Мария Георгиева",
    company: "Сладкарница Биософ",
    top_reason: "говори с гласовия агент",
    vertical: "shop",
  },
  {
    band: "cold",
    who: "получил е четирите писма, нула реакция",
    full_name: "Георги Асенов",
    company: "Асенов Строй",
    top_reason: null,
    vertical: "b2b",
  },
  {
    band: "untouched",
    who: "Meta лийд от май, нула докосвания — един от 126-те",
    full_name: "Стоян Атанасов",
    company: null,
    top_reason: null,
    vertical: null,
  },
];

const blocks = CASES.map((c) => {
  const forms = [false, true].map((formal) => {
    const text = warmMessage({
      full_name: c.full_name,
      company: c.company,
      band: c.band,
      top_reason: c.top_reason,
      link: LINK,
      vertical: c.vertical,
      formal,
    });
    return `
      <div class="col">
        <div class="tag">${formal ? "на Вие" : "на ти"} · ${text.length} знака</div>
        <div class="bubble">${esc(text).replace(/\n/g, "<br>")}</div>
      </div>`;
  }).join("");

  const links = channelLinks(PHONE, warmMessage({
    full_name: c.full_name,
    company: c.company,
    band: c.band,
    top_reason: c.top_reason,
    link: LINK,
    vertical: c.vertical,
  }))
    .map(
      (l) =>
        `<tr><td class="ch">${CHANNEL_LABEL[l.channel as Channel]}</td><td class="url">${esc(
          l.href ?? "—"
        )}</td><td class="note">${l.carries_text ? "носи текста" : "клипборд"}${
          l.caveat ? ` · ${esc(l.caveat)}` : ""
        }</td></tr>`
    )
    .join("");

  return `
    <section>
      <h2>${BAND_LABEL[c.band]} <span class="band">${c.band}</span></h2>
      <p class="who">${esc(c.full_name)}${c.company ? ` · ${esc(c.company)}` : ""} — ${esc(c.who)}</p>
      <div class="cols">${forms}</div>
      <table>${links}</table>
    </section>`;
}).join("\n");

const html = `<!doctype html>
<html lang="bg"><meta charset="utf-8"><title>Затопли · преглед на съобщенията</title>
<style>
  body { background:#0b0f1a; color:#e8ecf5; font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; margin:0; padding:40px 24px; }
  .wrap { max-width:1000px; margin:0 auto; }
  h1 { font-size:28px; margin:0 0 6px; }
  .lede { color:#8fa0bd; margin:0 0 36px; }
  section { border:1px solid #1e2940; border-radius:14px; padding:20px; margin-bottom:22px; background:#0f1524; }
  h2 { font-size:18px; margin:0 0 2px; }
  .band { font:12px ui-monospace,monospace; color:#5f7396; font-weight:400; }
  .who { color:#8fa0bd; font-size:13px; margin:0 0 16px; }
  .cols { display:flex; gap:14px; flex-wrap:wrap; }
  .col { flex:1 1 340px; min-width:0; }
  .tag { font:11px ui-monospace,monospace; color:#5f7396; margin-bottom:6px; text-transform:uppercase; letter-spacing:.08em; }
  .bubble { background:#1b2740; border-radius:14px 14px 14px 4px; padding:14px 16px; white-space:normal; }
  table { width:100%; border-collapse:collapse; margin-top:16px; font:12px ui-monospace,monospace; }
  td { padding:6px 8px; border-top:1px solid #1e2940; vertical-align:top; }
  .ch { color:#7dd3fc; white-space:nowrap; width:90px; }
  .url { color:#a8b6cf; word-break:break-all; }
  .note { color:#5f7396; white-space:nowrap; }
</style>
<div class="wrap">
  <h1>Затопли · съобщенията</h1>
  <p class="lede">Четирите ленти, в двете обръщения — точно както влизат в чата. Линкът води към личната страница на човека.</p>
  ${blocks}
</div>
</html>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html, "utf8");
console.log(`Готово: ${out}`);
