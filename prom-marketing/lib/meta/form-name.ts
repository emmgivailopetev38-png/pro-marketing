import "server-only";

const GRAPH = "https://graph.facebook.com/v22.0";

/** Името на формата не се мени често — пази се за живота на ламбдата. */
const cache = new Map<string, string | null>();

/**
 * Името на лийд формата („ПМ · Лийд магнит · AI наръчник · 2026-10-07“).
 *
 * Лийдът от Graph API носи id на формата, но не и името ѝ — затова
 * `meta_leads.form_name` стоеше празно и в картона не личеше от коя форма е
 * човекът. Една заявка на форма, с кратък таймаут: ако Meta се бави, лийдът
 * влиза без името, вместо да чака.
 */
export async function fetchFormName(formId: string | null | undefined, pageToken: string): Promise<string | null> {
  const id = (formId ?? "").trim();
  if (!id || id === "unknown") return null;
  if (cache.has(id)) return cache.get(id) ?? null;
  try {
    const res = await fetch(`${GRAPH}/${encodeURIComponent(id)}?fields=name&access_token=${encodeURIComponent(pageToken)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { name?: unknown };
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
    if (name) cache.set(id, name);
    return name;
  } catch {
    return null;
  }
}
