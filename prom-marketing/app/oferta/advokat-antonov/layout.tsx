import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "За адвокат Иван Антонов · AI секретар за кантората",
  description:
    "Секретар, който вдига телефона по всяко време, изслушва за какво става дума и записва часа за консултация — без да дава правен съвет и без достъп до нито едно Ваше досие.",
  robots: { index: false, follow: false },
};

export default function AdvokatAntonovLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="antonov-theme min-h-screen"
      style={
        {
          "--a-void": "#06080c",
          "--a-deep": "#0a0e15",
          "--a-card": "#111823",
          "--a-card-2": "#0e141d",
          "--a-line": "rgba(207, 175, 106, 0.15)",
          "--a-line-soft": "rgba(207, 175, 106, 0.07)",
          "--a-brass": "#cfa96a",
          "--a-brass-dim": "#8f7440",
          "--a-text": "#eef1f6",
          "--a-text-2": "#aab4c2",
          "--a-text-3": "#6d7989",
          background: "#06080c",
          color: "#eef1f6",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
