import { Syne } from "next/font/google";
import type { Metadata } from "next";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-editorial",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "За Taste of Bulgaria · AI операционна система за храни и онлайн магазин",
  description:
    "Персонална презентация за AI автоматизация на хранителна фирма с онлайн магазин — авто-публикуване в социалните мрежи, имейл център, документи, плащания, склад.",
  robots: { index: false, follow: false },
};

export default function TasteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} oferta-theme min-h-screen`}
      style={
        {
          "--color-bg-void": "#1a0a05",
          "--color-bg-deep": "#2a1208",
          "--color-bg-glass": "rgba(42, 18, 8, 0.75)",
          "--color-orange": "#f97316",
          "--color-orange-bright": "#fb923c",
          "--color-gold": "#facc15",
          "--color-gold-bright": "#fde047",
          "--color-red": "#dc2626",
          "--color-text-primary": "#fef3c7",
          "--color-text-secondary": "#fcd34d",
          "--color-text-tertiary": "#a16207",
          "--color-border-default": "rgba(249, 115, 22, 0.14)",
          "--color-border-bright": "rgba(249, 115, 22, 0.34)",
          background: "#1a0a05",
          color: "#fef3c7",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
