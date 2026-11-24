import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProMarketing CRM · екип",
  robots: { index: false, follow: false },
};

/**
 * Зоната на екипа. На телефон — само списъкът и бутоните; на компютър — меню
 * вляво като в истински CRM. Отстъпът вляво се включва само когато страницата
 * има меню (входът и поканата нямат), през `has-[.ekip-sidebar]`.
 */
export default function EkipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] lg:has-[.ekip-sidebar]:pl-60">{children}</div>
  );
}
