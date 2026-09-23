import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { PriceList } from "@/components/ekip/PriceList";

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
      <main className="px-4 py-4">
        <PriceList />
      </main>
    </div>
  );
}
