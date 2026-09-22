import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { loadNapredak } from "@/lib/team/napredak";
import { parsePeriod } from "@/lib/team/napredak-rules";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { NapredakBoard } from "@/components/ekip/NapredakBoard";

export const dynamic = "force-dynamic";

/**
 * „Напредък · моите числа“ — всеки вижда собствената си работа: обаждания,
 * срещи, скорост до лийда, задачи, и как стои спрямо предходния период и
 * спрямо другите. Собственикът може да отвори чужди числа с ?who=<slug>.
 */
export default async function NapredakPage({ searchParams }: { searchParams: Promise<{ d?: string; who?: string }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "napredak")) redirect(homeFor(actor.member));

  const sp = await searchParams;
  const days = parsePeriod(sp.d);
  const isOwner = actor.kind === "owner";
  const who = isOwner && sp.who ? sp.who : null;

  const [nav, data] = await Promise.all([
    ekipNav(actor),
    loadNapredak({
      days,
      actorName: actor.name,
      actorKind: actor.kind,
      memberId: actor.member?.id ?? null,
      memberRole: actor.member?.role ?? null,
      who,
    }),
  ]);
  const shownWho = data.me.person.kind === "owner" ? null : isOwner ? data.me.person.key : null;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={isOwner} nav={nav.items} section="napredak" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <NapredakBoard data={data} tone="ekip" basePath="/ekip/napredak" who={shownWho} switcher={isOwner} tasksHref="/ekip/zadachi" />
      </main>
    </div>
  );
}
