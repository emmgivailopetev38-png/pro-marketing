"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { UEBINAR_HOSTS, UEBINAR_PATH, UEBINAR_PIXEL_ID } from "@/lib/uebinar/domen";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Loads the Meta Pixel base snippet and fires PageView on every App Router
 * navigation. Renders nothing in the DOM (Script + noscript img only).
 *
 * Disabled cleanly when NEXT_PUBLIC_META_PIXEL_ID is not set — useful for
 * local dev so we don't poison the real pixel with localhost events.
 *
 * Уебинарът има свой, чисто нов пиксел (23.11.2026): на ivailopetev.com и на
 * /na-zhivo се зарежда САМО той, навсякъде другаде — само основният. Кой от
 * двата, решава скриптът в браузъра (страницата е статична и не знае хоста),
 * така че PageView и CompleteRegistration от лендинга учат само новия пиксел.
 */
export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){
            if(f.fbq)return;
            n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
            t=b.createElement(e);t.async=!0;t.src=v;
            s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
          }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          var pmUebinar = ${JSON.stringify(UEBINAR_HOSTS)}.indexOf(location.hostname) !== -1 || location.pathname === '${UEBINAR_PATH}';
          fbq('init', pmUebinar ? '${UEBINAR_PIXEL_ID}' : '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
