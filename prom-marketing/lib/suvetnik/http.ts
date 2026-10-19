import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";

/** Съветникът е само за Ивайло — същата админ бисквитка като останалия CRM. */
export async function suvetnikAuthorized() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(ADMIN_COOKIE)?.value ?? null);
}
