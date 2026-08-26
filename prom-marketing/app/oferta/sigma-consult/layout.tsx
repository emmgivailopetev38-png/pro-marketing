import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "За Сигма Консулт · AI асистент за видеа · ProMarketing",
  description:
    "Асистент, който прави видеата вместо вас — върху вашата музика и вашия глас, с одобрение от вас преди всяка публикация.",
  robots: { index: false, follow: false },
};

export default function SigmaConsultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="sigma-theme min-h-screen"
      style={
        {
          "--s-void": "#07090d",
          "--s-deep": "#0e131a",
          "--s-card": "#131a23",
          "--s-line": "rgba(233, 216, 190, 0.13)",
          "--s-line-soft": "rgba(233, 216, 190, 0.07)",
          "--s-amber": "#e0a458",
          "--s-amber-dim": "#a8763a",
          "--s-text": "#eef1f6",
          "--s-text-2": "#a9b3c1",
          "--s-text-3": "#6c7889",
          background: "#07090d",
          color: "#eef1f6",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
