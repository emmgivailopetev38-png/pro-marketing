/**
 * Преглед на всички автоматични писма, преди първото да е тръгнало.
 *
 *   npx tsx scripts/preview-sequences.mts [изходен-файл.html]
 *
 * Сглобява писмата едно под друго — точно както ги вижда получателят — и ги
 * записва в един HTML файл: студената поредица (двата входа), трите пътеки на
 * топлия кръг и общия кръг. Никакъв достъп до база, никакво изпращане.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { LEAD_SEQUENCE, VOICE_LEAD_SEQUENCE } from "../lib/email/lead-steps";
import { WARM_SEQUENCE, WARM_TRACKS, TRACK_LABEL, subjectFor, type WarmTrack } from "../lib/email/warm-steps";
import type { BuildCtx, SequenceStep } from "../lib/email/sequence-layout";

const NAME = "Иван";
const CTX: BuildCtx = {
  contactId: "a1b2c3d4-0000-0000-0000-000000000000",
  stage: "contacted",
  unsubscribeUrl: "https://www.promarketing.pw/api/email/unsubscribe?c=пример&t=пример",
};

const out = process.argv[2] ?? "scripts/out/sequences-preview.html";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface Group {
  title: string;
  note: string;
  ctx: BuildCtx;
  steps: SequenceStep[];
  when: (s: SequenceStep, i: number) => string;
}

const groups: Group[] = [
  {
    title: "Студената поредица · лийд от Meta или от формата на сайта",
    note: "Спира при първия разговор, среща или отговор. Оттам поема топлият кръг.",
    ctx: { ...CTX, stage: "lead", source: "meta_lead" },
    steps: LEAD_SEQUENCE,
    when: (s) => `ден ${s.afterDays}`,
  },
  {
    title: "Студената поредица · лийд от рекламата за гласовия агент (/glas)",
    note: "Само първото писмо е различно — човекът вече е чул агента. После пътят е същият.",
    ctx: { ...CTX, stage: "lead", source: "voice_web" },
    steps: VOICE_LEAD_SEQUENCE.slice(0, 1),
    when: (s) => `ден ${s.afterDays}`,
  },
  ...(["govorili", "prezentacia", "oferta"] as WarmTrack[]).map<Group>((t) => ({
    title: `Топлият кръг · пътека „${TRACK_LABEL[t]}"`,
    note:
      t === "oferta"
        ? "Идва при етап offer_sent / negotiating или статус sent_offer / sent_proforma / ready_to_close. По-начесто: 3, 4, 7, 7 дни."
        : t === "prezentacia"
          ? "Идва при етап presentation_sent или статус sent_presentation. После — общият кръг."
          : "Идва след истински разговор или среща в картона, когато няма оферта или презентация.",
    ctx: { ...CTX, stage: t === "oferta" ? "offer_sent" : t === "prezentacia" ? "presentation_sent" : "contacted" },
    steps: WARM_TRACKS[t],
    when: (s) => `≥ ${s.gapDays ?? 7} дни след предното ни писмо`,
  })),
  {
    title: "Топлият кръг · общият кръг — стойност, клиент, демо",
    note: `Едно на седмица, след пътеката. Не спира при разговор; спира само при „спечелен" или отписване. След „трите врати" — на половин темпо, само новото.`,
    ctx: CTX,
    steps: WARM_SEQUENCE,
    when: (s, i) => `седмица ${i + 1}${s.skipFor ? " · прескача се при оферта/презентация" : ""}`,
  },
];

const cards: string[] = [];
let n = 0;
for (const g of groups) {
  cards.push(`<h2 style="margin:56px 0 6px;font:600 22px/1.3 -apple-system,Segoe UI,Roboto,sans-serif">${esc(g.title)}</h2>
<p style="margin:0 0 22px;color:#5b6660;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:640px">${esc(g.note)}</p>`);
  g.steps.forEach((step, i) => {
    n++;
    const { html } = step.build(NAME, g.ctx);
    cards.push(`<section style="background:#fff;border:1px solid #e3e8e5;border-radius:10px;padding:22px 26px;margin:0 0 18px;max-width:680px">
<div style="font:12px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#6b7772;margin-bottom:8px">
${n} · ${esc(step.kind ?? "")} · ${esc(g.when(step, i))} · <span style="color:#a0a8a4">${esc(step.key)}</span></div>
<div style="font:600 18px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;margin-bottom:16px">Тема: ${esc(subjectFor(step, g.ctx))}</div>
${html}
</section>`);
  });
}

const page = `<!doctype html>
<html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Всички автоматични писма · ${n}</title></head>
<body style="margin:0;padding:32px 20px 80px;background:#f3f5f4;color:#1d2320">
<h1 style="margin:0 0 6px;font:700 28px/1.2 -apple-system,Segoe UI,Roboto,sans-serif">Всички автоматични писма — ${n}</h1>
<p style="margin:0;color:#5b6660;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif">Така ги вижда получателят. Името е примерно („${NAME}"), линковете са истински.</p>
${cards.join("\n")}
</body></html>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page, "utf8");
console.log(`✓ ${n} писма → ${out}`);
