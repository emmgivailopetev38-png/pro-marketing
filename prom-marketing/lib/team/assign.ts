import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ASSIGN_TYPE, type GivenKind } from "./queue-rules";
import { leadOwnerOf } from "./routing";

/**
 * Дава един картон на човека за звънене. Маркерът е активност `team_assigned`
 * — не е опит за контакт и НЕ пипа датата за чуване и статуса на картона.
 * Стои в списъка на екипа, докато той не звънне веднъж; после картонът тръгва
 * по обичайните правила. Виж lib/team/queue-rules.ts.
 *
 * При кого: при човека, при когото е влязъл лийдът по ротацията (отказалият
 * срещата се връща при същия, който я е уговорил); стар лийд — при първия в
 * кръга. Виж routing-rules.ts.
 */
export async function giveToTeam(args: {
  contactId: string;
  reason: string;
  /** „given“ = Ивайло го дава · „cancelled“ = човекът отказа срещата · „noshow“ = не се яви на нея */
  kind?: GivenKind;
  createdBy?: string | null;
  /** допълнително в metadata — напр. коя среща е отказана */
  extra?: Record<string, unknown>;
}): Promise<{ ok: boolean; memberName: string | null; memberId: string | null; error: string | null }> {
  const { pool, ownerId } = await leadOwnerOf(args.contactId).catch(() => ({ pool: [], ownerId: null }));
  const setter = pool.find((m) => m.id === ownerId) ?? null;
  if (!setter) return { ok: false, memberName: null, memberId: null, error: "няма активен човек за звънене" };

  const kind: GivenKind = args.kind ?? "given";
  const title =
    kind === "cancelled"
      ? `❌ Отказана среща · ${setter.full_name} да звънне`
      : kind === "noshow"
        ? `🙈 Не се яви на срещата · ${setter.full_name} да звънне`
        : `🤝 Дадено на ${setter.full_name} за звънене`;

  const sb = createServiceClient();
  const { error } = await sb.from("contact_activities").insert({
    contact_id: args.contactId,
    activity_type: ASSIGN_TYPE,
    title,
    body: args.reason,
    metadata: {
      to_team: true,
      kind,
      to_name: setter.full_name,
      to_member_id: setter.id,
      reason: args.reason,
      ...(args.extra ?? {}),
    },
    created_by: args.createdBy ?? "система",
  });
  return { ok: !error, memberName: setter.full_name, memberId: setter.id, error: error?.message ?? null };
}
