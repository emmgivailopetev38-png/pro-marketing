/**
 * /narachnik — „AI наръчник за собственика“, безплатният наръчник към лийд
 * рекламата „ПМ · Лийд магнит · AI наръчник · 2026-10-07“.
 *
 * Текстът е в `content.ts`. PDF-ът (`public/narachnik/AI-narachnik-ProMarketing.pdf`)
 * е печатът на същата страница (A4, Chrome „Print to PDF“): корица със
 * съдържанието, увод и всяка глава на собствена страница.
 */
import type { ReactNode } from "react";
import { PmMark } from "@/components/landing/PmMark";
import { CopyButton } from "./CopyButton";
import {
  BOOKING,
  GLAVI,
  KAK_RABOTIM,
  NASLOV,
  PDF_PATH,
  PHONE,
  PHONE_TEL,
  PODNASLOV,
  RISKOVE,
  UVOD,
  type Glava,
} from "./content";

/** **дебело** → <b>; нищо друго не се тълкува. */
function rich(s: string): ReactNode[] {
  return s.split("**").map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

const pad = (n: number) => String(n).padStart(2, "0");

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла докрай,
   иначе в PDF-а полетата на листа излизат тъмни */
html:has(.nr-doc),body:has(.nr-doc){background:#FBFAFE;color-scheme:light}
.nr-doc{
  --ground:#FBFAFE; --panel:#F3F0FB; --surface:#FFFFFF;
  --ink:#1A1033; --ink-2:#463F5C; --ink-3:#7A7390;
  --rule:#E5E0F2; --rule-soft:#EFEBF8;
  --violet:#6D28D9; --violet-soft:#EFE7FD; --cyan:#0E7490; --cyan-soft:#E3F6FA; --pink:#BE185D;
  --shadow:0 1px 2px rgba(26,16,51,.05), 0 10px 28px -18px rgba(60,30,120,.30);
  background:var(--ground); color:var(--ink);
  font-family:var(--nr-ui),Arial,sans-serif; font-size:17px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
.nr-doc *{box-sizing:border-box}
.nr-doc .wrap{max-width:900px;margin:0 auto;padding:0 24px 92px}
.nr-doc h1,.nr-doc h2{font-family:var(--nr-head),Georgia,serif;font-weight:700;letter-spacing:-.015em;text-wrap:balance}
.nr-doc h3{font-family:var(--nr-ui),Arial,sans-serif;font-weight:700;letter-spacing:-.005em}
.nr-doc a{color:var(--violet);text-underline-offset:3px}
.nr-doc a:focus-visible,.nr-doc button:focus-visible{outline:2px solid var(--violet);outline-offset:3px;border-radius:4px}
.nr-doc p{margin:0}
.nr-doc b{font-weight:650;color:var(--ink)}
.nr-doc .bar{height:6px;background:linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)}
.nr-doc .brandrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0 0;font-weight:700;font-size:15px}
.nr-doc .brandrow a{color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;gap:9px}
.nr-doc .brandrow span{color:var(--ink-3);font-weight:500;white-space:nowrap}
.nr-doc .brandrow a{white-space:nowrap}
.nr-doc .brandrow .tel{color:var(--ink-3);font-weight:500}
.nr-doc .mark{width:30px;height:30px}
.nr-doc .printonly{display:none}
.nr-doc .need-h{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:24px 0 10px}
.nr-doc .need{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.nr-doc .need li{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:12px 14px;font-size:15px;line-height:1.5;color:var(--ink-2)}

/* ── корица ── */
.nr-doc .cover{padding:0 0 34px}
.nr-doc .cover .eyebrow{margin-top:40px}
.nr-doc .eyebrow{font-weight:700;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--violet);margin:0 0 16px}
.nr-doc h1{font-size:52px;line-height:1.05;margin:0 0 16px}
.nr-doc h1 em{font-style:normal;background:linear-gradient(90deg,#0891b2,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
.nr-doc .deck{font-size:20px;line-height:1.5;color:var(--ink-2);max-width:40ch;margin:0 0 24px}
.nr-doc .byline{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;font-size:14px;color:var(--ink-3)}
.nr-doc .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;text-decoration:none;color:#fff !important;background:var(--violet);border-radius:10px;padding:12px 18px;font-size:15px}
.nr-doc .btn.ghost{color:var(--violet) !important;background:transparent;border:1.5px solid var(--violet)}
.nr-doc .toc{margin:30px 0 0;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:22px 26px;box-shadow:var(--shadow)}
.nr-doc .toc h2{font-family:var(--nr-ui),sans-serif;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:0 0 12px;font-weight:700}
.nr-doc .toc ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 28px}
.nr-doc .toc li a{display:grid;grid-template-columns:34px 1fr;gap:6px;align-items:baseline;padding:7px 0;border-bottom:1px dashed var(--rule-soft);color:var(--ink);text-decoration:none;font-weight:600;font-size:15.5px}
.nr-doc .toc li a .n{font-family:var(--nr-mono),monospace;font-size:12.5px;color:var(--violet);font-weight:500}
.nr-doc .toc li a small{display:block;font-weight:400;color:var(--ink-3);font-size:13px;line-height:1.4;margin-top:2px}
.nr-doc .toc .extra{grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:4px 28px}
.nr-doc .toc .extra a{grid-template-columns:auto;border-bottom:0}

/* ── увод ── */
.nr-doc .intro{margin:44px 0 0}
.nr-doc .kick{font-weight:700;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--violet);margin:0 0 8px}
.nr-doc .h2{font-size:32px;line-height:1.15;margin:0 0 14px}
.nr-doc .intro p{color:var(--ink-2);max-width:68ch;margin:0 0 14px}
.nr-doc .rule1{background:var(--violet-soft);border-left:4px solid var(--violet);border-radius:0 12px 12px 0;padding:16px 20px;margin:18px 0 22px;color:var(--ink)}
.nr-doc .karta{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--rule);border-radius:14px;overflow:hidden;font-size:15.5px}
.nr-doc .karta th{text-align:left;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);padding:12px 18px;background:var(--panel);font-weight:700}
.nr-doc .karta td{padding:11px 18px;border-top:1px solid var(--rule-soft);color:var(--ink-2)}
.nr-doc .karta td.g{font-weight:700;color:var(--violet);white-space:nowrap}

/* ── глава ── */
.nr-doc .glava{margin:64px 0 0;padding-top:30px;border-top:1px solid var(--rule)}
.nr-doc .ghead{display:grid;grid-template-columns:auto 1fr;gap:4px 18px;align-items:end;margin:0 0 22px}
.nr-doc .gnum{font-family:var(--nr-head),Georgia,serif;font-weight:700;font-size:64px;line-height:.9;background:linear-gradient(160deg,#22d3ee,#8b5cf6 60%,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}
.nr-doc .ghead h2{font-size:34px;line-height:1.1;margin:0}
.nr-doc .ghead p{grid-column:2;color:var(--ink-3);font-size:16px}
.nr-doc .blk{margin:0 0 18px}
.nr-doc .blk h3{font-size:13px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 6px;color:var(--ink-3)}
.nr-doc .blk p{color:var(--ink-2);max-width:70ch}
.nr-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 18px}
.nr-doc .two .blk{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:16px 18px;margin:0}
.nr-doc .two .blk.ai{background:var(--cyan-soft);border-color:#C8EBF2}
.nr-doc .two .blk.ai h3{color:var(--cyan)}
.nr-doc .steps{list-style:none;margin:0;padding:0;counter-reset:s;display:flex;flex-direction:column;gap:9px}
.nr-doc .steps li{counter-increment:s;display:grid;grid-template-columns:28px 1fr;gap:10px;color:var(--ink-2);font-size:16px;line-height:1.55}
.nr-doc .steps li:before{content:counter(s);display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--violet);color:#fff;font-weight:700;font-size:13px;margin-top:1px}
.nr-doc .prompt{position:relative;margin:16px 0 0;background:#1A1033;color:#F2EEFF;border-radius:14px;padding:16px 18px 16px}
.nr-doc .prompt .lbl{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#B9A8F5;font-weight:700;margin:0 0 8px}
.nr-doc .prompt p{font-size:15px;line-height:1.6;color:#F2EEFF}
.nr-doc .copy{font-family:var(--nr-ui),sans-serif;font-size:12.5px;font-weight:700;color:#1A1033;background:#E9E1FF;border:0;border-radius:8px;padding:6px 12px;cursor:pointer;letter-spacing:0;text-transform:none}
.nr-doc .praktika{margin:16px 0 0;border:1px dashed #D9CCF7;border-radius:12px;padding:12px 16px;font-size:15.5px;color:var(--ink-2);background:var(--surface)}
.nr-doc .praktika b{color:var(--violet)}
.nr-doc .nas{margin:16px 0 0;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;background:var(--violet-soft);border-radius:12px;padding:14px 18px;font-size:15.5px;color:var(--ink)}
.nr-doc .nas .l{font-weight:700;color:var(--violet);white-space:nowrap}

/* ── рискове ── */
.nr-doc .risk{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.nr-doc .risk div{background:var(--surface);border:1px solid var(--rule);border-left:4px solid var(--pink);border-radius:12px;padding:14px 16px}
.nr-doc .risk h3{font-size:16px;margin:0 0 5px;color:var(--ink)}
.nr-doc .risk p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}

/* ── как работим ── */
.nr-doc .how{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 0}
.nr-doc .how div{background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--violet);border-radius:12px;padding:16px}
.nr-doc .how .d{font-family:var(--nr-mono),monospace;font-size:12px;letter-spacing:.1em;color:var(--violet);display:block;margin:0 0 6px}
.nr-doc .how h3{font-size:16.5px;margin:0 0 6px}
.nr-doc .how p{font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.nr-doc .closing{margin:22px 0 0;background:linear-gradient(135deg,#1A1033,#2B1460);color:#fff;border-radius:18px;padding:28px 30px}
.nr-doc .closing h2{font-size:28px;margin:0 0 10px;color:#fff}
.nr-doc .closing p{color:#E6DEFF;max-width:60ch}
.nr-doc .closing .contacts{display:flex;flex-wrap:wrap;gap:12px 28px;margin:18px 0 0;font-size:17px}
.nr-doc .closing .contacts a{color:#fff;font-weight:700;text-decoration:none}
.nr-doc .closing .contacts small{display:block;color:#B9A8F5;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
.nr-doc .closing .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
.nr-doc .closing .btn{background:#22d3ee;color:#0E1A3A !important}
.nr-doc .sig{margin:26px 0 0;font-size:13px;color:var(--ink-3);line-height:1.7}

@media (max-width:760px){
  .nr-doc .wrap{padding:0 16px 72px}
  .nr-doc .brandrow .dom{display:none}
  .nr-doc h1{font-size:36px}
  .nr-doc .deck{font-size:17.5px}
  .nr-doc .toc{padding:18px}
  .nr-doc .toc ol{grid-template-columns:1fr}
  .nr-doc .h2{font-size:26px}
  .nr-doc .gnum{font-size:48px}
  .nr-doc .ghead h2{font-size:26px}
  .nr-doc .ghead p{grid-column:1 / -1}
  .nr-doc .two,.nr-doc .risk,.nr-doc .how,.nr-doc .need{grid-template-columns:1fr}
  .nr-doc .nas{grid-template-columns:1fr;gap:4px}
  .nr-doc .closing{padding:22px 20px}
  .nr-doc .karta td,.nr-doc .karta th{padding:10px 12px}
}

@media print{
  :root,html,body{color-scheme:light;background:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .nr-doc{background:#fff;font-size:13.5px;line-height:1.52}
  .nr-doc .wrap{max-width:none;padding:0}
  .nr-doc .bar{display:none}
  .nr-doc .noprint,.nr-doc .copy{display:none !important}
  .nr-doc .printonly{display:block}
  /* стр. 1 — корица със съдържанието, точно една страница */
  .nr-doc .cover{height:266mm;display:flex;flex-direction:column;padding:0}
  .nr-doc .brandrow{padding:0;font-size:14px}
  .nr-doc .pbar{height:5px;border-radius:3px;margin:12px 0 0;background:linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)}
  .nr-doc .cover .eyebrow{margin-top:24mm;font-size:11px}
  .nr-doc h1{font-size:58px;line-height:1.02;margin-bottom:16px}
  .nr-doc h1 em{background:none;color:#6D28D9;-webkit-text-fill-color:#6D28D9}
  .nr-doc .deck{font-size:20px;max-width:34ch;margin-bottom:0}
  .nr-doc .toc{margin-top:16mm;box-shadow:none;padding:18px 22px;background:#F7F4FE;border-color:#E5DCFA}
  .nr-doc .toc li a{font-size:14px;padding:6px 0}
  .nr-doc .toc li a small{font-size:11.5px}
  .nr-doc .cfoot{margin-top:auto;display:flex;justify-content:space-between;gap:16px;border-top:1px solid var(--rule);padding-top:10px;font-size:12px;color:var(--ink-3)}
  /* стр. 2 — увод; всяка глава, рисковете и „Как работим“ — на нова страница */
  .nr-doc .intro,.nr-doc .glava,.nr-doc .sec-risk,.nr-doc .sec-how{break-before:page;margin:0;padding-top:0;border-top:0}
  .nr-doc .kick{font-size:11px}
  .nr-doc .h2{font-size:30px}
  .nr-doc .intro p{font-size:14px}
  .nr-doc .need-h{font-size:11px;margin:18px 0 8px}
  .nr-doc .need{gap:8px}
  .nr-doc .need li{font-size:13px;padding:10px 12px}
  .nr-doc .karta{font-size:13.5px}
  .nr-doc .karta td,.nr-doc .karta th{padding:8px 14px}
  .nr-doc .ghead{margin-bottom:18px}
  .nr-doc .gnum{font-size:60px}
  .nr-doc .ghead h2{font-size:31px}
  .nr-doc .ghead p{font-size:14px}
  .nr-doc .blk{margin-bottom:15px}
  .nr-doc .blk h3{font-size:11px}
  .nr-doc .blk p{font-size:14px}
  .nr-doc .two{gap:12px;margin-bottom:15px}
  .nr-doc .two .blk{padding:13px 15px}
  .nr-doc .steps{gap:8px}
  .nr-doc .steps li{font-size:14px;grid-template-columns:24px 1fr;gap:9px}
  .nr-doc .steps li:before{width:21px;height:21px;font-size:11.5px}
  .nr-doc .prompt{margin-top:14px;padding:13px 16px}
  .nr-doc .prompt .lbl{font-size:10px;margin-bottom:6px}
  .nr-doc .prompt p{font-size:13.5px}
  .nr-doc .praktika,.nr-doc .nas{margin-top:14px;padding:12px 15px;font-size:14px}
  .nr-doc .risk{gap:10px}
  .nr-doc .risk div{padding:12px 14px}
  .nr-doc .risk h3{font-size:14.5px}
  .nr-doc .risk p{font-size:13px}
  .nr-doc .how div{padding:14px}
  .nr-doc .how h3{font-size:15px}
  .nr-doc .how p{font-size:13.5px}
  .nr-doc .closing{padding:22px 24px;margin-top:16px}
  .nr-doc .closing h2{font-size:24px}
  .nr-doc .closing p{font-size:14px}
  .nr-doc .closing .contacts{font-size:16px}
  .nr-doc .sig{font-size:11.5px}
  .nr-doc .two .blk,.nr-doc .prompt,.nr-doc .praktika,.nr-doc .nas,.nr-doc .risk div,.nr-doc .how div,.nr-doc .closing,.nr-doc .karta,.nr-doc .need li{break-inside:avoid}
  /* A4 е под 760px — връщаме колоните, които мобилният изглед сгъва */
  .nr-doc .toc ol,.nr-doc .two,.nr-doc .risk,.nr-doc .how,.nr-doc .need{grid-template-columns:1fr 1fr}
  .nr-doc .nas{grid-template-columns:auto 1fr}
  .nr-doc .ghead p{grid-column:2}
  .nr-doc .two .blk,.nr-doc .praktika,.nr-doc .nas,.nr-doc .closing,.nr-doc .prompt,.nr-doc .rule1,.nr-doc .karta th,.nr-doc .steps li:before,.nr-doc .toc,.nr-doc .pbar{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  nextjs-portal{display:none}
}
@page{size:A4;margin:14mm 15mm}
`;

function GlavaSection({ g }: { g: Glava }) {
  return (
    <section className="glava" id={g.id} aria-labelledby={`${g.id}-h`}>
      <header className="ghead">
        <span className="gnum" aria-hidden="true">{pad(g.n)}</span>
        <h2 id={`${g.id}-h`}>{g.zaglavie}</h2>
        <p>{g.kratko}</p>
      </header>
      <div className="two">
        <div className="blk">
          <h3>Проблемът</h3>
          <p>{rich(g.problem)}</p>
        </div>
        <div className="blk ai">
          <h3>Какво прави AI</h3>
          <p>{rich(g.ai)}</p>
        </div>
      </div>
      <div className="blk">
        <h3>Как да започнеш днес</h3>
        <ol className="steps">
          {g.start.map((s, i) => (
            <li key={i}>
              <span>{rich(s)}</span>
            </li>
          ))}
        </ol>
      </div>
      {g.prompt && (
        <div className="prompt">
          <div className="lbl">
            <span>Заявка за ChatGPT, Claude или Gemini</span>
            <CopyButton text={g.prompt} />
          </div>
          <p>{g.prompt}</p>
        </div>
      )}
      {g.praktika && (
        <p className="praktika">
          <b>От нашата практика: </b>
          {rich(g.praktika)}
        </p>
      )}
      <p className="nas">
        <span className="l">Кога да ни потърсиш</span>
        <span>{rich(g.nas)}</span>
      </p>
    </section>
  );
}

export default function NarachnikPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar noprint" />
      <main className="wrap" id="top">
        <header className="cover">
          <div className="brandrow">
            <a href="https://promarketing.pw/">
              <PmMark className="mark" id="nr-top" />
              Pro Marketing
            </a>
            <span>
              <span className="dom">promarketing.pw · </span>
              <a className="tel" href={`tel:${PHONE_TEL}`}>
                {PHONE}
              </a>
            </span>
          </div>
          <div className="pbar printonly" />
          <p className="eyebrow">Безплатен наръчник · Pro Marketing · октомври 2026</p>
          <h1>
            AI наръчник за <em>собственика</em>
          </h1>
          <p className="deck">{PODNASLOV}</p>
          <div className="byline">
            <a className="btn noprint" href={PDF_PATH} download>
              Изтегли PDF ↓
            </a>
            <a className="btn ghost noprint" href={BOOKING}>
              Безплатен разговор · 45 мин
            </a>
            <span>За собственици на малки и средни фирми · на прост български</span>
          </div>

          <nav className="toc" aria-label="Съдържание">
            <h2>Съдържание</h2>
            <ol>
              {GLAVI.map((g) => (
                <li key={g.id}>
                  <a href={`#${g.id}`}>
                    <span className="n">{pad(g.n)}</span>
                    <span>
                      {g.zaglavie}
                      <small>{g.kratko}</small>
                    </span>
                  </a>
                </li>
              ))}
              <li className="extra">
                <a href="#uvod">Как да ползваш наръчника</a>
                <a href="#riskove">{RISKOVE.zaglavie}</a>
                <a href="#kak-rabotim">{KAK_RABOTIM.zaglavie}</a>
              </li>
            </ol>
          </nav>
          <div className="cfoot printonly">
            <span>
              <b>Безплатен разговор, 45 минути онлайн:</b> promarketing.pw/booking · {PHONE}
            </span>
            <span>Pro Marketing · октомври 2026</span>
          </div>
        </header>

        <section className="intro" id="uvod" aria-labelledby="uvod-h">
          <p className="kick">Преди да започнеш</p>
          <h2 className="h2" id="uvod-h">
            {UVOD.zaglavie}
          </h2>
          {UVOD.abzaci.map((a, i) => (
            <p key={i}>{rich(a)}</p>
          ))}
          <p className="rule1">{rich(UVOD.pravilo)}</p>
          <h3 className="need-h">Какво ти трябва, за да започнеш</h3>
          <ul className="need">
            {UVOD.triabva.map((t) => (
              <li key={t}>{rich(t)}</li>
            ))}
          </ul>
          <h3 className="need-h">Откъде да започнеш</h3>
          <table className="karta">
            <thead>
              <tr>
                <th>Ако…</th>
                <th>Започни от</th>
              </tr>
            </thead>
            <tbody>
              {UVOD.karta.map((k) => (
                <tr key={k.ako}>
                  <td>{k.ako}</td>
                  <td className="g">{/^\d/.test(k.glavi) ? `глава ${k.glavi}` : k.glavi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {GLAVI.map((g) => (
          <GlavaSection key={g.id} g={g} />
        ))}

        <section className="glava sec-risk" id="riskove" aria-labelledby="riskove-h">
          <header className="ghead">
            <span className="gnum" aria-hidden="true">!</span>
            <h2 id="riskove-h">{RISKOVE.zaglavie}</h2>
            <p>{RISKOVE.kratko}</p>
          </header>
          <div className="risk">
            {RISKOVE.pravila.map((r) => (
              <div key={r.t}>
                <h3>{r.t}</h3>
                <p>{rich(r.d)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glava sec-how" id="kak-rabotim" aria-labelledby="kak-rabotim-h">
          <p className="kick">Pro Marketing</p>
          <h2 className="h2" id="kak-rabotim-h">
            {KAK_RABOTIM.zaglavie}
          </h2>
          <p style={{ color: "var(--ink-2)", maxWidth: "68ch" }}>{rich(KAK_RABOTIM.uvod)}</p>
          <div className="how">
            {KAK_RABOTIM.stapki.map((s, i) => (
              <div key={s.t}>
                <span className="d">Стъпка {i + 1}</span>
                <h3>{s.t}</h3>
                <p>{rich(s.d)}</p>
              </div>
            ))}
          </div>
          <div className="closing">
            <h2>Запиши безплатен разговор</h2>
            <p>{rich(KAK_RABOTIM.pokana)}</p>
            <div className="contacts">
              <span>
                <small>Онлайн, 45 минути</small>
                <a href={BOOKING}>promarketing.pw/booking</a>
              </span>
              <span>
                <small>Телефон</small>
                <a href={`tel:${PHONE_TEL}`}>{PHONE}</a>
              </span>
            </div>
            <div className="ctas noprint">
              <a className="btn" href={BOOKING}>
                Избери час →
              </a>
            </div>
          </div>
          <p className="sig">
            {NASLOV} · Pro Marketing (Про Маркетинг ЕООД) · promarketing.pw · октомври 2026. Инструментите и условията им се
            менят — провери на сайта им, преди да разчиташ на тях. Наръчникът е с информационна цел и не е правен съвет.
          </p>
        </section>
      </main>
    </>
  );
}
