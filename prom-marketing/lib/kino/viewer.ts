import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { contactFromTicket, isKinoDemoEnv } from "./token";
import { getContact, isDbConfigured, type KinoContact } from "./server";
import { seatFor } from "./people";

/**
 * Кой гледа страницата: билетът от адреса (?t=…) → картонът в CRM-а.
 * Прегледът на Ивайло (?sim=…) е позволен само с неговата админ бисквитка
 * или локално — за всички останали параметърът се пренебрегва.
 */

export interface KinoViewer {
  token: string | null;
  contactId: string | null;
  contact: KinoContact | null;
  name: string;
  /** има ли истинско име в картона (иначе името е „Зрител“) */
  named: boolean;
  seat: { hall: number; row: number; seat: number } | null;
}

export function firstParam(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function resolveViewer(t: string | null): Promise<KinoViewer> {
  const contactId = t ? contactFromTicket(t) : null;
  if (!t || !contactId) return { token: null, contactId: null, contact: null, name: "", named: false, seat: null };
  const contact = await getContact(contactId);
  const real = contact?.full_name?.trim() || "";
  const name = real || (isDbConfigured() ? "Зрител" : "Гост на премиерата");
  return { token: t, contactId, contact, name, named: Boolean(real), seat: seatFor(contactId) };
}

export async function canPreview(): Promise<boolean> {
  if (isKinoDemoEnv()) return true;
  try {
    const c = (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
    return verifySession(c);
  } catch {
    return false;
  }
}

/**
 * Прегледът: `?as=deposit | invited | bought` показва страницата така, както
 * я вижда човек с капаро (доплащането), поканен след разговор или купил —
 * без нищо да се пише. Работи само в прегледа (canPreview).
 */
export type PreviewAs = "deposit" | "invited" | "bought" | null;

export function previewAs(v: string | null): PreviewAs {
  return v === "deposit" || v === "invited" || v === "bought" ? v : null;
}
