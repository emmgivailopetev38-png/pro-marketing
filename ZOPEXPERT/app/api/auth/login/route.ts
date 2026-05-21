import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password: string };

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = Buffer.from(
    `${process.env.ADMIN_PASSWORD}:${process.env.AUTH_SECRET}`
  ).toString("base64url");

  const response = NextResponse.json({ ok: true });
  response.cookies.set("zop_auth", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
