import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { loadBiznes } from "@/lib/team/biznes";
import { forecast, monthLabel, pctOf, per } from "@/lib/team/biznes-rules";
import { EkipHeader } from "@/components/ekip/EkipHeader";

export const dynamic = "force-dynamic";

const money = (n: number | null, cur = "€") => (n === null ? "—" : `${n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`);
const int = (n: number) => n.toLocaleString("bg-BG");
const pct = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("bg-BG")}%`);
const day = (iso: string) => new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Europe/Sofia" });

/**
 * „Бизнесът“ — цялата картина за мениджърите на продажбите: рекламата до
 * стотинка по месеци, кампании и реклами; колко от лийдовете са стигнали до
 * среща и до клиент; изводите от досега и какво следва. Само мениджър и собственик.
 */
export default async function BiznesPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "biznes")) redirect(homeFor(actor.member));
  const [nav, b] = await Promise.all([ekipNav(actor), loadBiznes()]);
  const t = b.totals;
  const k = b.konversii;
  const campaigns = k.campaigns.filter((c) => c.purpose === "leads" || c.leads > 0).sort((x, y) => y.eur - x.eur);
  const burned = campaigns.filter((c) => c.eur >= 40 && c.meetings === 0);
  const cheapest = campaigns.filter((c) => c.cost.meeting !== null && c.meetings >= 2).sort((x, y) => (x.cost.meeting ?? 0) - (y.cost.meeting ?? 0)).slice(0, 5);
  const withClients = campaigns.filter((c) => c.won > 0);
  const f5 = forecast(t, 5);
  const f10 = forecast(t, 10);
  const th = "px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]";
  const td = "px-2 py-1.5 text-sm tabular-nums";
  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";

  const tiles: Array<[string, string, string?]> = [
    ["Разход за реклама (наши лийдове)", money(t.usd, "$"), `≈ ${money(t.eur)} по 1,17 $/€`],
    ["Лийдове от реклами", int(t.leads), `по Meta: ${int(t.metaLeads)}`],
    ["€ на лийд", money(per(t.eur, t.leads))],
    ["Записани срещи", int(t.booked), `дошли ${int(t.held)} · не дошли ${int(t.noShow)}`],
    ["€ на проведена среща", money(per(t.eur, t.held)), `явяване ${pct(pctOf(t.held, t.held + t.noShow))}`],
    ["Клиенти от реклами", int(t.won), `€ на клиент ${money(per(t.eur, t.won))}`],
  ];

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="biznes" unread={nav.unread} />
      <main className="space-y-6 px-4 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Бизнесът · цялата картина</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Всичко от май 2026 насам: колко е струвала рекламата до стотинка, какво е донесла всяка кампания и реклама, колко от хората са стигнали до среща и до
            клиент. Числата се смятат на живо от CRM-а и от синхрона с Meta (два пъти на ден).
            {b.lastSpendDay ? ` Последен ден с рекламен разход: ${day(`${b.lastSpendDay}T12:00:00Z`)}.` : ""}
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map(([label, value, sub]) => (
            <div key={label} className={card}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
              {sub && <p className="text-[11px] text-[var(--color-text-tertiary)]">{sub}</p>}
            </div>
          ))}
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📅 По месеци</h2>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Разходът е точно колкото таксува Meta (в долари); еврото е по 1,17 $/€. Лийдовете са новите картони от реклами в CRM-а; срещите — по часа им.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={th}>Месец</th>
                  <th className={th}>Разход $</th>
                  <th className={th}>Разход €</th>
                  <th className={th}>Лийдове</th>
                  <th className={th}>€ / лийд</th>
                  <th className={th}>Записани</th>
                  <th className={th}>Дошли</th>
                  <th className={th}>Не дошли</th>
                  <th className={th}>Явяване</th>
                  <th className={th}>€ / проведена</th>
                  <th className={th}>Клиенти</th>
                  <th className={th}>Сделки €</th>
                </tr>
              </thead>
              <tbody>
                {b.months.map((m) => (
                  <tr key={m.month} className="border-b border-white/5">
                    <td className="px-2 py-1.5 text-sm capitalize">{monthLabel(m.month)}</td>
                    <td className={td}>{money(m.usd, "$")}</td>
                    <td className={td}>{money(m.eur)}</td>
                    <td className={td}>{int(m.leads)}</td>
                    <td className={td}>{money(per(m.eur, m.leads))}</td>
                    <td className={td}>{int(m.booked)}</td>
                    <td className={td}>{int(m.held)}</td>
                    <td className={td}>{int(m.noShow)}</td>
                    <td className={td}>{pct(pctOf(m.held, m.held + m.noShow))}</td>
                    <td className={td}>{money(per(m.eur, m.held))}</td>
                    <td className={td}>{int(m.won)}</td>
                    <td className={td}>{m.wonValue ? money(m.wonValue) : "—"}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="px-2 py-1.5 text-sm">Общо</td>
                  <td className={td}>{money(t.usd, "$")}</td>
                  <td className={td}>{money(t.eur)}</td>
                  <td className={td}>{int(t.leads)}</td>
                  <td className={td}>{money(per(t.eur, t.leads))}</td>
                  <td className={td}>{int(t.booked)}</td>
                  <td className={td}>{int(t.held)}</td>
                  <td className={td}>{int(t.noShow)}</td>
                  <td className={td}>{pct(pctOf(t.held, t.held + t.noShow))}</td>
                  <td className={td}>{money(per(t.eur, t.held))}</td>
                  <td className={td}>{int(t.won)}</td>
                  <td className={td}>{t.wonValue ? money(t.wonValue) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📣 По кампании · {campaigns.length}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Всяка кампания за лийдове от май насам. Името казва какво е пробвано (видео, оферта, бюджет, дата). Човек се брои към кампанията на първата си заявка.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={th}>Кампания</th>
                  <th className={th}>Разход €</th>
                  <th className={th}>Лийдове</th>
                  <th className={th}>€ / лийд</th>
                  <th className={th}>Звънени</th>
                  <th className={th}>Говорили</th>
                  <th className={th}>Срещи</th>
                  <th className={th}>€ / среща</th>
                  <th className={th}>Клиенти</th>
                  <th className={th}>€ / клиент</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaign_id} className="border-b border-white/5 align-top">
                    <td className="max-w-[360px] px-2 py-1.5 text-xs">
                      {c.name}
                      {c.offer ? <span className="ml-1 text-[var(--color-text-tertiary)]">{c.offer}</span> : null}
                    </td>
                    <td className={td}>{money(c.eur)}</td>
                    <td className={td}>
                      {int(c.leads)}
                      {c.metaLeads && c.metaLeads !== c.leads ? <span className="block text-[10px] text-[var(--color-text-tertiary)]">Meta {int(c.metaLeads)}</span> : null}
                    </td>
                    <td className={td}>{money(c.cost.lead)}</td>
                    <td className={td}>{int(c.touched)}</td>
                    <td className={td}>{int(c.talked)}</td>
                    <td className={td}>{int(c.meetings)}</td>
                    <td className={td}>{money(c.cost.meeting)}</td>
                    <td className={td}>{int(c.won)}</td>
                    <td className={td}>{money(c.cost.won)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            Лийдовете до 19.08.2026 са внесени от таблица на Meta (CSV) без номера на кампанията — затова старите кампании имат разход, но 0 лийда тук. В „По
            месеци“ и „По реклами“ тези хора са преброени.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🎬 По реклами · {b.ads.length}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Всяка реклама, от която е дошъл поне един лийд: колко хора, колко дошли на среща, колко клиенти.
            {b.adSpendKnown ? " Разходът е по реклама, от синхрона с Meta." : " Разходът по отделна реклама се зарежда от синхрона с Meta — дотогава цената е по кампания (горе)."}
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={th}>Реклама</th>
                  <th className={th}>Кампания</th>
                  <th className={th}>Лийдове</th>
                  <th className={th}>Дошли на среща</th>
                  <th className={th}>Клиенти</th>
                  <th className={th}>Разход €</th>
                  <th className={th}>€ / лийд</th>
                  <th className={th}>Период</th>
                </tr>
              </thead>
              <tbody>
                {b.ads.map((a) => (
                  <tr key={`${a.ad}-${a.campaign}-${a.first}`} className="border-b border-white/5 align-top">
                    <td className="max-w-[260px] px-2 py-1.5 text-xs">{a.ad}</td>
                    <td className="max-w-[260px] px-2 py-1.5 text-[11px] text-[var(--color-text-tertiary)]">{a.campaign}</td>
                    <td className={td}>{int(a.leads)}</td>
                    <td className={td}>{int(a.held)}</td>
                    <td className={td}>{int(a.won)}</td>
                    <td className={td}>{money(a.eur)}</td>
                    <td className={td}>{a.eur !== null ? money(per(a.eur, a.leads)) : "—"}</td>
                    <td className="px-2 py-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                      {day(a.first)} – {day(a.last)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧪 Какво показаха тестовете</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--color-text-secondary)]">
              {cheapest.length > 0 && (
                <li>
                  <b>Най-евтина среща</b>:{" "}
                  {cheapest.map((c) => `${c.name.slice(0, 70)} — ${money(c.cost.meeting)} (${c.meetings} срещи)`).join("; ")}.
                </li>
              )}
              {withClients.length > 0 && (
                <li>
                  <b>Довели клиенти</b>: {withClients.map((c) => `${c.name.slice(0, 70)} — ${c.won}`).join("; ")}.
                </li>
              )}
              {burned.length > 0 && (
                <li>
                  <b>Изгорели пари (≥ 40 €, нито една среща)</b>: {burned.map((c) => `${c.name.slice(0, 60)} — ${money(c.eur)}`).join("; ")}.
                </li>
              )}
              <li>
                <b>Кой записва часа има значение</b> (анализ 19.11.2026): час, записан от Ели — 18 от 34 проведени (53 %); записан от човек — 16 от 16. Затова от 24.11
                звъни човек (сетърът), не Ели.
              </li>
              <li>
                <b>Часът на срещата</b>: до 12:00 идват 88 %, 12–15 ч — 72 %, 15–18 ч — 56 % (анализ 19.11.2026).
              </li>
              <li>
                <b>Безплатните магнити дават евтин лийд, но не и срещи</b>: PDF наръчник 0,74 €/лийд → 0 записани; АЗ обучение 0,53 € → 9 записани, 1 проведена.
                Платената програма с филтър във формата 8,81 €/лийд → 4 записани, 4 проведени, 2 оферти.
              </li>
              <li>
                <b>Какво носи клиенти</b>: Ивайло на видео с истински резултат в първите 3 секунди + лека форма + обаждане до минути. AI песни, анимации и роботът като
                платена реклама — горят пари.
              </li>
            </ul>
          </div>

          <div className={card}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧭 Напред</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--color-text-secondary)]">
              <li>
                <b>Уебинарът „Допълнителен доход с AI“</b> — неделя 29.11 от 19:00. На него се продава „Пари с AI“ 3 900 € (с карта през линковете или на вноски през
                TBI от 114 €/мес).
              </li>
              <li>Рекламите са на пауза от 16.11; пикселът е обучен — пускат се за уебинара.</li>
              <li>Новите лийдове отиват при сетъра — звъни до минути. Срещите се дават на клоузърите поравно.</li>
              <li>За собственици на бизнес — два разговора (2-call close): първият, демо между тях, вторият.</li>
              <li>Оперативки: вторник, сряда и петък, 11:15–11:30.</li>
            </ul>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
              <p className="font-semibold">Колко трябва за N продажби на месец (при сегашните проценти от рекламите)</p>
              {f5 && f10 ? (
                <ul className="mt-1 space-y-1 text-[var(--color-text-secondary)]">
                  <li>
                    5 продажби → {int(f5.held)} проведени срещи → {int(f5.leads)} лийда ≈ {money(f5.eur)} реклама
                  </li>
                  <li>
                    10 продажби → {int(f10.held)} проведени срещи → {int(f10.leads)} лийда ≈ {money(f10.eur)} реклама
                  </li>
                </ul>
              ) : (
                <p className="mt-1 text-[var(--color-text-secondary)]">Още няма достатъчно сделки от реклами, за да се смята.</p>
              )}
              <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                Проценти: проведена среща на лийд {pct(pctOf(t.held, t.leads))} · клиент на проведена среща {pct(pctOf(t.won, t.held))} · € на лийд {money(per(t.eur, t.leads))}.
                Всеки процент нагоре от екипа (явяване, затваряне) сваля нужната реклама.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
