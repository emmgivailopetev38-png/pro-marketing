import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { createSocialPost } from "@/lib/social/postforme";

export const dynamic = "force-dynamic";

const schema = z.object({
  caption: z.string().min(1).max(5000),
  accountIds: z.array(z.string().min(1)).min(1).max(50),
  media: z.array(z.string().url()).max(10).optional(),
  scheduledAt: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? null;
  if (!verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.message }, { status: 400 });
  }

  try {
    const res = await createSocialPost({
      caption: parsed.data.caption,
      accountIds: parsed.data.accountIds,
      media: parsed.data.media,
      scheduledAt: parsed.data.scheduledAt ?? null,
    });
    return NextResponse.json({ ok: true, id: res.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Грешка при публикуване" },
      { status: 502 }
    );
  }
}
