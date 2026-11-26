import Link from "next/link";
import { LeadCard } from "@/components/ekip/LeadCard";
import { RED_NA_ZVANENE, SEGMENTI, type SegmentKey } from "@/lib/uebinar/prisastvie-rules";
import type { UebinarOpashka } from "@/lib/uebinar/prisastvie";

const TON: Record<SegmentKey, string> = {
  zapisal: "border-emerald-400/30 bg-emerald-400/[0.05] text-emerald-200",
  oferta: "border-rose-400/35 bg-rose-400/[0.06] text-rose-200",
  rano: "border-amber-400/30 bg-amber-400/[0.05] text-amber-200",
  ne_doshal: "border-sky-400/30 bg-sky-400/[0.05] text-sky-200",
};

/**
 * „🎓 Уебинар“ в /ekip — опашките след уебинара по реда на Йончев. Стоят и
 * преди него (празни, с обяснение), за да знае сетърът какво идва.
 */
export function UebinarOpashki({ data, setterName }: { data: UebinarOpashka | null; setterName: string }) {
  if (!data) {
    return (
      <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-center text-sm text-rose-100">
        ⚠️ Опашките на уебинара не се заредиха. Опресни страницата след минута.
      </p>
    );
  }
  const sled = data.sastoyanie === "sled";
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-violet-400/30 bg-violet-500/[0.06] p-4 text-sm">
        <p className="font-semibold text-[var(--color-text-primary)]">
          🎓 Уебинарът · {data.dateLabel} · записани при теб: <b>{data.zapisani}</b>
        </p>
        {data.sastoyanie === "predi" && (
          <p className="mt-1 text-[var(--color-text-secondary)]">
            Преди уебинара не звъним. След края групите отдолу се пълнят сами (от Zoom, през Notifier) и звъниш по реда им: първо стоялите до офертата,
            после излезлите рано, накрая неявилите се. Разговорите с клоузъра — в следващите 2–3 дни.
          </p>
        )}
        {data.sastoyanie === "na_zhivo" && (
          <p className="mt-1 text-[var(--color-text-secondary)]">Уебинарът е в момента. Групите излизат тук сами след края.</p>
        )}
        {sled && !data.imaDanni && (
          <p className="mt-1 text-[var(--color-text-secondary)]">Уебинарът свърши. Данните кой е дошъл идват сами до няколко минути — опресни страницата.</p>
        )}
        {sled && data.ofertaPriblizitelno && (
          <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            ⚠️ Никой не отбеляза кога почна офертата — сложен е приблизителният час (90-ата минута). Групи 1 и 2 може да са разменени за някого.
          </p>
        )}
        {sled && data.zapisaliChas > 0 && (
          <p className="mt-2 text-[var(--color-text-secondary)]">
            ✅ <b className="text-emerald-200">{data.zapisaliChas}</b> си записаха час сами — разговорът е при клоузъра, ти само потвърждаваш от{" "}
            <Link href="/ekip?vid=sreshti" className="underline">
              💜 Срещите
            </Link>
            .
          </p>
        )}
      </section>

      {RED_NA_ZVANENE.map((seg) => {
        const info = SEGMENTI[seg];
        const g = data.grupi.find((x) => x.seg === seg);
        return (
          <section key={seg} className="space-y-3">
            <div className={`rounded-2xl border p-3 ${TON[seg]}`}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                {info.ikona} {info.ime}
                {sled && g ? ` · ${g.chakat}` : ""}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                <b>Кога:</b> {info.koga}. {info.cel}
              </p>
              {sled && g && g.progres.obshto > 0 && (
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  В групата: {g.progres.obshto} · набрани {g.progres.obadeni} · вдигнали {g.progres.vdignali} · записали час {g.progres.zapisali}
                </p>
              )}
            </div>
            {!sled ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-[var(--color-text-tertiary)]">
                Пълни се сама след края на уебинара.
              </p>
            ) : !g || g.progres.obshto === 0 ? (
              <p className="rounded-2xl border border-white/10 p-4 text-center text-xs text-[var(--color-text-tertiary)]">Никой в тази група.</p>
            ) : g.chakat === 0 ? (
              <p className="rounded-2xl border border-emerald-400/20 p-4 text-center text-xs text-emerald-200">✅ Всички от групата са набрани.</p>
            ) : (
              <>
                {g.leads.map((l) => (
                  <LeadCard key={`u-${seg}-${l.id}`} lead={l} mode="stari" setterName={setterName} />
                ))}
                {g.chakat > g.leads.length && (
                  <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                    + още {g.chakat - g.leads.length} — излизат тук, щом звъннеш на горните.
                  </p>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
