import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { contactIdForCode } from "@/lib/contacts/personal-link";
import { dayKey } from "@/lib/contacts/followup";

export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string().trim().regex(/^[0-9a-fA-F]{10}$/) });

/**
 * POST /api/tracking/zatopli-view — маякът на личната страница.
 *
 * Без auth по дизайн, като брата си при офертите: най-многото, което може да
 * направи, е да запише „този отвори линка си". Кодът е HMAC, тоест чужд код не
 * се познава, а непознат код не пише нищо.
 *
 * Записът е един на ден на човек (`dedupe_key`). Причината е в точките: без
 * дедупликация отваряне на страницата пет пъти щеше да вдигне топлината пет
 * пъти, и опашката щеше да подрежда по това кой е презаредил, а не кой се
 * интересува.
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const svc = createServiceClient();
  const { data: ids } = await svc.from("contacts").select("id");
  const contactId = contactIdForCode(
    parsed.data.code,
    ((ids ?? []) as Array<{ id: string }>).map((r) => r.id)
  );
  if (!contactId) return NextResponse.json({ ok: false }, { status: 404 });

  // `dedupe_key` не е колона на contact_activities — живее в `metadata`,
  // както го прави и `upsertContactAndLog`.
  const dedupe = `zatopli_view:${contactId}:${dayKey(new Date())}`;

  const { data: seen } = await svc
    .from("contact_activities")
    .select("id")
    .eq("contact_id", contactId)
    .eq("activity_type", "zatopli_view")
    .contains("metadata", { dedupe_key: dedupe })
    .maybeSingle();
  if (seen) return NextResponse.json({ ok: true, deduped: true });

  await svc.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "zatopli_view",
    title: `Отвори личния линк`,
    created_by: "system",
    metadata: { dedupe_key: dedupe, via: "zatopli" },
  });

  return NextResponse.json({ ok: true });
}
