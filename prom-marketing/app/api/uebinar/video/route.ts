import { NextResponse } from "next/server";
import { uebinarVideo } from "@/lib/uebinar/config";
import { contactByKey } from "@/lib/uebinar/views";

export const dynamic = "force-dynamic";

/**
 * GET /api/uebinar/video?k=… — видеото за човек, който вече се е записал в
 * този браузър (ключът е в localStorage). Непознат ключ → video: null и
 * залата показва формата.
 */
export async function GET(request: Request) {
  const k = (new URL(request.url).searchParams.get("k") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{8}$/.test(k)) return NextResponse.json({ video: null }, { status: 400 });
  const contact = await contactByKey(k).catch(() => null);
  return NextResponse.json({ video: contact ? uebinarVideo() : null });
}
