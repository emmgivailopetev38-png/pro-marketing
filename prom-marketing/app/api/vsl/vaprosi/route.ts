import { NextResponse } from "next/server";
import { z } from "zod";
import { VSL, isVslSlug } from "@/lib/site/vsl";
import { deliverVslAnswers } from "@/lib/site/vsl-answers";

export const dynamic = "force-dynamic";

const schema = z.object({
  vsl: z.string(),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 9, "phone"),
  answers: z.record(z.string(), z.string().max(3000)).default({}),
  ot: z.string().max(20).optional(),
  // Капан за ботове: скрито поле, човек не го вижда и не го пълни.
  website: z.string().max(200).optional(),
});

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse/i;

/**
 * POST /api/vsl/vaprosi — въпросите преди срещата от /biznes и /pari-s-ai.
 * Публичен (човекът няма вход). Пише само в картона, чийто телефон съвпада,
 * и праща известие на Георги — не чете и не връща нищо за контакта.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isVslSlug(parsed.data.vsl)) {
    return NextResponse.json({ ok: false, error: "Провери името и телефона." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website || BOT_UA.test(request.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });

  const c = VSL[d.vsl as keyof typeof VSL];
  const allowed = new Set(c.questions.map((q) => q.key));
  const answers = Object.fromEntries(Object.entries(d.answers).filter(([k, v]) => allowed.has(k) && v.trim()));

  const res = await deliverVslAnswers({ c, name: d.name, phone: d.phone, answers, toIvailo: d.ot === "ivailo" }).catch(
    (e: unknown) => {
      console.error("[vsl/vaprosi] deliver", e instanceof Error ? e.message : e);
      return { ok: false, contactId: null };
    }
  );
  if (!res.ok) return NextResponse.json({ ok: false, error: "Не успяхме да ги изпратим. Опитай пак след малко." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
