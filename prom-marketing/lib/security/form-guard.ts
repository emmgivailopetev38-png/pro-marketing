/*
 * Защита на публичните форми, които пращат писмо на адреса от заявката.
 *
 * Повод (29.09.2026): /api/order, /api/webinar/register и /api/trading/register
 * пращаха потвърждение на ВСЕКИ въведен имейл, с името и услугата от заявката в
 * темата и тялото — без ограничение. Това е същото „отворено реле“, през което
 * бот караше greenelexir.com да праща писма на чужди адреси (10–11.09.2026).
 * Тук още не е ползвано, но цената на затварянето е нищожна.
 *
 * Слоевете, от евтин към скъп:
 *   1) произход — заявката идва от нашия сайт (браузърът слага Origin на всеки POST)
 *   2) текст от нападателя не носи връзки в писмото
 *   3) едно потвърждение на адрес на денонощие + таван на час за целия маршрут
 * Лийдът се записва в CRM-а винаги — спира се само писмото към непознатия адрес.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const OWN_ORIGINS = new Set([
  "https://promarketing.pw",
  "https://www.promarketing.pw",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function originOf(request: Request): string {
  const o = request.headers.get("origin")?.trim();
  if (o) return o.replace(/\/+$/, "");
  const r = request.headers.get("referer")?.trim();
  if (!r) return "";
  try {
    return new URL(r).origin;
  } catch {
    return "";
  }
}

/** true, ако заявката идва от нашия сайт (или от Vercel preview на проекта). */
export function isOwnOrigin(request: Request): boolean {
  const o = originOf(request);
  if (!o) return false;
  if (OWN_ORIGINS.has(o)) return true;
  const extra = (process.env.ALLOWED_FORM_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  if (extra.includes(o)) return true;
  return /^https:\/\/prom-marketing[a-z0-9-]*\.vercel\.app$/i.test(o);
}

const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|info|xyz|top|ru|cn|io|link|click|biz|site|online|shop)\b)/i;

/** Има ли в текста нещо, което в писмото ще стане връзка. */
export function hasLink(s: string | null | undefined): boolean {
  return !!s && LINK_RE.test(s);
}

/** Текст от заявката, безопасен за писмо до непознат адрес: без връзки, орязан. */
export function safeForMail(s: string | null | undefined, max: number, fallback = ""): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return !t || hasLink(t) ? fallback : t;
}

/**
 * Може ли да тръгне потвърждение към този адрес.
 * Брои записите на същия маршрут (activity_type) в CRM-а — текущият вече е вътре.
 * При грешка в базата пуска (fail-open): счупен брояч не бива да спира истински човек.
 */
export async function confirmationAllowed(
  supabase: SupabaseClient,
  activityType: string,
  email: string,
  opts: { perAddressPerDay?: number; perRoutePerHour?: number } = {},
): Promise<boolean> {
  const perAddress = opts.perAddressPerDay ?? 1;
  const perRoute = opts.perRoutePerHour ?? 20;
  try {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const [byAddress, byRoute] = await Promise.all([
      supabase
        .from("contact_activities")
        .select("id", { count: "exact", head: true })
        .eq("activity_type", activityType)
        .eq("metadata->>email", email)
        .gte("created_at", dayAgo),
      supabase
        .from("contact_activities")
        .select("id", { count: "exact", head: true })
        .eq("activity_type", activityType)
        .gte("created_at", hourAgo),
    ]);
    if (byAddress.error || byRoute.error) return true;
    return (byAddress.count ?? 0) <= perAddress && (byRoute.count ?? 0) <= perRoute;
  } catch {
    return true;
  }
}
