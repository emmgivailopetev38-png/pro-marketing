/**
 * Социалните мрежи на клиента.
 *
 * Пазят се в `contacts.social_links` (jsonb) като готови за клик адреси.
 * Влиза каквото е под ръка — „@spi.milo.dete", „instagram.com/spi.milo.dete"
 * или целият URL — а излиза едно и също нещо, за да не се събират три записа
 * за един и същи профил.
 */

export const SOCIAL_KEYS = [
  "website",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "threads",
] as const;

export type SocialNetwork = (typeof SOCIAL_KEYS)[number];
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

interface SocialNetworkDef {
  key: SocialNetwork;
  label: string;
  icon: string;
  placeholder: string;
  /** Как гол хендъл става адрес. `null` за сайта — там хендъл няма смисъл. */
  handleUrl: ((handle: string) => string) | null;
}

export const SOCIAL_NETWORKS: SocialNetworkDef[] = [
  {
    key: "website",
    label: "Сайт",
    icon: "🌐",
    placeholder: "spimilodete.com",
    handleUrl: null,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "📘",
    placeholder: "@name или пълен адрес",
    handleUrl: (h) => `https://www.facebook.com/${h}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "📸",
    placeholder: "@name",
    handleUrl: (h) => `https://www.instagram.com/${h}/`,
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: "🎵",
    placeholder: "@name",
    handleUrl: (h) => `https://www.tiktok.com/@${h}`,
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "▶️",
    placeholder: "@name",
    handleUrl: (h) => `https://www.youtube.com/@${h}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    placeholder: "@name или пълен адрес",
    handleUrl: (h) => `https://www.linkedin.com/in/${h}`,
  },
  {
    key: "threads",
    label: "Threads",
    icon: "🧵",
    placeholder: "@name",
    handleUrl: (h) => `https://www.threads.net/@${h}`,
  },
];

const BY_KEY = new Map(SOCIAL_NETWORKS.map((n) => [n.key, n]));

export function isSocialNetwork(key: string): key is SocialNetwork {
  return BY_KEY.has(key as SocialNetwork);
}

/**
 * Едно поле от формата → адрес за базата, или `null`, ако няма какво да се пази.
 * Празното чисти мрежата — така се маха сгрешен линк, без отделно копче.
 */
export function normalizeSocialValue(key: SocialNetwork, raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/\s+/g, "");
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const net = BY_KEY.get(key);
  const handle = value.replace(/^@+/, "").replace(/\/+$/, "");
  if (!handle) return null;

  // Точката НЕ значи домейн — „spi.milo.dete" е съвсем нормален хендъл в
  // Instagram и TikTok. Наклонената черта значи: „instagram.com/spi.milo.dete"
  // е адрес, а мрежа без шаблон за хендъл (сайтът) приема само адрес.
  if (value.startsWith("@")) return net?.handleUrl ? net.handleUrl(handle) : null;
  if (handle.includes("/")) return `https://${handle}`;
  if (net?.handleUrl) return net.handleUrl(handle);
  return handle.includes(".") ? `https://${handle}` : null;
}

/**
 * Каквото дойде отвън (тяло на PATCH, ред от базата, полета на формата) →
 * чист обект само с познати мрежи и валидни адреси.
 */
export function parseSocialLinks(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const out: SocialLinks = {};
  for (const net of SOCIAL_NETWORKS) {
    const normalized = normalizeSocialValue(net.key, source[net.key]);
    if (normalized) out[net.key] = normalized;
  }
  return out;
}

/** Мрежите, които наистина имат линк — за показване, в постоянен ред. */
export function filledSocialLinks(raw: unknown): { net: SocialNetworkDef; url: string }[] {
  const links = parseSocialLinks(raw);
  return SOCIAL_NETWORKS.flatMap((net) => {
    const url = links[net.key];
    return url ? [{ net, url }] : [];
  });
}

/** „https://www.instagram.com/spi.milo.dete/" → „instagram.com/spi.milo.dete" */
export function shortSocialLabel(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}
