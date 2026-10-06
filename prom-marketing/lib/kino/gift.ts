import "server-only";
import { list } from "@vercel/blob";
import { KINO } from "./config";
import { createServiceClient } from "@/lib/supabase/service";
import { isDbConfigured, isMissingSchema, SCREENING } from "./server";

/**
 * Подаръкът след надписите — „30 готови поръчки към AI“ (PDF във Vercel Blob,
 * store „kino-video“, със случаен суфикс в името).
 *
 * Адресът НЕ е в кода (репото е публично) и не стига до браузъра: сървърът го
 * намира в Blob store-а по префикс с BLOB_READ_WRITE_TOKEN (идва от
 * свързването на store-а — нов env няма) и пренасочва към него само след
 * отключването. Нова версия на подаръка = качване със същия префикс; печели
 * най-новата.
 */

let cache: { at: number; url: string | null } | null = null;
const CACHE_MS = 10 * 60_000;

export async function giftBlobUrl(): Promise<string | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.url;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: KINO.bonus.blobPrefix, limit: 20 });
    const newest = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    cache = { at: Date.now(), url: newest?.url ?? null };
    return cache.url;
  } catch (e) {
    console.error("[kino/gift] blob list", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Отключил ли е подаръка: етапът „bonus“ в kino_watch (записва се преди
 * отговора на залата) или активността kino_bonus в картона.
 */
export async function hasGift(contactId: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const sb = createServiceClient();
  const [watch, act] = await Promise.all([
    sb.from("kino_watch").select("milestones").eq("screening_id", SCREENING).eq("contact_id", contactId).maybeSingle(),
    sb.from("contact_activities").select("metadata").eq("contact_id", contactId).eq("activity_type", "kino_bonus").limit(10),
  ]);
  if (watch.error && !isMissingSchema(watch.error)) console.error("[kino/gift] watch", watch.error.message);
  const milestones = ((watch.data as { milestones?: string[] } | null)?.milestones ?? []) as string[];
  if (milestones.includes("bonus")) return true;
  return (act.data ?? []).some((r) => ((r.metadata ?? {}) as Record<string, unknown>).screening === SCREENING);
}
