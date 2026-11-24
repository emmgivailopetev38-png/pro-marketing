import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { AsistentChat } from "@/components/ekip/AsistentChat";

export const dynamic = "force-dynamic";

/** „🤖 AI асистент“ — въпроси за разговора, офертите, системата и лийдовете + корекции към Ивайло. */
export default async function AsistentPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "asistent")) redirect(homeFor(actor.member));
  const nav = await ekipNav(actor);
  return (
    <div className="mx-auto max-w-6xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="asistent" unread={nav.unread} />
      <main className="space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold">AI асистент</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Знае офертите и цените, вноските TBI, уебинара, как работи системата и твоите числа. Пише реплики, отговори на възражения и съобщения до лийдове.
          </p>
        </div>
        <AsistentChat page="/ekip/asistent" />
      </main>
    </div>
  );
}
