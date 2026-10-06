"use client";
import { useState } from "react";
import { track } from "@/lib/analytics/track";

/**
 * „Сподели“ праща АФИША (не личния билет — той отваря твоята зала) с
 * UTM-и, по които в CRM-а се вижда, че човекът е дошъл по покана.
 * „Свали билета“ — картинката, за Stories или за спомен.
 */
export function ShareTicket({ imageUrl, landingUrl }: { imageUrl: string; landingUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${landingUrl}?utm_source=bilet&utm_medium=share&utm_campaign=valnata`;

  async function share() {
    track("kino_share");
    const text = "Взех си безплатен билет за онлайн премиерата на „ВЪЛНАТА“ — филм за AI и българския бизнес. Ела и ти:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "ВЪЛНАТА · онлайн премиера", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* човекът се отказа */
    }
  }

  return (
    <div className="k-actions-grid k-actions-grid--2">
      <a className="k-btn" href={imageUrl} download="bilet-valnata.png" onClick={() => track("kino_ticket_download")}>
        ⬇️ Свали билета
      </a>
      <button type="button" className="k-btn" onClick={share}>
        {copied ? "Линкът е копиран ✓" : "📣 Покани приятел"}
      </button>
    </div>
  );
}
