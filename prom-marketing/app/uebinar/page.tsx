/**
 * /uebinar — залата на безплатния филм-уебинар „ВЪЛНАТА“.
 *
 * С личния линк от писмото (`?k=…`) човекът влиза направо — познаваме го.
 * Без него първо оставя име, имейл и телефон (`/api/uebinar/register`), за да
 * знаем кой гледа. Плейърът праща маяк при пускане и при всяка четвърт →
 * „🎬 Гледа уебинара — N %“ в картона (`lib/uebinar/views.ts`).
 */
import { PmMark } from "@/components/landing/PmMark";
import { firstName } from "@/lib/email/sequence-layout";
import { UEBINAR, uebinarVideo } from "@/lib/uebinar/config";
import { contactByKey } from "@/lib/uebinar/views";
import { UebinarRoom } from "./UebinarRoom";

export const dynamic = "force-dynamic";

const CSS = `
html:has(.ub-doc),body:has(.ub-doc){background:#FBFAFE;color-scheme:light}
.ub-doc{
  --ground:#FBFAFE; --surface:#FFFFFF; --ink:#1A1033; --ink-2:#463F5C; --ink-3:#6E6784;
  --rule:#E5E0F2; --violet:#6D28D9; --violet-soft:#EFE7FD;
  --shadow:0 1px 2px rgba(26,16,51,.05), 0 14px 34px -20px rgba(60,30,120,.34);
  background:var(--ground); color:var(--ink); min-height:100vh;
  font-family:var(--ub-ui),Arial,sans-serif; font-size:17px; line-height:1.6; -webkit-font-smoothing:antialiased;
}
.ub-doc *{box-sizing:border-box}
.ub-doc .wrap{max-width:900px;margin:0 auto;padding:0 20px 80px}
.ub-doc .bar{height:6px;background:linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)}
.ub-doc .brandrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0 0;font-weight:700;font-size:15px}
.ub-doc .brandrow a{color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;gap:9px;white-space:nowrap}
.ub-doc .brandrow .tel{color:var(--ink-3);font-weight:500}
.ub-doc .mark{width:30px;height:30px}
.ub-doc .hero{padding:40px 0 6px}
.ub-doc .eyebrow{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--violet);margin:0 0 14px}
.ub-doc .eyebrow i{width:8px;height:8px;border-radius:50%;background:#ec4899;box-shadow:0 0 0 4px rgba(236,72,153,.15)}
.ub-doc h1{font-family:var(--ub-head),Georgia,serif;font-weight:700;letter-spacing:-.015em;font-size:60px;line-height:1.02;margin:0 0 12px}
.ub-doc h1 em{font-style:normal;background:linear-gradient(90deg,#0891b2,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
.ub-doc .deck{font-size:20px;line-height:1.5;color:var(--ink-2);max-width:46ch;margin:0}
.ub-doc .meta{display:flex;flex-wrap:wrap;gap:8px 10px;margin:20px 0 0;padding:0;list-style:none}
.ub-doc .meta li{font-size:13.5px;font-weight:600;color:var(--ink-2);background:var(--surface);border:1px solid var(--rule);border-radius:999px;padding:6px 12px}
.ub-doc .ai{margin:18px 0 0;font-size:14px;color:var(--ink-3)}
.ub-doc .ai b{color:var(--violet)}
.ub-doc .room{margin:28px 0 0}
.ub-doc .screen{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#0B0B12;box-shadow:var(--shadow)}
.ub-doc .screen video{position:absolute;inset:0;width:100%;height:100%;background:#0B0B12}
.ub-doc .soon{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;color:#E6DEFF;background:radial-gradient(120% 80% at 30% 10%,rgba(139,92,246,.35),transparent 60%),#100B22}
.ub-doc .gate{background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:24px;box-shadow:var(--shadow);max-width:560px}
.ub-doc .gate h2{font-family:var(--ub-head),Georgia,serif;font-size:28px;line-height:1.15;margin:0 0 6px}
.ub-doc .gate p{margin:0 0 16px;color:var(--ink-2);font-size:16px}
.ub-doc .gate label{display:block;font-size:14px;font-weight:600;color:var(--ink-2);margin:0 0 12px}
.ub-doc .gate input{display:block;width:100%;margin-top:5px;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid var(--rule);border-radius:10px;background:#fff;color:var(--ink)}
.ub-doc .gate input:focus{outline:2px solid var(--violet);outline-offset:1px;border-color:var(--violet)}
.ub-doc .gate small{display:block;margin-top:12px;font-size:13px;color:var(--ink-3)}
.ub-doc .gate .err{color:#b4235a;font-size:14px;margin:6px 0 0}
.ub-doc .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:700;text-decoration:none;color:#fff !important;background:var(--violet);border:0;border-radius:10px;padding:13px 18px;font-size:16px;cursor:pointer;white-space:nowrap}
.ub-doc .btn[disabled]{opacity:.6;cursor:wait}
.ub-doc .btn.ghost{color:var(--violet) !important;background:transparent;border:1.5px solid var(--violet)}
.ub-doc .hi{font-size:18px;margin:0 0 14px;color:var(--ink-2)}
.ub-doc .after{margin:22px 0 0;display:grid;gap:14px}
.ub-doc .after .card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:16px 18px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}
.ub-doc .after .card p{margin:0;color:var(--ink-2);font-size:16px;max-width:52ch}
.ub-doc .sig{margin:40px 0 0;padding-top:16px;border-top:1px solid var(--rule);font-size:14px;color:var(--ink-3);display:flex;flex-wrap:wrap;gap:6px 14px}
.ub-doc .sig a{color:var(--ink-3)}
@media (max-width:640px){.ub-doc h1{font-size:42px}.ub-doc .deck{font-size:18px}.ub-doc .gate{padding:18px}}
`;

export default async function UebinarPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k: rawK } = await searchParams;
  const k = (rawK ?? "").trim().toLowerCase();
  const contact = /^[0-9a-f]{8}$/.test(k) ? await contactByKey(k).catch(() => null) : null;
  const known = contact ? { k, name: firstName(contact.full_name) } : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar" />
      <div className="wrap">
        <div className="brandrow">
          <a href="/">
            <PmMark className="mark" id="ub-top" />
            ProMarketing
          </a>
          <a className="tel" href="tel:+359877399963">
            0877 399 963
          </a>
        </div>

        <header className="hero">
          <p className="eyebrow">
            <i /> Безплатен филм-уебинар · подарък
          </p>
          <h1>
            {UEBINAR.title}. <em>{UEBINAR.tagline}</em>
          </h1>
          <p className="deck">
            Защо България изпусна компютрите, какво изпускаме сега с AI — и какво може да направи една малка фирма още
            тази седмица.
          </p>
          <ul className="meta">
            <li>{UEBINAR.minutes} минути</li>
            <li>Безплатно</li>
            <li>Гледаш когато ти е удобно</li>
          </ul>
          <p className="ai">
            <b>Честно отпред:</b> филмът е направен изцяло с AI — дори гласът. Точно това е и темата му.
          </p>
        </header>

        <section className="room" aria-label="Залата">
          <UebinarRoom known={known} video={known ? uebinarVideo() : null} />
        </section>

        <footer className="sig">
          <span>Ивайло Петев · Pro Marketing LTD</span>
          <a href="https://petevai.com">🌐 petevai.com</a>
          <a href="/">promarketing.pw</a>
          <a href="https://promarketing.pw/viber">💬 Viber канал</a>
          <a href="/privacy">Поверителност</a>
        </footer>
      </div>
    </>
  );
}
