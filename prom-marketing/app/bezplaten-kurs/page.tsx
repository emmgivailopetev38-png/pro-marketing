/**
 * /bezplaten-kurs — „Фирма с AI служители“, безплатният видео курс към лийд
 * рекламата „ПМ · Безплатен курс · AI за собственика · 2026-10-07“.
 *
 * Текстът е в `content.ts`, видеата — в `public/bezplaten-kurs/`.
 */
import { PmMark } from "@/components/landing/PmMark";
import { DVA_PATYA, MOST, NASLOV, PHONE, PHONE_TEL, PODNASLOV, PROZRACHNOST, UROCI, type Urok } from "./content";

const CSS = `
/* сайтът е тъмен (color-scheme: dark в globals.css) — тази страница е светла */
html:has(.kr-doc),body:has(.kr-doc){background:#FBFAFE;color-scheme:light}
.kr-doc{
  --ground:#FBFAFE; --panel:#F3F0FB; --surface:#FFFFFF;
  --ink:#1A1033; --ink-2:#463F5C; --ink-3:#6E6784;
  --rule:#E5E0F2; --violet:#6D28D9; --violet-soft:#EFE7FD; --cyan:#0E7490;
  --shadow:0 1px 2px rgba(26,16,51,.05), 0 14px 34px -20px rgba(60,30,120,.34);
  background:var(--ground); color:var(--ink);
  font-family:var(--kr-ui),Arial,sans-serif; font-size:17px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.kr-doc *{box-sizing:border-box}
.kr-doc .wrap{max-width:860px;margin:0 auto;padding:0 24px 88px}
.kr-doc h1,.kr-doc h2{font-family:var(--kr-head),Georgia,serif;font-weight:700;letter-spacing:-.015em;text-wrap:balance}
.kr-doc a{color:var(--violet);text-underline-offset:3px}
.kr-doc a:focus-visible{outline:2px solid var(--violet);outline-offset:3px;border-radius:6px}
.kr-doc p{margin:0}
.kr-doc .bar{height:6px;background:linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)}
.kr-doc .brandrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0 0;font-weight:700;font-size:15px}
.kr-doc .brandrow a{color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;gap:9px;white-space:nowrap}
.kr-doc .brandrow .tel{color:var(--ink-3);font-weight:500}
.kr-doc .mark{width:30px;height:30px}

.kr-doc .hero{padding:44px 0 8px}
.kr-doc .eyebrow{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--violet);margin:0 0 16px}
.kr-doc .eyebrow i{width:8px;height:8px;border-radius:50%;background:#ec4899;box-shadow:0 0 0 4px rgba(236,72,153,.15)}
.kr-doc h1{font-size:54px;line-height:1.04;margin:0 0 16px}
.kr-doc h1 em{font-style:normal;background:linear-gradient(90deg,#0891b2,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
.kr-doc .deck{font-size:20px;line-height:1.5;color:var(--ink-2);max-width:44ch}
.kr-doc .meta{display:flex;flex-wrap:wrap;gap:8px 10px;margin:22px 0 0}
.kr-doc .meta span{font-size:13.5px;font-weight:600;color:var(--ink-2);background:var(--surface);border:1px solid var(--rule);border-radius:999px;padding:6px 12px}
.kr-doc .ai{margin:22px 0 0;display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.5;color:var(--ink-2);background:var(--violet-soft);border-radius:12px;padding:12px 16px}
.kr-doc .ai b{color:var(--violet);white-space:nowrap}

.kr-doc .urok{margin:56px 0 0;scroll-margin-top:16px}
.kr-doc .uhead{display:grid;grid-template-columns:auto 1fr;gap:2px 16px;align-items:end;margin:0 0 16px}
.kr-doc .unum{font-family:var(--kr-head),Georgia,serif;font-weight:700;font-size:58px;line-height:.9;background:linear-gradient(160deg,#22d3ee,#8b5cf6 60%,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}
.kr-doc .uhead small{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:700}
.kr-doc .uhead h2{font-size:31px;line-height:1.12;margin:2px 0 0}
.kr-doc .uhead p{grid-column:2;color:var(--ink-2);font-size:16.5px;margin-top:6px}
.kr-doc .player{position:relative;width:100%;max-width:520px;aspect-ratio:4/5;border-radius:20px;overflow:hidden;background:#0B0B12;box-shadow:var(--shadow)}
.kr-doc .player video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#0B0B12}
.kr-doc .skoro{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;color:#E6DEFF;background:radial-gradient(120% 80% at 30% 10%,rgba(139,92,246,.35),transparent 60%),radial-gradient(90% 70% at 80% 90%,rgba(34,211,238,.25),transparent 60%),#100B22}
.kr-doc .skoro b{display:block;font-family:var(--kr-head),Georgia,serif;font-size:26px;color:#fff;margin:0 0 6px}
.kr-doc .most{margin:16px 0 0;max-width:520px;display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:14px 16px;font-size:15.5px;color:var(--ink-2)}
.kr-doc .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;text-decoration:none;color:#fff !important;background:var(--violet);border-radius:10px;padding:11px 16px;font-size:15px;white-space:nowrap}
.kr-doc .btn.ghost{color:var(--violet) !important;background:transparent;border:1.5px solid var(--violet)}

.kr-doc .patya{margin:72px 0 0}
.kr-doc .patya h2{font-size:34px;margin:0 0 18px}
.kr-doc .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.kr-doc .card{background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:22px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:8px}
.kr-doc .card.dark{background:linear-gradient(135deg,#1A1033,#2B1460);border:0;color:#fff}
.kr-doc .card .k{font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--violet)}
.kr-doc .card.dark .k{color:#B9A8F5}
.kr-doc .card h3{font-family:var(--kr-head),Georgia,serif;font-size:23px;line-height:1.2;margin:0}
.kr-doc .card p{color:var(--ink-2);font-size:15.5px}
.kr-doc .card.dark p{color:#E6DEFF}
.kr-doc .card .btn{align-self:flex-start;margin-top:8px}
.kr-doc .card.dark .btn{background:#22d3ee;color:#0E1A3A !important}
.kr-doc .sig{margin:40px 0 0;font-size:13.5px;color:var(--ink-3);line-height:1.7}
.kr-doc .sig a{color:var(--ink-3)}

@media (max-width:760px){
  .kr-doc .wrap{padding:0 16px 72px}
  .kr-doc .brandrow .dom{display:none}
  .kr-doc .hero{padding-top:30px}
  .kr-doc h1{font-size:38px}
  .kr-doc .deck{font-size:17.5px}
  .kr-doc .urok{margin-top:44px}
  .kr-doc .unum{font-size:44px}
  .kr-doc .uhead h2{font-size:24px}
  .kr-doc .uhead p{grid-column:1 / -1}
  .kr-doc .player{border-radius:16px}
  .kr-doc .two{grid-template-columns:1fr}
  .kr-doc .patya h2{font-size:28px}
}
`;

function UrokSection({ u }: { u: Urok }) {
  const most = u.most ? MOST[u.most] : null;
  const min = u.sekundi ? (u.sekundi < 60 ? `${u.sekundi} сек` : `${Math.floor(u.sekundi / 60)}:${String(Math.round(u.sekundi % 60)).padStart(2, "0")} мин`) : null;
  return (
    <section className="urok" id={u.id} aria-labelledby={`${u.id}-h`}>
      <header className="uhead">
        <span className="unum" aria-hidden="true">
          {u.n}
        </span>
        <div>
          <small>
            Урок {u.n} от {UROCI.length}
            {min ? ` · ${min}` : ""}
          </small>
          <h2 id={`${u.id}-h`}>{u.zaglavie}</h2>
        </div>
        <p>{u.kakvo}</p>
      </header>
      <div className="player">
        {u.video ? (
          <video controls playsInline preload="metadata" poster={u.poster ?? undefined} aria-label={`Урок ${u.n}: ${u.zaglavie}`}>
            <source src={u.video} type="video/mp4" />
          </video>
        ) : (
          <div className="skoro">
            <div>
              <b>Излиза скоро</b>
              Урокът се монтира — пускаме го тук до дни.
            </div>
          </div>
        )}
      </div>
      {most && (
        <p className="most">
          <span>{most.tekst}</span>
          <a className="btn ghost" href={most.href}>
            {most.buton} →
          </a>
        </p>
      )}
    </section>
  );
}

export default function BezplatenKursPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar" />
      <main className="wrap" id="top">
        <div className="brandrow">
          <a href="https://promarketing.pw/">
            <PmMark className="mark" id="kr-top" />
            Pro Marketing
          </a>
          <span>
            <span className="dom">promarketing.pw · </span>
            <a className="tel" href={`tel:${PHONE_TEL}`}>
              {PHONE}
            </a>
          </span>
        </div>

        <header className="hero">
          <p className="eyebrow">
            <i aria-hidden="true" />
            Безплатен курс · {UROCI.length} видео урока
          </p>
          <h1>
            Фирма с <em>AI служители</em>
          </h1>
          <p className="deck">{PODNASLOV}</p>
          <div className="meta">
            <span>{UROCI.length} урока · по около минута</span>
            <span>Истинските ми екрани</span>
            <span>Ивайло Петев · Pro Marketing</span>
          </div>
          <p className="ai">
            <b>AI глас</b>
            <span>{PROZRACHNOST}</span>
          </p>
        </header>

        {UROCI.map((u) => (
          <UrokSection key={u.id} u={u} />
        ))}

        <section className="patya" aria-labelledby="patya-h">
          <h2 id="patya-h">{DVA_PATYA.zaglavie}</h2>
          <div className="two">
            <div className="card dark">
              <span className="k">{DVA_PATYA.odit.kick}</span>
              <h3>{DVA_PATYA.odit.zaglavie}</h3>
              <p>{DVA_PATYA.odit.tekst}</p>
              <a className="btn" href={DVA_PATYA.odit.href}>
                {DVA_PATYA.odit.buton} →
              </a>
            </div>
            <div className="card">
              <span className="k">{DVA_PATYA.akademia.kick}</span>
              <h3>{DVA_PATYA.akademia.zaglavie}</h3>
              <p>{DVA_PATYA.akademia.tekst}</p>
              <a className="btn ghost" href={DVA_PATYA.akademia.href}>
                {DVA_PATYA.akademia.buton} →
              </a>
            </div>
          </div>
        </section>

        <p className="sig">
          Ивайло Петев · Pro Marketing LTD · <a href="https://promarketing.pw/">promarketing.pw</a> ·{" "}
          <a href={`tel:${PHONE_TEL}`}>{PHONE}</a> · <a href="https://promarketing.pw/privacy">Поверителност</a>
        </p>
      </main>
    </>
  );
}
