"use client";
import { useEffect, useRef } from "react";

/**
 * „Магнитният" бутон — леко следва курсора, когато е наблизо.
 *
 * До 05.09.2026 всеки бутон си слагаше СОБСТВЕН слушател на mousemove и
 * четеше getBoundingClientRect при всяко движение — с шест бутона в героя
 * това са шест layout-четения на всяко от стотиците събития в секунда.
 * Сега има един слушател за всички, а сметката върви веднъж на кадър.
 */
interface Target {
  el: HTMLElement;
  strength: number;
  radius: number;
}

const targets = new Set<Target>();
let listening = false;
let raf = 0;
let mx = -9999;
let my = -9999;

function apply() {
  raf = 0;
  for (const t of targets) {
    const rect = t.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const max = Math.max(rect.width, rect.height) / 2 + t.radius;
    if (Math.abs(dx) > max || Math.abs(dy) > max || Math.hypot(dx, dy) > max) {
      if (t.el.style.transform !== "translate3d(0,0,0)") t.el.style.transform = "translate3d(0,0,0)";
      continue;
    }
    t.el.style.transform = `translate3d(${dx * t.strength}px, ${dy * t.strength}px, 0)`;
  }
}

function onMove(e: MouseEvent) {
  mx = e.clientX;
  my = e.clientY;
  if (!raf) raf = requestAnimationFrame(apply);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("mousemove", onMove, { passive: true });
}
function unlisten() {
  if (!listening || targets.size > 0) return;
  listening = false;
  window.removeEventListener("mousemove", onMove);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

export function useMagnetic<T extends HTMLElement>(strength = 0.35, radius = 60) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Touch devices have no hover/cursor → skip the magnetic handler.
    if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return;
    if (strength === 0) return;

    const target: Target = { el, strength, radius };
    targets.add(target);
    listen();
    el.style.transition = "transform 250ms cubic-bezier(0.22, 1, 0.36, 1)";
    const onLeave = () => {
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("mouseleave", onLeave);

    return () => {
      targets.delete(target);
      el.removeEventListener("mouseleave", onLeave);
      unlisten();
    };
  }, [strength, radius]);

  return ref;
}
