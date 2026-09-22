import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { canSee, homeFor } from "@/lib/team/roles";
import { materialsFor } from "@/lib/team/materials";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { MaterialsList } from "@/components/ekip/MaterialsList";

export const dynamic = "force-dynamic";

/** „Материали“ — обучението по роля, като PDF за телефона и HTML за екрана. */
export default async function MaterialiPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "materiali")) redirect(homeFor(actor.member));

  const nav = await ekipNav(actor);
  const role = actor.kind === "owner" ? "owner" : actor.member.role;
  const member = actor.kind === "owner" ? { role: "owner" as const, permissions: null } : actor.member;
  const { mine, other } = materialsFor(role, (m) => canSee(member, m));

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="materiali" unread={nav.unread} />
      <main className="space-y-6 px-4 py-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Прочети първо своите. Всичко е написано стъпка по стъпка, с точните реплики. PDF-ът се отваря и на телефон; HTML-ът е същото, за екрана.
        </p>
        <MaterialsList title="📚 За теб" items={mine} />
        {other.length > 0 && <MaterialsList title="📖 За останалите роли — ако ти е любопитно как работят другите" items={other} muted />}
      </main>
    </div>
  );
}
