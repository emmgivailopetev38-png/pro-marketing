"use client";
import Script from "next/script";
import { useEffect } from "react";
import { CONSENT_KEY, CONSENT_SIGNALS } from "@/lib/google/consent";
import { GA4_ID, GOOGLE_ADS_ID, GOOGLE_TAG_ENABLED, ga4Event, gadsConversion } from "@/lib/google/gtag-client";

/**
 * Loads the Google tag (gtag.js) for Google Ads conversions and GA4, under
 * Google Consent Mode v2.
 *
 * Order matters, and it is all in one inline script that runs before gtag.js
 * is downloaded:
 *   1. consent DEFAULT = denied for all four signals (wait_for_update 500 ms),
 *   2. the visitor's stored choice (localStorage `pm_consent_v1`) is applied,
 *   3. `config` for every configured id.
 * The banner (CookieConsent.tsx) only ever sends a later `consent update`.
 *
 * Also registers ONE document-level click listener that reports phone and
 * WhatsApp clicks, so none of the ~40 `tel:` links needs touching.
 *
 * Renders nothing — and loads nothing — unless NEXT_PUBLIC_GOOGLE_ADS_ID or
 * NEXT_PUBLIC_GA4_ID is set. The Meta Pixel and PostHog are NOT affected by
 * the consent choice (see PR notes).
 */

const IDS = [GOOGLE_ADS_ID, GA4_ID].filter(Boolean);

const signals = (status: "granted" | "denied") =>
  Object.fromEntries(CONSENT_SIGNALS.map((s) => [s, status]));
const DEFAULT_CONSENT = JSON.stringify({ ...signals("denied"), wait_for_update: 500 });
const GRANTED_CONSENT = JSON.stringify(signals("granted"));

function initScript(): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', ${DEFAULT_CONSENT});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
try {
  var saved = JSON.parse(window.localStorage.getItem(${JSON.stringify(CONSENT_KEY)}) || 'null');
  if (saved && saved.status === 'granted') gtag('consent', 'update', ${GRANTED_CONSENT});
} catch (e) {}
gtag('js', new Date());
${IDS.map((id) => `gtag('config', ${JSON.stringify(id)});`).join("\n")}
`;
}

export function GoogleTag() {
  useEffect(() => {
    if (!GOOGLE_TAG_ENABLED) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest("a[href]");
      const href = link?.getAttribute("href");
      if (!href) return;
      if (href.startsWith("tel:")) {
        gadsConversion("phone");
        ga4Event("phone_click");
      } else if (href.includes("wa.me/")) {
        ga4Event("whatsapp_click");
      }
    };
    // Capture phase: runs even if a component stops propagation or navigates.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!GOOGLE_TAG_ENABLED) return null;

  return (
    <>
      <Script id="google-tag-init" strategy="afterInteractive">
        {initScript()}
      </Script>
      <Script
        id="google-tag-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(IDS[0])}`}
      />
    </>
  );
}
