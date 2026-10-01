"use client";
import { useEffect, useState } from "react";
import { openBookingPopup } from "@/lib/cal/embed";
import { track } from "@/lib/analytics/track";

// Mobile-only bottom-fixed CTA that appears after the user scrolls past the
// hero. Keeps booking 1 tap away on phones without taking up screen on desktop.

const SHOW_AFTER_PX = 600;

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handle = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <a
            href="tel:+359876447159"
            onClick={() => track("cta_clicked", { location: "mobile_sticky", target: "phone" })}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-cyan)]/40 bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]"
            aria-label="Обади се"
          >
            📞
          </a>
          <button
            type="button"
            onClick={() => {
              track("cta_clicked", { location: "mobile_sticky", target: "booking" });
              void openBookingPopup();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3 text-sm font-semibold text-[var(--color-bg-void)] shadow-[0_0_30px_rgba(6,182,212,0.4)]"
          >
            Запази безплатна консултация
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
