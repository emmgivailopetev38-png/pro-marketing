import { createServiceClient } from "@/lib/supabase/service";
import { tgNotify } from "@/lib/notifications/telegram";
import { isoToSofiaLocal } from "@/lib/team/time";
import { VERTICAL_DEMOS } from "@/lib/email/sequence-layout";

/**
 * Личният линк към демото от писмата — `/demo?k=<първите 8 знака от id-то>`.
 *
 * Писмото обещава „линкът е твой — по него виждам, че си влизал“. До 20.10.2026
 * това не беше вярно: Vercel Analytics не е пуснат и нищо не четеше `k`.
 * Сега маякът в `app/demo/layout.tsx` праща посещението тук, а то влиза в
 * картона като „👀 Отвори демото“ — веднъж на ден на човек, със списък на
 * страниците, които е отворил този ден.
 */

/** Колко страници пазим за един ден — повече е шум, не информация. */
const MAX_PAGES = 12;

/** `k` → граници на uuid-а: id-тата, започващи с тези 8 знака. */
export function demoKeyRange(k: string): { lo: string; hi: string } | null {
  const key = k.trim().toLowerCase();
  if (!/^[0-9a-f]{8}$/.test(key)) return null;
  return { lo: `${key}-0000-0000-0000-000000000000`, hi: `${key}-ffff-ffff-ffff-ffffffffffff` };
}

/** „/demo/b2b“ → „B2B и фирми“; „/demo“ → „голямото демо“. */
export function demoPageLabel(path: string): string {
  const slug = path.replace(/\/+$/, "").split("/")[2];
  if (!slug) return "голямото демо";
  if (slug === "hotel") return "Хотел / СПА";
  return VERTICAL_DEMOS.find((d) => d.slug === slug)?.label ?? slug;
}

export function isDemoPath(path: string): boolean {
  return /^\/demo(\/[a-z0-9-]+)?\/?$/.test(path);
}

export async function recordDemoView(
  k: string,
  path: string,
  now: Date = new Date()
): Promise<{ logged: boolean; reason?: string }> {
  const range = demoKeyRange(k);
  if (!range || !isDemoPath(path)) return { logged: false, reason: "bad_input" };
  const sb = createServiceClient();

  // Точно един картон с това начало — 8 знака hex са 4 милиарда комбинации,
  // но два еднакви не се гадаят: тогава не пишем нищо.
  const { data: hits } = await sb
    .from("contacts")
    .select("id, full_name, company")
    .gte("id", range.lo)
    .lte("id", range.hi)
    .limit(2);
  const found = (hits ?? []) as Array<{ id: string; full_name: string | null; company: string | null }>;
  if (found.length !== 1) return { logged: false, reason: found.length ? "ambiguous" : "unknown_key" };
  const contact = found[0];

  const day = isoToSofiaLocal(now).slice(0, 10);
  const page = demoPageLabel(path);
  const { data: today } = await sb
    .from("contact_activities")
    .select("id, metadata")
    .eq("contact_id", contact.id)
    .eq("activity_type", "demo_view")
    .contains("metadata", { day })
    .maybeSingle();

  if (today) {
    const meta = (today.metadata ?? {}) as Record<string, unknown>;
    const pages = Array.isArray(meta.pages) ? (meta.pages as string[]) : [];
    if (pages.includes(page) || pages.length >= MAX_PAGES) return { logged: false, reason: "already_today" };
    const next = [...pages, page];
    await sb
      .from("contact_activities")
      .update({ metadata: { ...meta, pages: next }, body: `Страници: ${next.join(", ")}` })
      .eq("id", today.id);
    return { logged: true };
  }

  await sb.from("contact_activities").insert({
    contact_id: contact.id,
    activity_type: "demo_view",
    title: `👀 Отвори демото от писмото (${page})`,
    body: `Страници: ${page}`,
    occurred_at: now.toISOString(),
    metadata: { day, pages: [page], k: k.toLowerCase(), path },
    created_by: "demo_tracker",
  });
  await tgNotify.demoViewed(contact.full_name || contact.company || "Лийд", page, contact.id);
  return { logged: true };
}
