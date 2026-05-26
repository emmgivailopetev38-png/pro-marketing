import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { syncAllSources } from "@/lib/leads/import";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function checkBearer(request: Request): boolean {
  const expected = process.env.INTERNAL_SEND_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const provided = header.slice(7);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function isAuthed(request: Request): Promise<boolean> {
  if (checkBearer(request)) return true;
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value ?? null);
}

export async function POST(request: Request) {
  if (!(await isAuthed(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await syncAllSources();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  // Same handler — convenient for browser inspection / cron tooling.
  return POST(request);
}
