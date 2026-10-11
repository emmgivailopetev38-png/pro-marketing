import type { Metadata } from "next";

import { PageSchema } from "@/components/seo/PageSchema";
export const metadata: Metadata = {
  alternates: { canonical: "/strategii" },
  // Извън индекса от 06.10.2026: таблото е със симулирани данни и никоя индексирана
  // страница не води към него (сирак в decay.py три цикъла). Остава достъпно за хора.
  robots: { index: false, follow: true },
  title: "Лаборатория за стратегии",
  description:
    "72 маркетинг стратегии в непрекъснат тест: печелившите се скалират, губещите се спират без емоции. Демонстрационно табло със симулирани данни.",
};

export default function StrategiiLayout({ children }: { children: React.ReactNode }) {
    return (
    <>
      <PageSchema path="/strategii" name="Лаборатория за стратегии" description="Стратегии в тест на живо — какво работи и какво не, с реални числа." crumb="Стратегии" />
      {children}
    </>
  );
}
