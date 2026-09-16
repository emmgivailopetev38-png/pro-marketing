import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Звънене",
  robots: { index: false, follow: false },
};

/**
 * Зоната на екипа. Без админ обвивката: човекът за срещите отваря това от
 * телефона си между два разговора — трябват му списъкът и бутоните, нищо друго.
 */
export default function EkipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)]">{children}</div>
  );
}
