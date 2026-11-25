import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { UEBINAR_ORIGIN } from "./domen";

/**
 * Отписване от писмата за уебинара — линк с подпис, за да не може някой да
 * отпише чужд картон. Ключът е CRON_SECRET (или INTERNAL_SEND_TOKEN).
 */
function secret(): string {
  return process.env.CRON_SECRET || process.env.INTERNAL_SEND_TOKEN || "";
}

function sign(contactId: string): string {
  return createHmac("sha256", secret()).update(`uebinar-otpisvane:${contactId}`).digest("hex").slice(0, 24);
}

export function otpisvaneLink(contactId: string): string {
  return `${UEBINAR_ORIGIN}/api/uebinar/otpisvane?k=${contactId}.${sign(contactId)}`;
}

/** k = „<contactId>.<подпис>“ → contactId, ако подписът е верен. */
export function proveriOtpisvane(k: string | null | undefined): string | null {
  const [id, sig] = (k ?? "").split(".");
  if (!id || !sig || !secret() || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const ok = sign(id);
  if (ok.length !== sig.length) return null;
  return timingSafeEqual(Buffer.from(ok), Buffer.from(sig)) ? id : null;
}

export const OTPISVANE_TYPE = "uebinar_otpisvane";
