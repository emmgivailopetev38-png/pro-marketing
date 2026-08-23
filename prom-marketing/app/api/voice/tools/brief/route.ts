import { NextResponse } from "next/server";
import { guardVoice } from "@/lib/voice/guard";
import { buildVoiceBrief } from "@/lib/voice/brief";

export const dynamic = "force-dynamic";

/**
 * GET /api/voice/tools/brief — „какво става днес".
 *
 * Един инструмент, едно извикване, цялата картина: срещи, последващи стъпки,
 * нови лийдове, просрочени, пари, чакащи одобрения. Отговорът носи `spoken` —
 * готово изречение, което агентът чете, вместо да съчинява числа сам.
 */
export async function GET(request: Request) {
  const guard = guardVoice(request);
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });
  try {
    const brief = await buildVoiceBrief();
    return NextResponse.json({ ok: true, ...brief });
  } catch (err) {
    console.error("[voice/brief]", err);
    // Гласът не бива да мълчи при грешка — казва си го и разговорът продължава.
    return NextResponse.json(
      { ok: false, spoken: "Не мога да стигна до базата в момента." },
      { status: 200 }
    );
  }
}
