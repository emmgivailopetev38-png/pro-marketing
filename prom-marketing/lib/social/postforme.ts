// Post for Me (postforme.dev) — unified social posting API client.
// Server-only: reads POSTFORME_API_KEY from env. Base is the v1 REST API.
import "server-only";

const BASE = "https://api.postforme.dev/v1";

function authHeader(): Record<string, string> {
  const key = process.env.POSTFORME_API_KEY;
  if (!key) throw new Error("POSTFORME_API_KEY не е зададен");
  return { Authorization: `Bearer ${key}` };
}

export function hasPostformeKey(): boolean {
  return !!process.env.POSTFORME_API_KEY;
}

export interface SocialAccount {
  id: string;
  platform: string;
  username: string | null;
  profile_photo_url: string | null;
}

export interface SocialPostRow {
  id: string;
  caption: string | null;
  status: string | null;
  created_at: string | null;
  scheduled_at: string | null;
  social_accounts: string[];
}

export async function listSocialAccounts(): Promise<SocialAccount[]> {
  try {
    const r = await fetch(`${BASE}/social-accounts`, { headers: authHeader(), cache: "no-store" });
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: SocialAccount[] };
    return j.data ?? [];
  } catch {
    return [];
  }
}

export async function listSocialPosts(limit = 20): Promise<SocialPostRow[]> {
  try {
    const r = await fetch(`${BASE}/social-posts?limit=${limit}`, { headers: authHeader(), cache: "no-store" });
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: Array<Record<string, unknown>> };
    return (j.data ?? []).slice(0, limit).map((p) => {
      const accounts = Array.isArray(p.social_accounts)
        ? (p.social_accounts as unknown[]).map((a) => (typeof a === "string" ? a : ((a as { id?: string })?.id ?? "")))
        : [];
      return {
        id: String(p.id ?? ""),
        caption: (p.caption as string) ?? null,
        status: (p.status as string) ?? null,
        created_at: (p.created_at as string) ?? null,
        scheduled_at: (p.scheduled_at as string) ?? null,
        social_accounts: accounts.filter(Boolean),
      };
    });
  } catch {
    return [];
  }
}

export interface CreatePostInput {
  caption: string;
  accountIds: string[];
  media?: string[];
  scheduledAt?: string | null;
}

export async function createSocialPost(input: CreatePostInput): Promise<{ id: string; raw: unknown }> {
  const body: Record<string, unknown> = {
    caption: input.caption,
    social_accounts: input.accountIds,
  };
  if (input.media && input.media.length) {
    body.media = input.media.filter(Boolean).map((url) => ({ url }));
  }
  if (input.scheduledAt) body.scheduled_at = input.scheduledAt;

  const r = await fetch(`${BASE}/social-posts`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
  if (!r.ok) {
    throw new Error(data?.message || data?.error || `postforme HTTP ${r.status}`);
  }
  return { id: String(data.id ?? ""), raw: data };
}
