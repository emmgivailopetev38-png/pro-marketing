import type { Metadata } from "next";
import { SkriptTrainer } from "@/components/admin/skript/SkriptTrainer";
import { listCallReviews, type CallReview } from "./actions";

export const metadata: Metadata = {
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
