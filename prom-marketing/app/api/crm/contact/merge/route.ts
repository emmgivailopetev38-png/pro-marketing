import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { mergeContacts } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

const schema = z.object({
  survivor_id: z.string().uuid(),
  duplicate_id: z.string().uuid(),
});

/**
 * POST /api/crm/contact/merge — слива дубликат в оцеляващ контакт.
 * Премества всичките 13 връзки (фактури, плащания, оферти, проекти,
 * активности…), попълва празните полета на оцеляващия и трие дубликата.
 * ⚠ Необратимо — Hermes го вика само след потвърждение от Ивайло
 * (по правилата на dup-contact playbook-а).
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await mergeContacts(parsed.data);
  if (result.error === "survivor not found" || result.error === "duplicate not found") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, survivor_id: parsed.data.survivor_id });
}
