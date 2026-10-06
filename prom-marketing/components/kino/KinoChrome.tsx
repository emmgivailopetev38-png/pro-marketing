import Link from "next/link";
import { KINO } from "@/lib/kino/config";
import { PmMark } from "@/components/landing/PmMark";

/** Горната лента на страниците на киното — марката и една дума вдясно. */
export function KinoTop({ right }: { right?: React.ReactNode }) {
  return (
    <div className="k-wrap">
      <header className="k-top">
        <Link href="/kino" className="k-brand" aria-label={`${KINO.title} · онлайн кино на Pro Marketing`}>
          <PmMark id="kino-top" className="k-brand-logo" />
          <span>
            Pro Marketing <span className="k-muted">· онлайн кино</span>
          </span>
        </Link>
        {right ?? <span className="k-pill">Вход свободен</span>}
      </header>
    </div>
  );
}

export function KinoFooter() {
  return (
    <footer className="k-footer">
      <div className="k-wrap k-footer-row">
        <span>
          © 2026 ПроМаркетинг ЕООД · „{KINO.title}“ е направен изцяло с изкуствен интелект — картината, музиката и гласът.
        </span>
        <span style={{ display: "flex", gap: 16 }}>
          <Link href="/privacy">Поверителност</Link>
          <Link href="/terms">Условия</Link>
          <Link href="/">promarketing.pw</Link>
        </span>
      </div>
    </footer>
  );
}
