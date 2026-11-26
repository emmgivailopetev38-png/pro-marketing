import Link from "next/link";
import { KpiCard } from "@/components/admin/KpiCard";
import { PERIODI, type Period, type StapkaFunia, type Tablo } from "@/lib/tablo/danni";
import { BEZ_REKLAMA, IZVAN_PERIODA, medianaCpm, tonChestota, tonCpm, tonCtr, tonRoas, type Nivo, type RedReklama, type Ton } from "@/lib/tablo/metriki";

/**
 * Таблото „реклами → записани → разговори → продажби“ — изгледът от CRM-а на Стефчо
 * (Overview + Ads), на нашите данни. Само за Ивайло (/admin).
 */

const NIVA: { kluch: Nivo; ime: string }[] = [
  { kluch: "campaign", ime: "Кампании" },
  { kluch: "adset", ime: "Групи" },
  { kluch: "ad", ime: "Реклами" },
];

const TON_TEXT: Record<Ton, string> = { dobre: "text-emerald-300", sredno: "text-amber-300", zle: "text-red-300" };
const TON_HEX: Record<Ton, string> = { dobre: "#34d399", sredno: "#fbbf24", zle: "#f87171" };
const tc = (t: Ton | null) => (t ? TON_TEXT[t] : "");

const fmt = (n: number, dig: number) => n.toLocaleString("bg-BG", { minimumFractionDigits: dig, maximumFractionDigits: dig });
const eur = (n: number | null, dig = 0) => (n == null ? "—" : `${fmt(n, dig)} €`);
const pct = (n: number | null, dig = 0) => (n == null ? "—" : `${fmt(n * 100, dig)} %`);
const num = (n: number | null) => (n == null ? "—" : fmt(n, 0));
const puti = (n: number | null) => (n == null ? "—" : `${fmt(n, 2)}×`);

function href(p: Period, nivo: Nivo) {
  const q = new URLSearchParams();
  if (p !== "vsichko") q.set("p", p);
  if (nivo !== "ad") q.set("nivo", nivo);
  const s = q.toString();
  return `/admin/tablo${s ? `?${s}` : ""}`;
}

/** „Уебинар 29.11 · K9 · Един час вечер (кола) · кукичка A“ → „Един час вечер (кола) · кукичка A“. */
function kratko(ime: string, kod: string | null) {
  const chasti = ime.split("·").map((x) => x.trim()).filter(Boolean);
  const ostava = chasti.filter((c, i) => !(i === 0 && /уебинар/i.test(c)) && c.toUpperCase() !== kod);
  return ostava.join(" · ") || ime;
}

export function TabloStefcho({ t, nivo }: { t: Tablo; nivo: Nivo }) {
  const m = t.marketing;
  const tabl = t.reklami[nivo];
  const mediana = medianaCpm(tabl.redove);
  const sinhronTon: Ton = t.sinhron.minutiPredi == null ? "zle" : t.sinhron.minutiPredi <= 90 ? "dobre" : t.sinhron.minutiPredi <= 6 * 60 ? "sredno" : "zle";
  const periodIme = PERIODI.find((p) => p.kluch === t.period)?.ime ?? "";

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Табло · само за теб</p>
          <h1 className="cc-title mt-2 font-display text-3xl font-bold md:text-4xl">Реклами → записани → продажби</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Уебинарът „{t.uebinar.ime}“ · {t.uebinar.dataLabel} Изгледът е от CRM-а на Стефчо: попълва се само (Meta всеки час, CRM-ът на живо).
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {PERIODI.map((p) => (
              <Link
                key={p.kluch}
                href={href(p.kluch, nivo)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: t.period === p.kluch ? "var(--color-accent-cyan)" : "var(--color-border-default)",
                  background: t.period === p.kluch ? "rgba(0,212,255,0.10)" : "transparent",
                  color: t.period === p.kluch ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
                }}
              >
                {p.ime}
              </Link>
            ))}
            <span className="cc-chip ml-auto text-[11px]">
              <span className="inline-block size-2 rounded-full" style={{ background: TON_HEX[sinhronTon] }} />
              Meta: {t.sinhron.posledno ? `обновено преди ${t.sinhron.minutiPredi} мин` : "още няма данни"}
            </span>
          </div>
          {!t.sinhron.imaNoviteMetriki && (
            <p className="mt-3 text-xs text-amber-300">
              Обхватът, кликовете към страницата и регистрациите по Meta идват със следващия синхрон (на всеки час). Дотогава CTR и CPC са по всички кликове.
            </p>
          )}
        </header>

        <Sekcia zaglavie="Маркетинг" pod={`реклама → записани → разговори · ${periodIme.toLowerCase()}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Разход за реклама" value={eur(m.razhod)} hint={`${num(tabl.obshto.pokazvaniya)} показвания`} color="#e5c069" />
            <KpiCard
              label="Записани"
              value={num(m.zapisani)}
              hint={m.metaZapisani != null ? `Meta отчита ${num(m.metaZapisani)}` : "от CRM-а"}
              color="#00d4ff"
            />
            <KpiCard
              label="Цена на записан"
              value={eur(m.cenaZapisan, 2)}
              hint="целта на Йончев е 1–5 €"
              color={m.tonCenaZapisan ? TON_HEX[m.tonCenaZapisan] : "#9b8ec9"}
            />
            <KpiCard label="Цена на разговор" value={eur(m.cenaChas)} hint={`${num(m.chasove)} записали разговор`} color="#9b8ec9" />
            <KpiCard label="Цена на клиент" value={eur(m.cac)} hint={`${num(m.kupili)} купили`} color="#d9a74a" />
            <KpiCard label="ROAS" value={puti(m.roas)} hint={`${eur(m.prihod)} приход · целта е 3×`} color={m.tonRoas ? TON_HEX[m.tonRoas] : "#64748b"} />
          </div>
        </Sekcia>

        <Sekcia zaglavie="Фунията на уебинара" pod="от рекламата до продажбата · целите са на Йончев">
          <FuniaLenta stapki={t.funia} />
          {t.sobstveniPoseshteniya != null && (
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
              Нашето броене на страницата (от A/B теста, 26.11 от 11:55): {num(t.sobstveniPoseshteniya)} посетители.
            </p>
          )}
        </Sekcia>

        <Sekcia zaglavie="Пари" pod="от записаните за този уебинар, след началото му">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard label="Продадено" value={eur(t.pari.prodadeno)} hint="приети оферти" color="#d9a74a" />
            <KpiCard label="Платено" value={eur(t.pari.plateno)} hint="вече е в банката" color="#34d399" />
            <KpiCard label="Купили" value={num(t.pari.kupili)} hint="клиенти от уебинара" color="#9b8ec9" />
          </div>
        </Sekcia>

        <section className="cc-panel p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold">Рекламите</h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">записаните се връзват по кода на рекламата (K9, D7…) · {periodIme.toLowerCase()}</span>
            <div className="ml-auto flex gap-1">
              {NIVA.map((n) => (
                <Link
                  key={n.kluch}
                  href={href(t.period, n.kluch)}
                  className="rounded-md border px-2.5 py-1 text-xs"
                  style={{
                    borderColor: nivo === n.kluch ? "var(--cc-gold, #d9a74a)" : "var(--color-border-default)",
                    color: nivo === n.kluch ? "var(--cc-gold, #d9a74a)" : "var(--color-text-secondary)",
                  }}
                >
                  {n.ime}
                </Link>
              ))}
            </div>
          </div>
          {tabl.redove.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-text-tertiary)]">Няма разход и записани за този период.</p>
          ) : (
            <TablicaReklami redove={tabl.redove} obshto={tabl.obshto} nivo={nivo} mediana={mediana} />
          )}
          <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
            <span className="text-red-300">червено</span> CTR под 1 % или CPM над 1,5 × медианата · <span className="text-amber-300">жълто</span> честота над 2,5 ·{" "}
            <span className="text-emerald-300">зелено</span> CTR от 2 % или CPM под 0,67 × медианата. Обхватът е сбор по дни (Meta не го събира точно за период).
          </p>
        </section>

        <section className="cc-panel p-5">
          <h2 className="mb-3 font-display text-base font-semibold">Разход и записани по дни</h2>
          <PoDni dni={t.dni} />
        </section>

        <section className="cc-panel p-5">
          <h2 className="mb-3 font-display text-base font-semibold">Кой купи и от коя реклама ({t.kupuvachi.length})</h2>
          {t.kupuvachi.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Още няма купили от уебинара. Появяват се тук сами, щом офертата им е приета.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Кога</th>
                    <th className="text-right">Сума</th>
                    <th>Реклама</th>
                  </tr>
                </thead>
                <tbody>
                  {t.kupuvachi.map((k, i) => (
                    <tr key={i}>
                      <td>{k.ime}</td>
                      <td className="cc-num text-[var(--color-text-secondary)]">{k.koga ? new Date(k.koga).toLocaleDateString("bg-BG", { timeZone: "Europe/Sofia" }) : "—"}</td>
                      <td className="cc-num text-right">{eur(k.suma)}</td>
                      <td className="text-[var(--color-text-secondary)]">{k.kod ? `${k.kod} · ${k.reklama ? kratko(k.reklama, k.kod) : ""}` : "без реклама"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          Как се пълни: синхронът с Meta на сървъра тегли рекламите на всеки час (разход, показвания, обхват, кликове към страницата, посещения, регистрации) · записаните,
          разговорите, офертите и плащанията са от CRM-а на живо · кой е дошъл и до кога е стоял — от Notifier след уебинара. Кампаниите на уебинара се познават по датата
          „{t.uebinar.etiket}“ в името.
        </p>
      </div>
    </div>
  );
}

function Sekcia({ zaglavie, pod, children }: { zaglavie: string; pod: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h2 className="font-display text-base font-semibold">{zaglavie}</h2>
        <span className="text-xs text-[var(--color-text-tertiary)]">{pod}</span>
      </div>
      {children}
    </section>
  );
}

/** Фунията като редица от числа с процента между стъпките (FunnelStrip при Стефчо). */
function FuniaLenta({ stapki }: { stapki: StapkaFunia[] }) {
  return (
    <div className="cc-panel flex flex-wrap items-stretch gap-y-3 p-4">
      {stapki.map((s, i) => (
        <div key={s.kluch} className="flex items-stretch">
          {i > 0 && (
            <div className="flex w-16 flex-col items-center justify-center text-center">
              <span className={`font-mono text-xs font-semibold ${s.ton ? TON_TEXT[s.ton] : "text-[var(--color-text-secondary)]"}`}>{pct(s.p)}</span>
              <span className="text-[var(--color-text-tertiary)]">→</span>
              {s.cel && <span className="text-[9px] text-[var(--color-text-tertiary)]">цел {s.cel}</span>}
            </div>
          )}
          <div className="min-w-[7.5rem] rounded-lg border border-[var(--color-border-default)] bg-white/[0.02] px-3 py-2.5">
            <div className="text-[11px] text-[var(--color-text-tertiary)]">{s.ime}</div>
            <div className="cc-num text-2xl font-semibold">{num(s.stoinost)}</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">{s.belezhka ?? s.ot}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TablicaReklami({ redove, obshto, nivo, mediana }: { redove: RedReklama[]; obshto: RedReklama; nivo: Nivo; mediana: number | null }) {
  const red = (r: RedReklama, obsht = false) => (
    <tr key={obsht ? "__obshto" : r.kluch} className={obsht ? "font-semibold" : ""}>
      <td className="max-w-[22rem]">
        <div className="flex items-center gap-2">
          {!obsht && r.kod && <span className="rounded bg-[rgba(217,167,74,0.15)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--cc-gold,#d9a74a)]">{r.kod}</span>}
          <span className="truncate" title={r.ime}>
            {obsht ? "Общо" : nivo === "ad" && r.kluch !== BEZ_REKLAMA && r.kluch !== IZVAN_PERIODA ? kratko(r.ime, r.kod) : r.ime}
          </span>
        </div>
        {!obsht && r.pod && <div className="truncate text-[11px] text-[var(--color-text-tertiary)]">{r.pod}</div>}
      </td>
      <td className="cc-num text-right">{eur(r.razhod, 2)}</td>
      <td className="cc-num text-right">{num(r.pokazvaniya)}</td>
      <td className="cc-num text-right">{num(r.obhvat)}</td>
      <td className={`cc-num text-right ${tc(tonChestota(r.chestota))}`}>{r.chestota == null ? "—" : fmt(r.chestota, 2)}</td>
      <td className={`cc-num text-right ${obsht ? "" : tc(tonCpm(r.cpm, mediana))}`}>{eur(r.cpm, 2)}</td>
      <td className={`cc-num text-right ${tc(tonCtr(r.ctr))}`} title={r.vsichkiKlikove ? "по всички кликове" : "по кликовете към страницата"}>
        {pct(r.ctr, 2)}
        {r.vsichkiKlikove ? "*" : ""}
      </td>
      <td className="cc-num text-right">{eur(r.cpc, 2)}</td>
      <td className="cc-num text-right">{num(r.klikove)}</td>
      <td className="cc-num text-right">{num(r.poseshteniya)}</td>
      <td className="cc-num text-right">{num(r.metaZapisani)}</td>
      <td className="cc-num text-right font-semibold">{num(r.zapisani)}</td>
      <td className={`cc-num text-right ${r.cenaZapisan == null ? "" : r.cenaZapisan <= 5 ? "text-emerald-300" : r.cenaZapisan > 8 ? "text-red-300" : "text-amber-300"}`}>{eur(r.cenaZapisan, 2)}</td>
      <td className="cc-num text-right">{num(r.chasove)}</td>
      <td className="cc-num text-right">{eur(r.cenaChas)}</td>
      <td className="cc-num text-right">{num(r.kupili)}</td>
      <td className="cc-num text-right">{eur(r.prihod)}</td>
      <td className={`cc-num text-right ${tc(tonRoas(r.roas))}`}>{puti(r.roas)}</td>
    </tr>
  );
  const kolonki = ["Разход", "Показв.", "Обхват", "Честота", "CPM", "CTR (линк)", "CPC (линк)", "Кликове", "Посещения", "Рег. Meta", "Записани", "€ / записан", "Разговори", "€ / разговор", "Купили", "Приход", "ROAS"];
  return (
    <div className="overflow-x-auto">
      <table className="cc-table">
        <thead>
          <tr>
            <th>{NIVA.find((n) => n.kluch === nivo)?.ime}</th>
            {kolonki.map((k) => (
              <th key={k} className="whitespace-nowrap text-right">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {redove.map((r) => red(r))}
          {red(obshto, true)}
        </tbody>
      </table>
    </div>
  );
}

function PoDni({ dni }: { dni: Tablo["dni"] }) {
  if (!dni.length) return <p className="text-sm text-[var(--color-text-tertiary)]">Няма разход за този период.</p>;
  const maxR = Math.max(...dni.map((d) => d.razhod), 1);
  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {dni.map((d) => (
        <div key={d.den} className="flex min-w-[4.5rem] flex-col items-center gap-1">
          <span className="cc-num text-[11px]">{eur(d.razhod)}</span>
          <div className="flex h-32 w-10 items-end rounded bg-white/[0.03]">
            <div className="w-full rounded" style={{ height: `${Math.max(3, (d.razhod / maxR) * 100)}%`, background: "linear-gradient(180deg, #e5c069, #b8862f)" }} />
          </div>
          <span className="text-[11px] text-[var(--color-accent-cyan)]">{d.zapisani} зап.</span>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">{d.den.slice(8, 10)}.{d.den.slice(5, 7)}</span>
        </div>
      ))}
    </div>
  );
}
