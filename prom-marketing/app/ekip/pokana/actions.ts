"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, issueMemberSession } from "@/lib/admin/session";
import { acceptInvite } from "@/lib/team/invites";
import { touchLogin } from "@/lib/team/repository";
import { homeFor } from "@/lib/team/roles";

export interface InviteResult {
  ok: boolean;
  error?: string;
}

/** Приема поканата и влиза направо — паролата я знае само човекът, който я е написал. */
export async function acceptInviteAction(_prev: InviteResult | null, formData: FormData): Promise<InviteResult> {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const res = await acceptInvite({
    token: s("token"),
    full_name: s("full_name"),
    email: s("email"),
    phone: s("phone"),
    password: String(formData.get("password") ?? ""),
    password2: String(formData.get("password2") ?? ""),
    meet_url: s("meet_url"),
  });
  if ("error" in res) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, error: res.error };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, issueMemberSession(res.member.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  await touchLogin(res.member.id).catch(() => {});
  redirect(homeFor(res.member));
}
