import type { Metadata } from "next";
import { LiniyataCeni } from "@/components/admin/liniyata/LiniyataCeni";

export const metadata: Metadata = {
  title: "Линията · цените",
  robots: { index: false, follow: false },
};

/**
 * „Линията“ — личната страница на Ивайло (06.11.2026), само за собственика:
 * /admin пуска единствено неговата сесия (lib/admin/session.ts → verifySession),
 * а страницата не е в демо достъпа на екипа (lib/admin/demo-paths.ts).
 *
 * Картината е от НЛП сесията с Ивета Николова: цените по една тънка линия,
 * малки и червени, въртят се в кръгчето; червени ограничители с ток ги
 * връщат, ако тръгнат нагоре. Тук вътре са всички до 50 000 € и 300 000 €/мес.
 */
export default function LiniyataPage() {
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">Само за теб · Ивайло</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Линията</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Цените, както ги подреди с Ивета на 06.11: малки, червени, въртят се в кръгчето. Вече всички — до 50 000 € и
            300 000 € на месец.
          </p>
        </header>
        <LiniyataCeni />
      </div>
    </div>
  );
}
