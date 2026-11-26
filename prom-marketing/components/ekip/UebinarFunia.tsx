import Link from "next/link";
import { CELI, SEGMENTI, SEGMENT_KEYS, krivaPoStapki, type Ocenka } from "@/lib/uebinar/prisastvie-rules";
import type { UebinarFunia as Funia } from "@/lib/uebinar/prisastvie";

const OCENKA: Record<Ocenka, { ikona: string; dumi: string; cls: string }> = {
  dobre: { ikona: "✅", dumi: "по целта", cls: "text-emerald-300" },
  sredno: { ikona: "🟡", dumi: "под целта", cls: "text-amber-300" },
  zle: { ikona: "🔴", dumi: "далеч под целта", cls: "text-rose-300" },
};

const ZVANENE: Record<string, string> = {
  chaka: "чака обаждане",
  ne_vdigna: "не вдигна",
  govoril: "говорихме",
  chas: "записа час",
};

const chas = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" }) : "—";

/**
 * Фунията на уебинара по стъпките на Йончев — записани → дошли → до офертата →
 * час → явили се → купили, всяка с целта си, плюс кой кога е стоял. `kratka` е
 * за клоузърите и мениджърите (без таблицата с хората).
 */
export function UebinarFunia({ f, kratka = false }: { f: Funia; kratka?: boolean }) {
  const st = f.st;
  const sled = f.sastoyanie === "sled";
  const stapka = 5;
  const kriva = st?.kriva?.length ? krivaPoStapki(st.kriva, stapka) : [];
  const maxK = Math.max(1, ...kriva);
  const ofertaMin =
    st?.oferta_at && st.kriva_start_at ? Math.round((Date.parse(st.oferta_at) - Date.parse(st.kriva_start_at)) / 60_000) : null;
  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📊 Уебинарът по стъпки · {f.dateLabel}</h2>
        {kratka && (
          <Link href="/ekip/uebinar" className="text-xs underline text-[var(--color-text-secondary)]">
            цялата статистика →
          </Link>
        )}
      </div>

      {f.sastoyanie === "predi" && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Записани досега: <b className="text-[var(--color-text-primary)]">{f.zapisani}</b>. Числата отдолу се пълнят сами от Zoom (през Notifier) — по време на
          уебинара и след него. Целите са по системата на Йоан Йончев.
        </p>
      )}
      {f.sastoyanie === "na_zhivo" && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          🔴 На живо · пик досега <b className="text-[var(--color-text-primary)]">{st?.pik ?? 0}</b> души
          {st?.obnoveno_at ? ` · обновено ${chas(st.obnoveno_at)}` : ""}
        </p>
      )}

      {/* Стъпките: числото, процентът, целта и оценката (иконa + дума, не само цвят) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Записани</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{f.zapisani}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">от рекламите</p>
        </div>
        {f.stapki.map((s) => {
          const o = s.ocenka ? OCENKA[s.ocenka] : null;
          const tyasno = f.tyasno === s.key;
          return (
            <div key={s.key} className={`rounded-xl border bg-black/20 p-3 ${tyasno ? "border-rose-400/60" : "border-white/10"}`}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{s.ime}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {s.a}
                <span className="ml-1 text-sm font-semibold text-[var(--color-text-secondary)]">{s.p === null ? "" : `· ${s.p}%`}</span>
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {s.ot} · цел {s.cel}%
              </p>
              {o && sled && (
                <p className={`mt-1 text-[11px] font-semibold ${o.cls}`}>
                  {o.ikona} {o.dumi}
                  {tyasno ? " · тясното място" : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {sled && f.tyasno && (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/[0.07] px-3 py-2 text-xs text-rose-100">
          🎯 Следващият уебинар: една промяна — в „{CELI.find((c) => c.key === f.tyasno)?.ime}“. Останалото не се пипа, щом е по целта.
        </p>
      )}
      {sled && st?.oferta_izvor === "priblizitelno" && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          ⚠️ Часът на офертата ({chas(st.oferta_at)}) е приблизителен — никой не го отбеляза. Поправи го отдолу, за да са верни групите.
        </p>
      )}

      {/* Кой кога е стоял: хората в стаята през 5 минути, с чертата на офертата */}
      {kriva.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-[var(--color-text-secondary)]">
            Хора в стаята през {stapka} мин · пик <b className="text-[var(--color-text-primary)]">{st?.pik}</b> в {chas(st?.pik_at ?? null)} · средно{" "}
            {st?.sredno_minuti} мин на човек
            {st?.oferta_at ? ` · офертата в ${chas(st.oferta_at)}` : ""}
          </p>
          <div className="relative flex h-28 items-end gap-[2px] rounded-lg border border-white/10 bg-black/20 px-2 pt-2" role="img" aria-label="Хора в стаята по минути">
            {kriva.map((n, i) => {
              const ot = i * stapka;
              const oferta = ofertaMin !== null && ofertaMin >= ot && ofertaMin < ot + stapka;
              const t = st?.kriva_start_at ? chas(new Date(Date.parse(st.kriva_start_at) + ot * 60_000).toISOString()) : `${ot}`;
              return (
                <div
                  key={i}
                  title={`${t} · ${n} души${oferta ? " · офертата" : ""}`}
                  className="group relative flex-1 cursor-default"
                  style={{ height: "100%" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-[4px] group-hover:opacity-80"
                    style={{ height: `${Math.max(2, (n / maxK) * 100)}%`, background: oferta ? "#fb7185" : "var(--color-accent-cyan)" }}
                  />
                </div>
              );
            })}
          </div>
          {st?.nai_golyam_spad && st.nai_golyam_spad.lost > 0 && st.kriva_start_at && (
            <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
              Най-много излязоха между {chas(new Date(Date.parse(st.kriva_start_at) + st.nai_golyam_spad.fromMinute * 60_000).toISOString())} и{" "}
              {chas(new Date(Date.parse(st.kriva_start_at) + st.nai_golyam_spad.toMinute * 60_000).toISOString())} (−{st.nai_golyam_spad.lost}) — оттам се
              гледа записът първо.
            </p>
          )}
        </div>
      )}

      {/* Групите за звънене и докъде е стигнало */}
      {sled && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <tr>
                <th className="py-1 pr-3">Група</th>
                <th className="py-1 pr-3">Хора</th>
                <th className="py-1 pr-3">Набрани</th>
                <th className="py-1 pr-3">Вдигнали</th>
                <th className="py-1">Записали час</th>
              </tr>
            </thead>
            <tbody>
              {SEGMENT_KEYS.map((k) => {
                const p = f.grupi[k];
                return (
                  <tr key={k} className="border-t border-white/10">
                    <td className="py-1.5 pr-3">
                      {SEGMENTI[k].ikona} {SEGMENTI[k].ime}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">{p.obshto}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{k === "zapisal" ? "—" : p.obadeni}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{k === "zapisal" ? "—" : p.vdignali}</td>
                    <td className="py-1.5 tabular-nums">{p.zapisali}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!kratka && f.hora.length > 0 && f.sastoyanie !== "predi" && (
        <details>
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            👥 Кой кога е стоял · {f.hora.length}
          </summary>
          <div className="mt-2 max-h-[60vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-bg-void)] text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <tr>
                  <th className="py-1 pr-2">Име</th>
                  <th className="py-1 pr-2">Влезе</th>
                  <th className="py-1 pr-2">Минути</th>
                  <th className="py-1 pr-2">Офертата</th>
                  <th className="py-1 pr-2">Група</th>
                  <th className="py-1">Звънене</th>
                </tr>
              </thead>
              <tbody>
                {f.hora.map((h) => (
                  <tr key={h.contact_id} className="border-t border-white/5">
                    <td className="py-1 pr-2">{h.ime ?? "—"}</td>
                    <td className="py-1 pr-2 tabular-nums">{chas(h.vlyazal_at)}</td>
                    <td className="py-1 pr-2 tabular-nums">{h.vlyazal_at ? h.minuti : "—"}</td>
                    <td className="py-1 pr-2">{h.vlyazal_at ? (h.chul_ofertata ? "✅ чу я" : "— не") : ""}</td>
                    <td className="py-1 pr-2">
                      {SEGMENTI[h.segment].ikona} {SEGMENTI[h.segment].ime.replace(/^\d · /, "")}
                      {h.toplina_nivo === "hot" ? " · 🔥" : ""}
                    </td>
                    <td className="py-1">{h.zvanene ? ZVANENE[h.zvanene] : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
