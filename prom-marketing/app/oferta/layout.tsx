import { OfferViewTracker } from "@/components/tracking/OfferViewTracker";

/**
 * Общ layout за всички /oferta/* страници: добавя view beacon-а, който
 * сам премества офертата в „виждана" в CRM-а. Вътрешните per-оферта
 * layout-и остават непокътнати (Next ги влага).
 */
export default function OfertaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OfferViewTracker />
    </>
  );
}
