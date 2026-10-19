"use client";

/**
 * Client-side helpers for the Google tag (Google Ads conversions + GA4).
 *
 * `gtag` is defined by components/effects/GoogleTag.tsx. Every helper here is
 * a safe no-op when the tag is not on the page (env vars not set, blocked by
 * an ad-blocker, not loaded yet) or when the relevant env var is empty, so
 * call sites never need to guard anything and analytics can never break the UI.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Google Ads account id, "AW-XXXXXXXXXX". */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
/** GA4 measurement id, "G-XXXXXXXXXX". */
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";

/** True when at least one Google id is configured — the tag and banner are off otherwise. */
export const GOOGLE_TAG_ENABLED = Boolean(GOOGLE_ADS_ID || GA4_ID);

export type ConversionKind = "booking" | "lead" | "phone";

// Each env var must be read as a literal property so Next inlines it into the bundle.
const CONVERSION_LABELS: Record<ConversionKind, string> = {
  booking: process.env.NEXT_PUBLIC_GADS_LABEL_BOOKING ?? "",
  lead: process.env.NEXT_PUBLIC_GADS_LABEL_LEAD ?? "",
  phone: process.env.NEXT_PUBLIC_GADS_LABEL_PHONE ?? "",
};

function gtagReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

interface ConversionOptions {
  /** Unique id of the conversion — Google drops repeats with the same id. */
  transactionId?: string;
  /** Conversion value in EUR. */
  value?: number;
}

/** Report a Google Ads conversion (booking, lead form or phone click). */
export function gadsConversion(kind: ConversionKind, opts?: ConversionOptions): void {
  if (!gtagReady()) return;
  const label = CONVERSION_LABELS[kind];
  if (!GOOGLE_ADS_ID || !label) return;
  const params: Record<string, unknown> = { send_to: `${GOOGLE_ADS_ID}/${label}` };
  if (opts?.transactionId) params.transaction_id = opts.transactionId;
  if (typeof opts?.value === "number") {
    params.value = opts.value;
    params.currency = "EUR";
  }
  try {
    window.gtag!("event", "conversion", params);
  } catch {
    /* swallow — analytics must never break the UI */
  }
}

/** Send a GA4 event (generate_lead, book_appointment, phone_click, whatsapp_click, ...). */
export function ga4Event(name: string, params?: Record<string, unknown>): void {
  if (!gtagReady() || !GA4_ID) return;
  try {
    // send_to keeps the event on the GA4 stream only (not duplicated to the Ads config).
    window.gtag!("event", name, { ...params, send_to: GA4_ID });
  } catch {
    /* swallow — analytics must never break the UI */
  }
}
