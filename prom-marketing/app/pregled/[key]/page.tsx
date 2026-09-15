import { PregledForm } from "@/components/pregled/PregledForm";
import { loadReview, touchView } from "@/lib/pregled/repository";
import { isValidKey } from "@/lib/pregled/types";

/**
 * /pregled/<ключ> — клиентът гледа клиповете и ги одобрява с по един бутон.
 *
 * Сървърната част само зарежда пакета и вече дадените отговори (за да може
 * човекът да продължи от друг телефон); всичко живо е в PregledForm.
 * Грешен или изтрит ключ дава приятелска страница, не 404 на Next.
 */

export const dynamic = "force-dynamic";

const CSS = `
.pg-doc{
  --nokta:#140c07; --kadife:#1e130c; --kadife-2:#281a10;
  --zlato:#d8b25e; --zlato-jarko:#f0d79a; --bordo:#7c1a24;
  --krem:#efe4cf; --krem-tih:#b6a78d; --linia:rgba(216,178,94,.22);
  --ok:#3f9a5c; --ok-tih:rgba(63,154,92,.18);
  min-height:100vh; background:var(--nokta); color:var(--krem);
  font:400 16px/1.6 var(--pg-sans),"Segoe UI",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.pg-doc *{box-sizing:border-box}
.pg-doc a{color:var(--zlato);text-decoration:none;border-bottom:1px solid var(--linia)}
.pg-doc a:hover{color:var(--zlato-jarko);border-color:var(--zlato)}
.pg-doc :focus-visible{outline:2px solid var(--zlato);outline-offset:3px}
.pg-obvivka{max-width:1120px;margin:0 auto;padding:0 18px 110px}
.pg-glava{padding:44px 0 26px;border-bottom:1px solid var(--linia)}
.pg-marka{font:500 11px/1 var(--pg-sans),sans-serif;letter-spacing:.32em;text-transform:uppercase;color:var(--zlato);margin:0 0 22px}
.pg-h1{font:400 clamp(34px,6vw,60px)/1.05 var(--pg-serif),Georgia,serif;margin:0 0 16px;text-wrap:balance;color:var(--krem)}
.pg-h1 em{font-style:italic;color:var(--zlato-jarko)}
.pg-uvod{max-width:58ch;color:var(--krem-tih);margin:0 0 14px;font-size:17px}
.pg-uvod b{color:var(--krem);font-weight:600}
.pg-stapki{display:grid;gap:10px;margin:22px 0 0;padding:0;list-style:none;max-width:60ch}
.pg-stapki li{display:flex;gap:12px;align-items:flex-start;color:var(--krem-tih);font-size:15px}
.pg-stapki .n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--zlato);color:var(--nokta);font:700 13px/26px var(--pg-sans),sans-serif;text-align:center}
.pg-stapki b{color:var(--krem);font-weight:600}
.pg-redche{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:13px;color:var(--krem-tih);margin-top:22px}
.pg-redche b{color:var(--zlato);font-weight:500}

/* лентата с броячите — лепне горе на телефона */
.pg-lenta{position:sticky;top:0;z-index:20;background:rgba(20,12,7,.94);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--linia);margin:0 -18px;padding:10px 18px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}
.pg-broi{display:flex;gap:14px;font-size:13px;color:var(--krem-tih);white-space:nowrap}
.pg-broi b{color:var(--krem);font-weight:600}
.pg-broi .ok b{color:var(--ok)}
.pg-lenta-butoni{display:flex;gap:8px;flex-wrap:wrap}

/* бутоните */
.pg-b{font:600 14px/1 var(--pg-sans),sans-serif;border-radius:6px;padding:12px 16px;cursor:pointer;border:1px solid var(--linia);
  background:var(--kadife-2);color:var(--krem);transition:background .15s,color .15s,border-color .15s,transform .05s;-webkit-tap-highlight-color:transparent}
.pg-b:active{transform:translateY(1px)}
.pg-b[disabled]{opacity:.55;cursor:default}
.pg-b-zlato{background:var(--zlato);color:var(--nokta);border-color:var(--zlato)}
.pg-b-zlato:hover{background:var(--zlato-jarko)}
.pg-b-tih{background:transparent;color:var(--krem-tih)}
.pg-b-tih:hover{color:var(--krem);border-color:var(--zlato)}

/* клиповете */
.pg-sekcia{padding-top:34px}
.pg-h2{font:400 clamp(24px,3.4vw,34px)/1.15 var(--pg-serif),Georgia,serif;margin:0 0 8px}
.pg-vodesht{color:var(--krem-tih);max-width:62ch;margin:0 0 26px}
.pg-klipove{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:30px 28px}
.pg-karta{display:flex;flex-direction:column;gap:12px;padding:14px;border:1px solid var(--linia);border-radius:8px;background:var(--kadife);transition:border-color .2s,box-shadow .2s}
.pg-karta.e-ok{border-color:rgba(63,154,92,.55);box-shadow:0 0 0 1px rgba(63,154,92,.25)}
.pg-karta.e-ne{border-color:rgba(124,26,36,.7);box-shadow:0 0 0 1px rgba(124,26,36,.3)}
.pg-ekran{position:relative;border-radius:4px;overflow:hidden;background:#000;border:1px solid var(--linia);max-width:360px;margin:0 auto;width:100%}
.pg-ekran video{display:block;width:100%;aspect-ratio:9/16;object-fit:cover;background:#000}
.pg-nomer{position:absolute;top:0;left:0;z-index:2;font:600 11px/1 var(--pg-sans),sans-serif;letter-spacing:.18em;color:var(--nokta);background:var(--zlato);padding:6px 10px;border-radius:0 0 4px 0}
.pg-ime{font:600 17px/1.3 var(--pg-sans),sans-serif;color:var(--krem);margin:0}
.pg-replika{font:italic 400 19px/1.35 var(--pg-serif),Georgia,serif;color:var(--zlato-jarko);border-left:2px solid var(--zlato);padding-left:12px;margin:0}
.pg-replika.nyama{color:var(--krem-tih);border-color:var(--linia);font-style:normal;font-family:var(--pg-sans),sans-serif;font-size:14px}
.pg-rolya{font-size:14px;color:var(--krem-tih);margin:0}
.pg-znachki{display:flex;flex-wrap:wrap;gap:6px}
.pg-znachka{font:500 11px/1 var(--pg-sans),sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--krem-tih);border:1px solid var(--linia);border-radius:2px;padding:5px 8px}
.pg-izbor{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:2px}
.pg-izbor .pg-b{padding:14px 10px;font-size:15px}
.pg-b-ok.e-on{background:var(--ok);border-color:var(--ok);color:#fff}
.pg-b-ne.e-on{background:var(--bordo);border-color:var(--bordo);color:#fff}
.pg-belezhka{width:100%;min-height:74px;resize:vertical;border:1px solid var(--linia);border-radius:6px;background:var(--nokta);color:var(--krem);
  padding:10px 12px;font:400 14px/1.5 var(--pg-sans),sans-serif}
.pg-belezhka::placeholder{color:rgba(182,167,141,.7)}
.pg-belezhka:focus{border-color:var(--zlato);outline:none}
.pg-belezhka-golyama{min-height:150px;font-size:15px}
.pg-nasoki{margin-top:44px;padding:26px 24px;border:1px solid var(--linia);border-left:3px solid var(--zlato);border-radius:8px;background:var(--kadife)}
.pg-nasoki h3{font:400 26px/1.2 var(--pg-serif),Georgia,serif;margin:0 0 8px;color:var(--krem)}
.pg-nasoki p{margin:0 0 14px;color:var(--krem-tih);max-width:62ch}
.pg-sastoyanie{font-size:12px;color:var(--krem-tih);min-height:16px;display:flex;justify-content:flex-end;gap:6px}
.pg-sastoyanie.e-ok{color:var(--ok)}
.pg-sastoyanie.e-greshka{color:#e08a8a}

/* финалът */
.pg-final{margin-top:44px;padding:26px 24px;border:1px solid var(--zlato);border-radius:8px;background:linear-gradient(180deg,var(--kadife-2),var(--kadife))}
.pg-final h3{font:400 26px/1.2 var(--pg-serif),Georgia,serif;margin:0 0 8px;color:var(--krem)}
.pg-final p{margin:0 0 14px;color:var(--krem-tih);max-width:60ch}
.pg-final .pg-b{padding:16px 24px;font-size:16px}
.pg-gotovo{margin-top:22px;padding:22px 24px;border-left:3px solid var(--ok);background:var(--ok-tih);border-radius:6px}
.pg-gotovo h4{font:400 24px/1.2 var(--pg-serif),Georgia,serif;margin:0 0 6px;color:var(--krem)}
.pg-gotovo p{margin:0;color:var(--krem)}
.pg-gotovo p+p{margin-top:8px;color:var(--krem-tih)}

.pg-kutia{margin-top:44px;padding:24px 26px;background:var(--kadife);border:1px solid var(--linia);border-left:3px solid var(--bordo);border-radius:6px}
.pg-kutia h3{font:400 22px/1.2 var(--pg-serif),Georgia,serif;margin:0 0 10px}
.pg-kutia p{margin:0 0 10px;color:var(--krem-tih);max-width:64ch}
.pg-kutia p:last-child{margin-bottom:0}
.pg-kutia b{color:var(--zlato);font-weight:500}
.pg-kraj{margin-top:60px;padding-top:24px;border-top:1px solid var(--linia);display:flex;flex-wrap:wrap;gap:8px 30px;font-size:14px;color:var(--krem-tih)}

.pg-lipsva{max-width:520px;margin:18vh auto 0;padding:0 22px;text-align:center}
.pg-lipsva h1{font:400 34px/1.15 var(--pg-serif),Georgia,serif;margin:0 0 12px}
.pg-lipsva p{color:var(--krem-tih)}

@media (max-width:640px){
  .pg-glava{padding:30px 0 22px}
  .pg-klipove{grid-template-columns:1fr}
  .pg-lenta{padding:9px 14px;margin:0 -18px}
  .pg-broi{gap:10px;font-size:12px}
  .pg-lenta .pg-b{padding:10px 12px;font-size:13px}
}
@media (prefers-reduced-motion:reduce){.pg-doc *{animation:none!important;transition:none!important}}
`;

function Lipsva() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg-lipsva">
        <p className="pg-marka">Pro Marketing</p>
        <h1>Този линк не отваря нищо</h1>
        <p>
          Или адресът е непълен, или пакетът с видеата вече е сменен. Пишете на Ивайло на{" "}
          <a href="mailto:ivailo@promarketing.pw">ivailo@promarketing.pw</a> и ще получите нов.
        </p>
      </div>
    </>
  );
}

export default async function PregledPage({ params }: { params: Promise<{ key: string }> }) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey).trim();
  const loaded = isValidKey(key) ? await loadReview(key) : null;
  if (!loaded) return <Lipsva />;

  const { review, answers } = loaded;
  await touchView(review.id, review.view_count);

  const govoreshti = review.items.filter((i) => i.line).length;
  const intro =
    review.intro ??
    "Пуснете всеки клип със звук, най-добре на телефон. Ако Ви харесва, натиснете „Одобрявам“. Ако нещо не Ви е по вкуса, натиснете „Не този“ и напишете с две думи какво да променим.";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg-obvivka">
        <header className="pg-glava">
          <p className="pg-marka">{review.title}</p>
          <h1 className="pg-h1">
            {review.client_name ? `Здравейте, ${review.client_name}.` : "Здравейте."} <em>Ето първите видеа.</em>
          </h1>
          <p className="pg-uvod">{intro}</p>
          <ol className="pg-stapki">
            <li>
              <span className="n">1</span>
              <span>
                <b>Гледате</b> клипа със звук.
              </span>
            </li>
            <li>
              <span className="n">2</span>
              <span>
                <b>Одобрявам</b> или <b>Не този</b> — и под всеки клип пишете какво да променим.
              </span>
            </li>
            <li>
              <span className="n">3</span>
              <span>
                Най-долу има място за <b>общи насоки</b> към нас, после <b>Изпрати избора</b>. Ако бързате: „Одобри
                всички“ горе и махнете само тези, които не искате.
              </span>
            </li>
          </ol>
          <p className="pg-redche">
            <span>
              <b>{review.items.length}</b> клипа
            </span>
            <span>
              Формат <b>9:16</b>, по 5–10 секунди
            </span>
            <span>
              <b>{govoreshti}</b> с български глас
            </span>
            <span>Изборът Ви се пази — може да спрете и да продължите по-късно</span>
          </p>
        </header>

        <PregledForm
          reviewKey={review.key}
          items={review.items}
          initialAnswers={answers}
          initialGeneral={review.general_comment}
        />

        <section className="pg-kutia">
          <h3>Едно правило, което спазваме дословно</h3>
          <p>
            Ако накараш такава програма просто „да направи реклама за метров шоколад“, тя измисля обикновено
            блокче със златна хартия и някакъв надпис отгоре. Пробвахме го и стана точно това.
          </p>
          <p>
            Затова всяка сцена тръгва от <b>истинска снимка на Вашата кутия</b> и буквите и печатът не се
            пипат. Всеки готов клип минава през проверка: изписва се какво точно е казал гласът, кадрите се
            гледат един по един, и ако кутията не е Вашата, клипът се изхвърля и се прави наново.
          </p>
        </section>

        <footer className="pg-kraj">
          <span>Pro Marketing · Ивайло Петев</span>
          <span>
            <a href="mailto:ivailo@promarketing.pw">ivailo@promarketing.pw</a>
          </span>
          <span>
            <a href="https://1meterchocolate.com" target="_blank" rel="noopener noreferrer">
              1meterchocolate.com
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}
