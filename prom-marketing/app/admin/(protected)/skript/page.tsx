import type { Metadata } from "next";
import { SkriptTrainer } from "@/components/admin/skript/SkriptTrainer";
import { listCallReviews, type CallReview } from "./actions";

export const metadata: Metadata = {
  // Персонална или клиентска страница — извън индекса нарочно.
  // robots.txt спира обхождането, но НЕ маха вече индексирана
  // страница; за това е нужен точно този етикет.
  robots: { index: false, follow: false },
  title: "Разговорът · тренажор",
};

export default async function SkriptPage() {
  let reviews: CallReview[] = [];
  try {
    reviews = await listCallReviews();
  } catch {
    // ако базата е недостъпна, страницата пак трябва да се учи
    reviews = [];
  }
  return <SkriptTrainer reviews={reviews} />;
}
