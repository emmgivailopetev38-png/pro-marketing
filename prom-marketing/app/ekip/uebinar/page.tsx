import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { STRATEGIA, UEBINAR } from "@/lib/team/uebinar-strategia";
import { SKRIPTOVE_V3_MD } from "@/lib/team/dokumenti/skriptove-v3";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { VideoFeedback } from "@/components/ekip/VideoFeedback";

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
  const nav = await ekipNav(actor);
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
