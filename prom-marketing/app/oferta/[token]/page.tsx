import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOfferByToken } from "@/lib/oferti/repository";
import type { OfferItem } from "@/lib/oferti/katalog";
import { fmtEur, isToken, withUnit } from "@/lib/oferti/smetki";
import { viewModel } from "@/lib/oferti/view";
import { OFFER_CSS } from "@/lib/oferti/page-css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  if (!isToken(token)) return { title: "Оферта · ProMarketing", robots: { index: false, follow: false } };
  const offer = await getOfferByToken(token);
  if (!offer) return { title: "Оферта · ProMarketing", robots: { index: false, follow: false } };
  const v = viewModel(offer);
  return {
    title: `Оферта за ${v.forLine} · ${offer.title} · ProMarketing`,
    description: v.content.outcome ?? offer.title,
    robots: { index: false, follow: false },
  };
}

function ItemCard({ it, tag }: { it: OfferItem; tag?: string }) {
  return (
    <article className={tag ? "card alt" : "card"}>
      {tag && <p className="alt-tag">{tag}</p>}
      <div className="top">
        <div>
          <h3>{it.title}</h3>
          {it.subtitle && <p className="sub">{it.subtitle}</p>}
        </div>
        <div className="price">
          <b>{fmtEur(it.price)}</b>
          <span>
            {it.unit}
            {it.qty && it.qty > 1 ? ` × ${it.qty}` : ""}
          </span>
          {it.setup_price ? (
            <span>
              + {fmtEur(it.setup_price)} {it.setup_label ?? "внедряване"}
            </span>
          ) : null}
        </div>
      </div>
      {it.bullets.length > 0 && (
        <ul className="pts">
          {it.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      )}
      {it.outcome && <p className="res">Резултатът: {it.outcome}</p>}
      {it.not_included && it.not_included.length > 0 && <p className="not">Не включва: {it.not_included.join(" · ")}</p>}
      {it.note && <p className="note">{it.note}</p>}
    </article>
  );
}

/** /oferta/<код> — офертата онлайн (същото като PDF-а) + бутоните за PDF, обаждане и Viber. */
export default async function OfertaPage({ params }: Params) {
  const { token } = await params;
  if (!isToken(token)) notFound();
  const offer = await getOfferByToken(token);
  if (!offer) notFound();
  const v = viewModel(offer);
  const { content, seller, totals } = v;
  const vie = content.greeting === "vie";
  const showMonthly = totals.monthly_after > 0;
  const showOneTime = totals.one_time > 0;
  const viber = `viber://chat?number=${encodeURIComponent(seller.phone_raw)}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: OFFER_CSS }} />
      <div className="band" />
      <div className="wrap">
        <header className="head">
          <div className="brand">
            Pro<b>Marketing</b>
            <small>AI МАРКЕТИНГ · АВТОМАТИЗАЦИИ · СИСТЕМИ ЗА МАЛКИ ФИРМИ</small>
          </div>
          <div className="meta">
            Оферта № {v.number} · {v.date}
            <br />
            валидна до {v.validUntil}
          </div>
        </header>

        <p className="eyebrow">Оферта за {v.forLine}</p>
        <h1>{offer.title}</h1>
        <p className="greet">{v.greeting}</p>
        {content.intro && <p className="lead">{content.intro}</p>}
        {content.pain && (
          <div className="pain">
            <small>Това чухме от {vie ? "Вас" : "теб"}</small>
            {content.pain}
          </div>
        )}
        {content.outcome && <p className="outcome">{content.outcome}</p>}

        <div className="cta">
          <a className="btn p" href={`/oferta/${token}/pdf`} target="_blank" rel="noreferrer">
            Свали офертата като PDF
          </a>
          <a className="btn s" href={`tel:${seller.phone_raw}`}>
            Обади се на {seller.first} · {seller.phone}
          </a>
          <a className="btn s" href={viber}>
            Пиши във Viber
          </a>
        </div>

        <h2>Какво получава{vie ? "те" : "ш"}</h2>
        {v.items.map((it, i) => (
          <ItemCard key={i} it={it} />
        ))}

        <h2>Инвестицията</h2>
        <table>
          <tbody>
            {v.items.map((it, i) => (
              <tr key={i}>
                <td>
                  {it.title}
                  {it.setup_price ? <small>+ внедряване {fmtEur(it.setup_price)} еднократно</small> : null}
                </td>
                <td className="r">
                  {withUnit(fmtEur((it.price ?? 0) * (it.qty && it.qty > 0 ? it.qty : 1)), it.unit)}
                </td>
              </tr>
            ))}
            {totals.discount > 0 && (
              <tr>
                <td>Отстъпка{offer.discount_note ? ` — ${offer.discount_note}` : ""}</td>
                <td className="r">− {fmtEur(totals.discount)}</td>
              </tr>
            )}
            {showOneTime && (
              <tr className="tot">
                <td>Общо еднократно</td>
                <td className="r">{fmtEur(totals.one_time_after)}</td>
              </tr>
            )}
            {showMonthly && (
              <tr className="tot">
                <td>Общо месечно</td>
                <td className="r">{fmtEur(totals.monthly_after)}/мес</td>
              </tr>
            )}
          </tbody>
        </table>
        {v.vatLine && <p className="vat">{v.vatLine}</p>}
        {v.hasInstallments && (
          <div className="inst">
            <small>На вноски през TBI Bank</small>
            {v.installmentLines.map((l, i) => (
              <div key={i}>
                {v.installmentLines.length > 1 ? `${l.title}: ` : ""}
                {l.line} на месец
              </div>
            ))}
            <em>Ориентировъчно, без застраховка; точната вноска се вижда при одобрението онлайн — минути, без посещение в банка.</em>
          </div>
        )}

        {v.compare && (
          <>
            <h2>{v.compare.title}</h2>
            <p className="cmp-note">{v.compare.note}</p>
            {v.compare.table && (
              <div className="cmp-scroll">
                <table className="cmp">
                  <thead>
                    <tr>
                      <th />
                      {v.compare.table.columns.map((c, i) => (
                        <th key={i} className={c.recommended ? "rec" : undefined}>
                          {c.title}
                          {c.recommended && <small>препоръчано</small>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {v.compare.table.rows.map((r, i) => (
                      <tr key={i} className={r.label === "Цена" ? "cena" : undefined}>
                        <td className="lbl">{r.label}</td>
                        {r.values.map((val, j) => (
                          <td key={j} className={v.compare!.table!.columns[j]?.recommended ? "rec" : undefined}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {v.alternatives.map((it, i) => (
              <ItemCard key={i} it={it} tag="за сравнение — не влиза в сумата" />
            ))}
          </>
        )}

        {v.sections.map((sec, i) => (
          <section key={i}>
            <h2>{sec.title}</h2>
            {(sec.text ?? "")
              .split(/\n\s*\n/)
              .map((x) => x.trim())
              .filter(Boolean)
              .map((para, j) => (
                <p className="sec-text" key={j}>
                  {para}
                </p>
              ))}
            {sec.bullets && sec.bullets.length > 0 && (
              <ul className="pts">
                {sec.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {content.next_steps.length > 0 && (
          <>
            <h2>Как протича</h2>
            <ol className="steps">
              {content.next_steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </>
        )}
        {content.terms.length > 0 && (
          <>
            <h2>Условия</h2>
            <ul className="terms">
              {content.terms.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </>
        )}
        {content.ps && <p className="ps">P.S. {content.ps}</p>}

        {v.about && (
          <>
            <h2>{v.about.title}</h2>
            <div className="about">
              {v.about.paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {v.about.cases.length > 0 && (
                <>
                  <small>{v.about.cases_label}</small>
                  <ul className="pts">
                    {v.about.cases.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </>
              )}
              <small>{v.about.proof_label}</small>
              <p className="proof">{v.about.proof}</p>
              <small>{v.about.links_label}</small>
              <ul className="links">
                {v.about.links.map((l, i) => (
                  <li key={i}>
                    {l.label}: <a href={l.url}>{l.url.replace(/^https?:\/\//, "")}</a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="cta">
          <a className="btn p" href={`tel:${seller.phone_raw}`}>
            Казвам „да“ — обаждане на {seller.first}
          </a>
          <a className="btn s" href={viber}>
            Viber
          </a>
          <a className="btn s" href={`/oferta/${token}/pdf`} target="_blank" rel="noreferrer">
            PDF
          </a>
        </div>

        <footer className="sign">
          <div>
            <b>{seller.name}</b>
            <span className="role">{seller.role}</span>
            <div>
              <a href={`tel:${seller.phone_raw}`}>{seller.phone}</a>
            </div>
            {seller.key !== "ivailo" && (
              <div className="role">
                Ивайло Петев · основател · <a href="tel:+359877399963">+359 877 399 963</a>
              </div>
            )}
          </div>
          <div className="right">
            Въпрос или „да“ — отговор на имейла или едно обаждане.
            <br />
            <a href="https://promarketing.pw">promarketing.pw</a> · <a href="https://petevai.com">petevai.com</a>
          </div>
        </footer>
        <p className="foot">ProMarketing · Pro Marketing LTD · Русе · оферта № {v.number}</p>
      </div>
    </>
  );
}
