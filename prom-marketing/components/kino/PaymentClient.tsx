"use client";
import { useEffect } from "react";
import { track as pixelTrack } from "@/lib/meta/pixel-client";
import { track } from "@/lib/analytics/track";
import { OfferBlock, useOfferActions } from "./Offer";
import type { KinoCohortView } from "@/lib/kino/cohorts";
import { KinoCal } from "./KinoCal";

/**
 * Purchase към пиксела — веднъж на сесия на Stripe, със СЪЩИЯ event_id като
 * сървъра (kino_purchase_<сесия>), за да не се брои двойно.
 */
export function KinoPurchaseBeacon({ sessionId, value, plan }: { sessionId: string; value: number; plan: string }) {
  useEffect(() => {
    const key = `kino_purchase_${sessionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* private mode */
    }
    let tries = 0;
    const id = window.setInterval(() => {
      tries++;
      if (typeof window.fbq === "function") {
        pixelTrack("Purchase", { eventID: key, params: { value, currency: "EUR", content_ids: [`kino-${plan}`], content_name: "ВЪЛНАТА · поток" } });
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* нищо */
        }
        window.clearInterval(id);
      } else if (tries > 20) window.clearInterval(id);
    }, 300);
    track("kino_purchase", { plan, value });
    return () => window.clearInterval(id);
  }, [sessionId, value, plan]);
  return null;
}

/** Календарът на страницата „Благодарим“ — онбординг разговор или разговорът след капарото. */
export function ThankYouCal({ name, email, notes }: { name?: string | null; email?: string | null; notes: string }) {
  return (
    <div className="k-panel" style={{ padding: 8 }}>
      <KinoCal namespace="kino-thanks" name={name} email={email} notes={notes} onBooked={() => track("kino_thanks_booked")} />
    </div>
  );
}

/** /kino/plashtane — поканата без залата (след разговор или с платено капаро). */
export function PaymentOffer(props: {
  token: string;
  depositPaid: number;
  bought: boolean;
  name: string;
  email: string | null;
  hours?: number | null;
  cohort: KinoCohortView;
}) {
  const actions = useOfferActions({ token: props.token, from: "plashtane" });
  return (
    <OfferBlock
      actions={actions}
      token={props.token}
      depositPaid={props.depositPaid}
      bought={props.bought}
      name={props.name}
      email={props.email}
      hours={props.hours ?? null}
      cohort={props.cohort}
    />
  );
}
