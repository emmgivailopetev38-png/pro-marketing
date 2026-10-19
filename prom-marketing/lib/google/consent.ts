"use client";

import { GOOGLE_TAG_ENABLED } from "@/lib/google/gtag-client";

/**
 * Google Consent Mode v2 — the visitor's stored choice.
 *
 * Only Google's tag is gated by this (ad_storage, ad_user_data,
 * ad_personalization, analytics_storage). The Meta Pixel and PostHog load
 * independently of it.
 */

export const CONSENT_KEY = "pm_consent_v1";

/**
 * Window event fired whenever the stored choice changes (written or cleared).
 * The banner listens to it: clearing the choice from the footer link reopens
 * it, picking a button closes it.
 */
export const CONSENT_CHANGE_EVENT = "pm:cookie-consent-change";

// Fallback for when localStorage is blocked (private mode): the choice then
// lasts until the page is closed, but the banner still goes away after a click.
let memoryChoice: ConsentChoice | null = null;

export type ConsentChoice = "granted" | "denied";

export const CONSENT_SIGNALS = [
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "analytics_storage",
] as const;

export function readConsent(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { status?: unknown } | null;
      if (parsed?.status === "granted" || parsed?.status === "denied") return parsed.status;
    }
  } catch {
    /* blocked or corrupt storage — fall through to the in-memory choice */
  }
  return memoryChoice;
}

export function writeConsent(status: ConsentChoice): void {
  memoryChoice = status;
  try {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ status, date: new Date().toISOString() }),
    );
  } catch {
    /* private mode / blocked storage — memoryChoice covers this page view */
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

export function clearConsent(): void {
  memoryChoice = null;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** Push the choice into Google's consent state. */
export function updateGoogleConsent(status: ConsentChoice): void {
  if (!GOOGLE_TAG_ENABLED || typeof window.gtag !== "function") return;
  const state = Object.fromEntries(CONSENT_SIGNALS.map((s) => [s, status]));
  try {
    window.gtag("consent", "update", state);
  } catch {
    /* ignore */
  }
}
