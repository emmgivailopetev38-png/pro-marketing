import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { DemoPortfolio } from "@/components/ekip/DemoPortfolio";
import { AKADEMIA_KURS, DEMO_SECTIONS, PORTFOLIO, PRAVILA_0411, type DemoLink } from "@/lib/team/demo-catalog";
import { OBJECTIONS, STAGES } from "@/components/admin/skript/data";

export const dynamic = "force-dynamic";

function LinkCard({ l }: { l: DemoLink }) {
  const external = l.href.startsWith("http") || l.href.startsWith("tel:");
  return (
    <a
      href={l.href}
      target={l.href.startsWith("tel:") ? undefined : "_blank"}
      rel={external ? "noreferrer" : undefined}
      className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-[var(--color-accent-cyan)]/60"
    >
      <p className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span>{l.title} ↗</span>
        {l.badge && <span className="shrink-0 rounded-full bg-[var(--color-accent-cyan)]/15 px-2 py-0.5 text-[10px] text-[var(--color-accent-cyan)]">{l.badge}</span>}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{l.text}</p>
      {l.when && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">👉 {l.when}</p>}
    </a>
  );
}

/** „Демо“ — всичко за показване на среща: системата, сайтът, гласът, видеата, Академията и шпаргалката. */
export default async function DemoPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "demo")) redirect(homeFor(actor.member));

  const nav = await ekipNav(actor);
  const bolka = STAGES.find((s) => s.num === "03");
  const zatvaryane = STAGES.find((s) => s.num === "09");
  const partnior = OBJECTIONS.find((o) => o.id === "partner");

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="demo" unread={nav.unread} />
      <main className="space-y-8 px-4 py-4">
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm">
          <p className="font-semibold">Показвай резултат, не екрани.</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Избери едно демо според болката му, не всичките. Сподели екрана и отваряй в нов таб. Всичко тук е или с измислени данни, или вече е публично.
          </p>
        </div>

        {DEMO_SECTIONS.map((s) => (
          <section key={s.id} className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">{s.title}</h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">{s.sub}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {s.links.map((l) => (
                <LinkCard key={l.href} l={l} />
              ))}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">🤖 Портфолио · AI видеа, които сме направили</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Пусни 2–3 от неговия бранш. Всяко видео носи AI етикета вътре в кадъра.
            </p>
          </div>
          <DemoPortfolio videos={PORTFOLIO} />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">🎓 Научи се сам: AI видеа за мрежите</h2>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Има два пътя. Или ние правим видеата всеки месец, или екипът му се научва сам и ги пуска в мрежите.
            </p>
          </div>
          <a
            href={AKADEMIA_KURS.href}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-[var(--color-accent-cyan)]/60"
          >
            <p className="text-sm font-semibold">Академията · курс „{AKADEMIA_KURS.title}“ ↗</p>
            <ol className="mt-2 grid list-decimal gap-x-6 gap-y-0.5 pl-5 text-xs text-[var(--color-text-secondary)] sm:grid-cols-2">
              {AKADEMIA_KURS.lessons.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">👉 Цените са в „💶 Цени“. Линкът води към стълбичката на Академията, от безплатното до менторската.</p>
          </a>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">🎯 Шпаргалка за разговора</h2>
          <ul className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
            {PRAVILA_0411.map((p) => (
              <li key={p}>✅ {p}</li>
            ))}
          </ul>
          {bolka && (
            <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3" open>
              <summary className="cursor-pointer text-sm font-semibold">Въпросите, които вадят болката · {bolka.goal}</summary>
              <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                {bolka.you.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">⚠️ {bolka.youThink}</p>
            </details>
          )}
          {partnior && (
            <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <summary className="cursor-pointer text-sm font-semibold">„{partnior.label}“</summary>
              <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                {partnior.steps.map((st) => (
                  <li key={st.line}>
                    <b>{st.label}:</b> {st.line}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {zatvaryane && (
            <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <summary className="cursor-pointer text-sm font-semibold">Затварянето · {zatvaryane.goal}</summary>
              <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                {zatvaryane.you.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">⚠️ {zatvaryane.youThink}</p>
            </details>
          )}
        </section>
      </main>
    </div>
  );
}
