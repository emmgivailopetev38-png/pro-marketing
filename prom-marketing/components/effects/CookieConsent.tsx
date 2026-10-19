"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  updateGoogleConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/google/consent";
import { GOOGLE_TAG_ENABLED } from "@/lib/google/gtag-client";

/**
 * Google Consent Mode v2 banner. Shown only when a Google id is configured
 * and the visitor has no stored choice yet (or reopened it from the footer).
 *
 * Both buttons are the same size and weight on purpose — declining must be as
 * easy as accepting. The choice lives in localStorage (`pm_consent_v1`) and is
 * forwarded to Google with `gtag('consent', 'update', …)`; GoogleTag.tsx applies
 * a stored "granted" before gtag.js loads on later visits.
 *
 * On phones the banner stacks above StickyMobileCTA: that component publishes
 * its height in the `--pm-sticky-cta-h` CSS variable while it is on screen.
 *
 * Gates ONLY Google's tag. The Meta Pixel and PostHog are not gated.
 */

// "Open" = Google tag is configured and there is no stored choice. Written and
// cleared choices (incl. the footer link) fire CONSENT_CHANGE_EVENT.
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}
const getSnapshot = () => GOOGLE_TAG_ENABLED && readConsent() === null;
const getServerSnapshot = () => false;

const BUTTON =
  "min-h-11 flex-1 rounded-full border border-[var(--color-accent-cyan)]/50 bg-[var(--color-accent-cyan)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-cyan)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-cyan)] sm:flex-none sm:px-6";

export function CookieConsent() {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!open) return null;

  const choose = (choice: ConsentChoice) => {
    updateGoogleConsent(choice);
    writeConsent(choice); // fires CONSENT_CHANGE_EVENT → the banner closes
  };

  return (
    <div
      role="region"
      aria-label="Съгласие за бисквитки"
      className="fixed inset-x-0 bottom-[var(--pm-sticky-cta-h,0px)] z-[115] border-t border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/95 backdrop-blur-md transition-[bottom] duration-300 md:bottom-0"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <p className="text-[13px] leading-snug text-[var(--color-text-secondary)]">
          ПроМаркетинг ЕООД ползва бисквитки на Google за измерване и реклама — само ако ги
          приемеш.{" "}
          <Link
            href="/cookies"
            className="text-[var(--color-accent-cyan)] underline underline-offset-2 hover:text-[var(--color-text-primary)]"
          >
            Повече за бисквитките
          </Link>
        </p>
        <div className="flex gap-2 sm:shrink-0">
          <button type="button" className={BUTTON} onClick={() => choose("granted")}>
            Приемам
          </button>
          <button type="button" className={BUTTON} onClick={() => choose("denied")}>
            Само необходимите
          </button>
        </div>
      </div>
    </div>
  );
}
