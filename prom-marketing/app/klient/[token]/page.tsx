import { loadPortal, touchPortal } from "@/lib/portal/repository";
import { isValidToken, progressOf, waitingOnClient, PORTAL_STATUS_LABEL } from "@/lib/portal/rules";
import { labelFor } from "@/lib/team/service-types";
import { PortalApp } from "@/components/klient/PortalApp";

export const dynamic = "force-dynamic";

/**
 * /klient/<token> — порталът на клиента.
 *
 * Клиентът вижда проектите си с напредък, стъпките, които чакат него, какво сме
 * му писали, следващата среща и отворените фактури. Може да пише, да отметне
 * стъпка, да поиска нещо и да поиска разговор — всичко влиза в CRM-а с името му
 * и Ивайло научава веднага. Достъпът е самият линк; страницата е noindex.
 */

const CSS = `
.kl-root{min-height:100vh;background:#0b1020;color:#e8eef7;font:400 16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.kl-root *{box-sizing:border-box}
.kl-wrap{max-width:880px;margin:0 auto;padding:0 16px 96px}
.kl-head{padding:36px 0 20px;border-bottom:1px solid rgba(255,255,255,.08)}
.kl-brand{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#22d3ee;margin:0 0 14px}
.kl-h1{font-size:clamp(26px,5vw,40px);line-height:1.1;margin:0 0 10px;font-weight:700}
.kl-h1 em{font-style:normal;color:#22d3ee}
.kl-lead{color:#9fb0c7;margin:0;max-width:60ch}
.kl-grid{display:grid;gap:14px;margin-top:22px}
@media(min-width:720px){.kl-grid.two{grid-template-columns:1fr 1fr}}
.kl-card{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:16px;padding:18px}
.kl-card h2{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9fb0c7;margin:0 0 12px}
.kl-card h3{font-size:17px;margin:0 0 4px}
.kl-muted{color:#7f90a8;font-size:13px}
.kl-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:10px 0 6px}
.kl-bar>span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#34d399)}
.kl-pill{display:inline-block;font-size:11px;padding:3px 9px;border-radius:999px;border:1px solid rgba(34,211,238,.4);color:#22d3ee;vertical-align:middle}
.kl-pill.wait{border-color:rgba(251,191,36,.5);color:#fbbf24}
.kl-pill.done{border-color:rgba(52,211,153,.5);color:#34d399}
.kl-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}
.kl-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.2)}
.kl-item.ok{border-color:rgba(52,211,153,.35)}
.kl-item.wait{border-color:rgba(251,191,36,.35);background:rgba(251,191,36,.05)}
.kl-item .t{flex:1;min-width:0}
.kl-item .t b{display:block;font-weight:600}
.kl-item .t small{color:#7f90a8}
.kl-b{font:600 14px/1 system-ui,sans-serif;border-radius:10px;padding:11px 14px;cursor:pointer;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#e8eef7;-webkit-tap-highlight-color:transparent}
.kl-b:disabled{opacity:.5;cursor:default}
.kl-b.go{background:#22d3ee;color:#0b1020;border-color:#22d3ee}
.kl-b.ok{background:#34d399;color:#0b1020;border-color:#34d399}
.kl-b.sm{padding:8px 11px;font-size:13px}
.kl-ta{width:100%;min-height:90px;resize:vertical;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(0,0,0,.25);color:#e8eef7;padding:10px 12px;font:400 15px/1.5 system-ui,sans-serif}
.kl-ta:focus{outline:none;border-color:#22d3ee}
.kl-msgs{display:grid;gap:8px;margin-top:10px}
.kl-msg{max-width:88%;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);font-size:15px;white-space:pre-wrap}
.kl-msg.me{margin-left:auto;background:rgba(34,211,238,.14)}
.kl-msg small{display:block;color:#7f90a8;font-size:11px;margin-bottom:3px}
.kl-upd{border-left:2px solid #22d3ee;padding:6px 12px;margin:8px 0}
.kl-upd b{display:block}
.kl-upd small{color:#7f90a8}
.kl-status{font-size:13px;min-height:18px;margin-top:6px}
.kl-status.ok{color:#34d399}.kl-status.err{color:#f87171}
.kl-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.kl-tab{font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#9fb0c7;cursor:pointer}
.kl-tab.on{border-color:#22d3ee;color:#22d3ee;background:rgba(34,211,238,.08)}
.kl-foot{margin-top:40px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);color:#7f90a8;font-size:13px;display:flex;flex-wrap:wrap;gap:8px 24px}
.kl-foot a{color:#22d3ee;text-decoration:none}
.kl-missing{max-width:520px;margin:18vh auto 0;padding:0 22px;text-align:center}
.kl-missing h1{font-size:30px;margin:0 0 12px}
`;

function Missing() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kl-missing">
        <p className="kl-brand">Pro Marketing</p>
        <h1>Този линк не отваря нищо</h1>
        <p className="kl-muted">Адресът е непълен или достъпът е спрян. Пишете на Ивайло на ivailo@promarketing.pw и ще получите нов.</p>
      </div>
    </>
  );
}

export default async function KlientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidToken(token)) return <Missing />;
  const data = await loadPortal(token);
  if (!data) return <Missing />;
  await touchPortal(data.contact.id);

  const name = data.contact.full_name?.trim().split(/\s+/)[0] || data.contact.company || "";
  const waiting = data.projects.flatMap((p) => waitingOnClient(p.tasks));
  const live = data.projects.filter((p) => p.status !== "done");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kl-wrap">
        <header className="kl-head">
          <p className="kl-brand">Pro Marketing · Вашият проект</p>
          <h1 className="kl-h1">
            {name ? `Здравейте, ${name}.` : "Здравейте."} <em>Ето докъде сме.</em>
          </h1>
          <p className="kl-lead">
            Тук виждате напредъка по всичко, което правим за Вас, стъпките, които чакат Вас, и можете да ни пишете направо — отговаряме
            в същия ден. {waiting.length > 0 ? `В момента ${waiting.length === 1 ? "една стъпка чака" : `${waiting.length} стъпки чакат`} Вас.` : ""}
          </p>
        </header>

        <div className="kl-grid two">
          <section className="kl-card">
            <h2>Напредък</h2>
            {live.length === 0 && data.projects.length === 0 && <p className="kl-muted">Още няма стартиран проект — ще се появи тук в деня, в който започнем.</p>}
            {data.projects.map((p) => {
              const pr = progressOf(p);
              return (
                <div key={p.id} style={{ marginBottom: 16 }}>
                  <h3>
                    {p.title} <span className={`kl-pill ${p.status === "done" ? "done" : p.status === "waiting_client" ? "wait" : ""}`}>{PORTAL_STATUS_LABEL[p.status] ?? p.status}</span>
                  </h3>
                  <p className="kl-muted">
                    {labelFor(p.service_type)}
                    {p.due_date ? ` · срок ${new Date(`${p.due_date}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "long" })}` : ""}
                  </p>
                  {p.portal_summary && <p style={{ margin: "6px 0 0" }}>{p.portal_summary}</p>}
                  <div className="kl-bar">
                    <span style={{ width: `${pr.pct}%` }} />
                  </div>
                  <p className="kl-muted">
                    {pr.total > 0 ? `${pr.done} от ${pr.total} стъпки готови · ${pr.pct}%` : `${pr.pct}%`}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="kl-card">
            <h2>Следваща среща и плащания</h2>
            {data.next_meeting ? (
              <p>
                📅{" "}
                <b>
                  {new Date(data.next_meeting.at).toLocaleString("bg-BG", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" })}
                </b>
                {data.next_meeting.url && (
                  <>
                    {" · "}
                    <a href={data.next_meeting.url} style={{ color: "#22d3ee" }}>
                      линк за срещата
                    </a>
                  </>
                )}
              </p>
            ) : (
              <p className="kl-muted">Няма насрочена среща. Ако Ви трябва — бутонът „Искам разговор“ по-долу.</p>
            )}
            {data.open_invoices.length > 0 ? (
              <ul className="kl-list">
                {data.open_invoices.map((i, idx) => (
                  <li key={idx} className="kl-item">
                    <div className="t">
                      <b>
                        Фактура {i.number ?? ""} · {i.amount.toLocaleString("bg-BG")} €
                      </b>
                      <small>{i.status === "partially_paid" ? "частично платена" : "чака плащане"}{i.due ? ` · до ${i.due}` : ""}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="kl-muted" style={{ marginTop: 10 }}>
                Няма отворени фактури. 🙌
              </p>
            )}
            <p className="kl-muted" style={{ marginTop: 14 }}>
              Вашият човек: <b style={{ color: "#e8eef7" }}>{data.contact_person.name}</b>
              {data.contact_person.phone ? ` · ${data.contact_person.phone}` : ""}
              {data.contact_person.email ? ` · ${data.contact_person.email}` : ""}
            </p>
          </section>
        </div>

        <PortalApp token={token} projects={data.projects} updates={data.updates} messages={data.messages} contactName={data.contact.full_name ?? data.contact.company ?? "Вие"} />

        <footer className="kl-foot">
          <span>Pro Marketing · Ивайло Петев</span>
          <a href="mailto:ivailo@promarketing.pw">ivailo@promarketing.pw</a>
          <a href="tel:+359877399963">+359 877 399 963</a>
        </footer>
      </div>
    </>
  );
}
