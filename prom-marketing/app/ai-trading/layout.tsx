import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Трейдинг Ботове — ProMarketing",
  description:
    "Кинематографично демо на AI трейдинг ботовете на ProMarketing — жива симулация как AI екип анализира пазарите 24/7. Симулирани данни с демонстрационна цел, не е инвестиционен съвет.",
};

export default function AiTradingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
