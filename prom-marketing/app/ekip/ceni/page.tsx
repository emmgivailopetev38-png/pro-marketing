import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { PriceList } from "@/components/ekip/PriceList";
import { TbiBox } from "@/components/ekip/TbiBox";

export const dynamic = "force-dynamic";

/** „Цени“ — актуалният ценоразпис, само за хората с този модул. */
export default async function CeniPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "ceni")) redirect(homeFor(actor.member));
  const nav = await ekipNav(actor);
  return (
    <div className="mx-auto max-w-3xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="ceni" unread={nav.unread} />
      <main className="space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.03] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🏦 Вноски през TBI · калкулатор</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Смени сумата — вноските се смятат точно като калкулатора в портала на TBI.</p>
          <TbiBox open />
        </section>
        <PriceList />
      </main>
    </div>
  );
}
