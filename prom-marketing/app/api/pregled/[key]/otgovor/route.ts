import { NextResponse } from "next/server";
import { z } from "zod";
import { loadReview, upsertAnswers } from "@/lib/pregled/repository";
import { isValidKey } from "@/lib/pregled/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/pregled/<ключ>/otgovor
 *
 * Записва отговорите на клиента за един или няколко клипа. Вика се при
 * всяко натискане на „Одобрявам“/„Не този“ и след пауза в писането на
 * бележка — затова е идемпотентен upsert и няма нито имейл, нито CRM.
 * Защитата е самият ключ: без валиден ред в client_reviews нищо не се пише.
 */

const answersSchema = z.object({
  answers: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(20),
        verdict: z.enum(["approved", "rejected"]).nullable(),
        comment: z.string().max(1500).default(""),
      })
    )
    .min(1)
    .max(60),
});

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isValidKey(key)) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const raw = await request.json().catch(() => null);
  const parsed = answersSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });

  const loaded = await loadReview(key);
  if (!loaded) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const { saved, error } = await upsertAnswers(loaded.review.id, loaded.review.items, parsed.data.answers);
  if (error) return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true, saved });
}
