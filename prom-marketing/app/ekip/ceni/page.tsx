import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { orgOf } from "@/lib/team/types";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { PriceList } from "@/components/ekip/PriceList";
import { TbiBox } from "@/components/ekip/TbiBox";
import { OffersCatalog } from "@/components/ekip/OffersCatalog";
import { PROGRAM_PRICE_EUR, TEAM_PAY_LINKS } from "@/lib/stripe/team-links";

export const dynamic = "force-dynamic";

const eur = (n: number) => `${n.toLocaleString("bg-BG")} €`;

/**
 * „💼 Оферти и цени“ — правилата на продажбата, всички оферти в две графи
 * (обучение · Done for You), вноските TBI и линковете за плащане. Старата
 * подробна стълба остава отдолу за нашите хора (в нея има вътрешни бележки).
 */
export default async function CeniPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "ceni")) redirect(homeFor(actor.member));
  const nav = await ekipNav(actor);
  const ours = actor.kind === "owner" || orgOf(actor.member) === "promarketing";
  return (
    <div className="mx-auto max-w-6xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="ceni" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Оферти и цени</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Всичко, което продаваме — с цената, за кого е и как се плаща. Отляво обучение (правим го с човека), отдясно Done for You (правим всичко вместо него).
          </p>
        </div>

        <OffersCatalog />

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">💳 Плащане с карта · „Пари с AI“ {eur(PROGRAM_PRICE_EUR)}</h2>
            <ul className="mt-2 divide-y divide-white/5 text-sm">
              {TEAM_PAY_LINKS.map((l) => (
                <li key={l.key} className="flex flex-wrap items-baseline justify-between gap-2 py-1.5">
                  <span>
                    <b>{l.label}</b> · {eur(l.amountEur)}
                    {l.restEur > 0 ? <span className="text-[var(--color-text-tertiary)]"> · остават {eur(l.restEur)}</span> : null}
                  </span>
                  <a href={l.url} target="_blank" rel="noreferrer" className="break-all font-mono text-[11px] text-[var(--color-accent-cyan)] underline">
                    {l.url.replace("https://", "")}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
              За конкретен човек копирай линка от картата му („💳 Линк за плащане“) — там имейлът е попълнен и плащането се познава по картона.
            </p>
          </section>
          <section className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.03] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🏦 Вноски през TBI · калкулатор</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Смени сумата — вноските се смятат точно като калкулатора в портала на TBI.</p>
            <TbiBox open />
          </section>
        </div>

        {ours && (
          <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer text-sm font-semibold">📚 Стълбата подробно (вътрешно)</summary>
            <div className="mt-3">
              <PriceList />
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
