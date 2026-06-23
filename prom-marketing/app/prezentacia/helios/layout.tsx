import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProMarketing · AI операционна система за соларни компании",
  description:
    "Поверителна презентация — автономна система с изкуствен интелект за оферти, мониторинг на обекти и енергийна оптимизация на фотоволтаични паркове.",
  robots: { index: false, follow: false },
};

export default function HeliosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="helios-root"
      style={
        {
          "--h-bg": "#070b12",
          "--h-bg2": "#0c1320",
          "--h-panel": "rgba(255,255,255,0.035)",
          "--h-panel2": "rgba(255,255,255,0.06)",
          "--h-line": "rgba(255,255,255,0.09)",
          "--h-gold": "#ffb020",
          "--h-amber": "#ff7a1a",
          "--h-lime": "#9bff4d",
          "--h-cyan": "#33d6ff",
          "--h-red": "#ff4d5e",
          "--h-text": "#eef4ff",
          "--h-dim": "#9fb1c6",
          "--h-faint": "#5f7389",
          background:
            "radial-gradient(1200px 700px at 78% -8%, rgba(255,176,32,0.16), transparent 60%)," +
            "radial-gradient(1000px 600px at 0% 12%, rgba(51,214,255,0.08), transparent 55%)," +
            "var(--h-bg)",
          color: "var(--h-text)",
          minHeight: "100vh",
          fontFamily: "var(--font-body, system-ui, sans-serif)",
          overflowX: "hidden",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
