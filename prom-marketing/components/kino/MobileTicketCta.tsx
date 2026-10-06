"use client";
import { useEffect, useState } from "react";

/**
 * Лепкавото „Вземи безплатен билет“ на телефон: излиза, щом човекът
 * подмине героя, и се крие, когато билетната каса е на екрана.
 */
export function MobileTicketCta({ target = "bilet" }: { target?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const box = document.getElementById(target);
    let boxVisible = false;
    const update = () => setShow(window.scrollY > 520 && !boxVisible);
    const io = box
      ? new IntersectionObserver(
          ([e]) => {
            boxVisible = e.isIntersecting;
            update();
          },
          { rootMargin: "0px 0px -20% 0px" },
        )
      : null;
    if (box && io) io.observe(box);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [target]);
  if (!show) return null;
  return (
    <div className="k-mobile-cta">
      <a href={`#${target}`} className="k-btn k-btn--primary k-btn--block">
        🎟️ Вземи безплатен билет
      </a>
    </div>
  );
}
