"use client";
import { clearConsent } from "@/lib/google/consent";
import { GOOGLE_TAG_ENABLED } from "@/lib/google/gtag-client";

/**
 * Footer list item „Настройки на бисквитките": forgets the stored choice, which
 * reopens the consent banner (it listens for the change). Renders nothing at all
 * (not even the <li>) when no Google id is configured, so the footer is
 * unchanged until the tag is on.
 */
export function CookieSettingsItem({ className }: { className?: string }) {
  if (!GOOGLE_TAG_ENABLED) return null;
  return (
    <li>
      <button type="button" className={className} onClick={clearConsent}>
        Настройки на бисквитките
      </button>
    </li>
  );
}
