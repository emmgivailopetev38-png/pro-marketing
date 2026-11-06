import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { createServiceClient } from "@/lib/supabase/service";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { EkipOferti } from "@/components/ekip/EkipOferti";
import { MODULES, SELLERS } from "@/lib/oferti/katalog";
import { listModularOffers, listTemplates } from "@/lib/oferti/repository";
import type { ContactLite } from "@/lib/oferti/builder-types";

export const dynamic = "force-dynamic";

/** „Оферти“ — продавачът сглобява оферта от модулите, вижда PDF-а и я праща с едно натискане. */
export default async function EkipOfertiPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "oferti")) redirect(homeFor(actor.member));
  const nav = await ekipNav(actor);
  const isOwner = actor.kind === "owner";
  const memberId = actor.kind === "member" ? actor.member.id : null;
  const seller = memberId === SELLERS.georgi.team_member_id ? "georgi" : "ivailo";
  const sb = createServiceClient();
  let cq = sb.from("contacts").select("id, full_name, email, company").order("full_name", { ascending: true });
  if (memberId) cq = cq.eq("owner_id", memberId);
  const [offers, templates, { data: contacts }] = await Promise.all([
    listModularOffers(memberId ? { owner_id: memberId } : {}),
    listTemplates(false).catch(() => []),
    cq,
  ]);
  return (
    <div className="mx-auto max-w-3xl pb-24">
      <EkipHeader name={actor.name} isOwner={isOwner} nav={nav.items} section="oferti" unread={nav.unread} />
      <main className="px-4 py-4">
        <EkipOferti
          offers={offers.map((o) => ({
            id: o.id,
            number: o.number,
            token: o.token,
            title: o.title,
            status: o.status,
            url: o.url,
            valid_until: o.valid_until,
            sent_at: o.sent_at,
            created_at: o.created_at,
            amount_gross: o.amount_gross,
            contact: o.contact ? { full_name: o.contact.full_name, company: o.contact.company, email: o.contact.email } : null,
          }))}
          templates={templates}
          modules={MODULES}
          contacts={(contacts ?? []) as ContactLite[]}
          seller={seller}
          isOwner={isOwner}
        />
      </main>
    </div>
  );
}
