import type { Metadata } from "next";

export const metadata: Metadata = {
  // Персонална или клиентска страница — извън индекса нарочно.
  // robots.txt спира обхождането, но НЕ маха вече индексирана
  // страница; за това е нужен точно този етикет.
  robots: { index: false, follow: false },
  title: "AI Трейдинг Ботове",
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
