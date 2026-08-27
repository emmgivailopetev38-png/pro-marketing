"use server";

import { cookies } from "next/headers";
import {
  SHARE_COOKIE,
  SHARE_MAX_AGE,
  codeFingerprint,
  safeEqual,
  unlockCookieValue,
  verifyShareToken,
} from "@/lib/share/link";

/**
 * Отключва споделен линк с код за достъп.
 *
 * Кодът се сверява с отпечатъка, който самият линк носи — никъде не се
 * пази списък с кодове. Успешният опит оставя бисквитка само за
 * /razgovorat, тъй че тя не е ключ за нищо друго в сайта.
 */
export async function unlockShare(token: string, code: string): Promise<{ ok: boolean }> {
  const payload = verifyShareToken(token);
  if (!payload?.p || !code.trim()) {
    await new Promise((r) => setTimeout(r, 500));
    return { ok: false };
  }

  if (!safeEqual(codeFingerprint(code), payload.p)) {
    // Лека забавка — брутфорсът по код става безсмислен.
    await new Promise((r) => setTimeout(r, 500));
    return { ok: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(SHARE_COOKIE, unlockCookieValue(token), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/razgovorat",
    maxAge: SHARE_MAX_AGE,
  });
  return { ok: true };
}
