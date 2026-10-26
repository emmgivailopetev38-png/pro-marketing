const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * Адресът на подателя за релея (/api/crm/email-relay): `sistema@<домейна на
 * EMAIL_FROM>` — потвърденият в Resend домейн (promarketing.pw), не адресът
 * на Ивайло. `EMAIL_RELAY_FROM_ADDRESS` го сменя изрично. null = няма откъде.
 */
export function relayFromAddress(env: Record<string, string | undefined> = process.env): string | null {
  const explicit = (env.EMAIL_RELAY_FROM_ADDRESS ?? "").trim();
  if (explicit && EMAIL_RE.test(explicit)) return explicit;
  const from = (env.EMAIL_FROM ?? "").trim();
  const addr = (/<([^>]+)>/.exec(from)?.[1] ?? from).trim();
  const domain = addr.split("@")[1]?.trim();
  if (!domain || !/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(domain)) return null;
  return `sistema@${domain}`;
}
