import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, issueMemberSession } from "@/lib/admin/session";
import { verifyPassword } from "@/lib/team/password";
import { findMemberForLogin, touchLogin } from "@/lib/team/repository";

export const dynamic = "force-dynamic";

/**
 * Вход за екипа — POST { email, password }.
 * Същата бисквитка като /admin (`pm_admin`), но токенът носи id-то на човека,
 * така че /admin остава затворен за него, а /ekip знае кой е.
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const member = email && password ? await findMemberForLogin(email) : null;
  const ok = !!member && verifyPassword(password, member.password_hash);
  if (!ok || !member) {
    // Забавяне срещу налучкване — както при /api/admin/auth.
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Грешен имейл или парола" }, { status: 401 });
  }

  const token = issueMemberSession(member.id);
  await touchLogin(member.id).catch(() => {});
  const res = NextResponse.json({ ok: true, name: member.full_name, role: member.role });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return res;
}

// Изход — DELETE
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
