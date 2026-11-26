import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { STRATEGIA, UEBINAR } from "@/lib/team/uebinar-strategia";
import { SKRIPTOVE_V3_MD } from "@/lib/team/dokumenti/skriptove-v3";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { VideoFeedback } from "@/components/ekip/VideoFeedback";
import { createServiceClient } from "@/lib/supabase/service";
import { AB_DYAL_B, AB_TEST, ZAGLAVIE_B } from "@/lib/uebinar/ab";

/**
 * Колко са записани за уебинара — общо и днес (по софийско време). Брои
 * записванията (contact_activities), не новите картони: и стар контакт,
 * който се запише, е записан.
 */
async function zapisaniBroi(): Promise<{ total: number; dnes: number } | null> {
  try {
    const sb = createServiceClient();
    const sofia = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
    const ot = new Date(`${sofia}T00:00:00+02:00`).getTime();
    const { data, error } = await sb
      .from("contact_activities")
      .select("contact_id, occurred_at")
      .eq("activity_type", "uebinar_registration")
      .limit(5000);
    if (error) return null;
    const parvo = new Map<string, number>();
    for (const r of (data ?? []) as Array<{ contact_id: string; occurred_at: string }>) {
      const t = new Date(r.occurred_at).getTime();
      if (!parvo.has(r.contact_id) || t < parvo.get(r.contact_id)!) parvo.set(r.contact_id, t);
    }
    return { total: parvo.size, dnes: [...parvo.values()].filter((t) => t >= ot).length };
  } catch {
    return null;
  }
}

type AbRed = { vizita: number; forma: number; zapisani: number };

/** A/B тестът на лендинга (lib/uebinar/ab.ts): посетители, отворили формата и записани по версия. */
async function abRezultat(): Promise<{ A: AbRed; B: AbRed } | null> {
  try {
    const sb = createServiceClient();
    const broi = (varianta: "A" | "B", sabitie: "vizita" | "forma") =>
      sb.from("uebinar_ab").select("id", { count: "exact", head: true }).eq("test", AB_TEST).eq("varianta", varianta).eq("sabitie", sabitie);
    const zap = (varianta: "A" | "B") =>
      sb.from("contact_activities").select("id", { count: "exact", head: true }).eq("activity_type", "uebinar_registration").eq("metadata->>varianta", varianta);
    const [av, af, az, bv, bf, bz] = await Promise.all([broi("A", "vizita"), broi("A", "forma"), zap("A"), broi("B", "vizita"), broi("B", "forma"), zap("B")]);
    if ([av, af, az, bv, bf, bz].some((r) => r.error)) return null;
    return {
      A: { vizita: av.count ?? 0, forma: af.count ?? 0, zapisani: az.count ?? 0 },
      B: { vizita: bv.count ?? 0, forma: bf.count ?? 0, zapisani: bz.count ?? 0 },
    };
  } catch {
    return null;
  }
}

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

export const dynamic = "force-dynamic";

/**
 * „🎥 Уебинарът“ — стратегията, офертата, скриптовете за рекламите и линкът към
 * лендинга, на едно място. Мениджърите (и целият екип) могат да пратят съвет
 * направо на Ивайло.
 */
export default async function UebinarPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "uebinar")) redirect(homeFor(actor.member));
  const [nav, broi, ab] = await Promise.all([ekipNav(actor), zapisaniBroi(), abRezultat()]);
  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
  return (
    <div className="mx-auto max-w-4xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="uebinar" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <section className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/[0.12] to-transparent p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-200">Уебинарът на живо</p>
          <h1 className="mt-1 font-display text-2xl font-bold">„{UEBINAR.ime}“</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {UEBINAR.koga} · {UEBINAR.platforma}
          </p>
          <p className="mt-2 text-sm">
            <b>Офертата:</b> {UEBINAR.oferta}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={UEBINAR.lending} target="_blank" rel="noreferrer" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-white/40">
              🌐 Лендинг страницата
            </a>
            <Link href="/ekip/dok/oferta-3900" target="_blank" className="rounded-lg border border-violet-400/50 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:border-violet-300">
              📄 Цялата оферта 3 900 €
            </Link>
            <Link href="/ekip/ceni" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-white/40">
              💶 Всички оферти и цени
            </Link>
          </div>
        </section>

        {/* Записаните — вижда ги целият екип; звъни им сетърът (опашката), отговорът е в „Всички лийдове“ */}
        <section className="rounded-2xl border border-violet-400/30 bg-violet-500/[0.06] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🎓 Записани за уебинара</h2>
            {broi && (
              <p className="text-sm">
                <b className="text-lg">{broi.total}</b> общо · <b>{broi.dnes}</b> днес
              </p>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всеки записан влиза веднага в системата със значка „🎓 Уебинар“: при сетъра в опашката за звънене (с готовото първо изречение), а целият
            екип го вижда в „Всички лийдове“. Обаждането преди уебинара е за явяването: потвърди, че ще влезе, кажи, че линкът идва по Viber, SMS и имейл, и
            попитай с какво се занимава.
          </p>
          <Link href="/ekip/liidove?ot=uebinar" className="mt-3 inline-block rounded-lg border border-violet-400/50 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:border-violet-300">
            Виж всички записани →
          </Link>
        </section>

        {/* A/B тестът на лендинга (Стефчо, 26.11.2026) — един и същ адрес, 60/40 */}
        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧪 A/B тест на лендинга · от 26.11</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Същият адрес и същите реклами. {Math.round((1 - AB_DYAL_B) * 100)}% виждат А (сегашната страница), {Math.round(AB_DYAL_B * 100)}% виждат Б: без
            подзаглавие, заглавие „{ZAGLAVIE_B.before}
            {ZAGLAVIE_B.mark}
            {ZAGLAVIE_B.after}“. Всеки вижда винаги една и съща версия.
          </p>
          {ab ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="py-1 pr-3">Версия</th>
                    <th className="py-1 pr-3">Посетители</th>
                    <th className="py-1 pr-3">Отвориха формата</th>
                    <th className="py-1 pr-3">Записани</th>
                    <th className="py-1">Opt-in</th>
                  </tr>
                </thead>
                <tbody>
                  {(["A", "B"] as const).map((v) => (
                    <tr key={v} className="border-t border-white/10">
                      <td className="py-1.5 pr-3 font-semibold">{v === "A" ? "А · сегашната" : "Б · „3-те Скрити Тайни“"}</td>
                      <td className="py-1.5 pr-3">{ab[v].vizita}</td>
                      <td className="py-1.5 pr-3">
                        {ab[v].forma} <span className="text-xs text-[var(--color-text-secondary)]">({pct(ab[v].forma, ab[v].vizita)})</span>
                      </td>
                      <td className="py-1.5 pr-3">{ab[v].zapisani}</td>
                      <td className="py-1.5 font-semibold">{pct(ab[v].zapisani, ab[v].vizita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Броят се от 26.11, когато тестът тръгна. Решение — когато всяка версия има поне ~100 посетители.</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Още няма данни.</p>
          )}
        </section>

        {STRATEGIA.map((s) => (
          <section key={s.title} className={card}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">{s.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}

        <details className={card}>
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.15em]">🎬 Скриптовете за рекламите · v3 (24.11)</summary>
          <pre className="mt-3 max-h-[70vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--color-text-secondary)]">{SKRIPTOVE_V3_MD}</pre>
        </details>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">💡 Съвет за уебинара, офертата или фунията</h2>
          <p className="mt-1 mb-3 text-xs text-[var(--color-text-secondary)]">
            Прегледайте и кажете какво бихте направили по-добре — рекламите, лендинга, офертата, скрипта, напомнянията. Отива направо при Ивайло.
          </p>
          <VideoFeedback topic="uebinar" videos={["Рекламите", "Лендинг страницата", "Офертата 3 900 €", "Скриптовете", "Напомнянията", "Самият уебинар"]} />
        </section>
      </main>
    </div>
  );
}
