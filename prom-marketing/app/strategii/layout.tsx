import type { Metadata } from "next";

import { PageSchema } from "@/components/seo/PageSchema";
export const metadata: Metadata = {
  alternates: { canonical: "/strategii" },
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
