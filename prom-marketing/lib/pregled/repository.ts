import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { AnswerInput, AnswerRow, ReviewItem, ReviewRow } from "./types";
import { isValidKey } from "./types";

/**
 * Достъп до client_reviews / client_review_answers през service role.
 * Всичко тук приема ключа от URL-а като единствен достъп, затова първата
 * проверка навсякъде е isValidKey — нищо друго не стига до заявка.
 */

export interface LoadedReview {
  review: ReviewRow;
  answers: AnswerRow[];
}

export async function loadReview(key: string): Promise<LoadedReview | null> {
  if (!isValidKey(key)) return null;
  const sb = createServiceClient();
  const { data: review, error } = await sb
    .from("client_reviews")
    .select(
      "id, key, contact_id, client_name, title, intro, items, view_count, last_seen_at, submit_count, submitted_at, general_comment"
    )
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error("[pregled] review lookup failed:", error.message);
    return null;
  }
  if (!review) return null;

  const { data: answers, error: aErr } = await sb
    .from("client_review_answers")
    .select("item_code, verdict, comment, updated_at")
    .eq("review_id", review.id);
  if (aErr) {
    console.error("[pregled] answers lookup failed:", aErr.message);
  }

  const items = Array.isArray(review.items) ? (review.items as ReviewItem[]) : [];
  return {
    review: { ...(review as Omit<ReviewRow, "items">), items },
    answers: (answers ?? []) as AnswerRow[],
  };
}

/** Броячът на отваряния — не пише в CRM-а (там влиза само изпратеният избор). */
export async function touchView(reviewId: string, viewCount: number): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("client_reviews")
    .update({ view_count: viewCount + 1, last_seen_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) console.error("[pregled] touchView failed:", error.message);
}

/**
 * Записва отговорите. Кодове, които не са в пакета, се изпускат мълчаливо —
 * клиентът не може да „измисли“ клип. Връща колко реда са записани.
 */
export async function upsertAnswers(
  reviewId: string,
  items: ReviewItem[],
  answers: AnswerInput[]
): Promise<{ saved: number; error: string | null }> {
  const known = new Set(items.map((i) => i.code));
  const now = new Date().toISOString();
  const rows = answers
    .filter((a) => known.has(a.code))
    .map((a) => ({
      review_id: reviewId,
      item_code: a.code,
      verdict: a.verdict,
      comment: a.comment.trim().slice(0, 1500) || null,
      updated_at: now,
    }));
  if (!rows.length) return { saved: 0, error: null };

  const sb = createServiceClient();
  const { error } = await sb
    .from("client_review_answers")
    .upsert(rows, { onConflict: "review_id,item_code" });
  if (error) {
    console.error("[pregled] upsert answers failed:", error.message);
    return { saved: 0, error: error.message };
  }
  return { saved: rows.length, error: null };
}

/** Общите насоки — едно поле за целия пакет, записва се като бележките: при пауза в писането. */
export async function saveGeneralComment(reviewId: string, text: string): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("client_reviews")
    .update({ general_comment: text.trim().slice(0, 3000) || null, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) {
    console.error("[pregled] saveGeneralComment failed:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

export async function markSubmitted(reviewId: string, submitCount: number): Promise<void> {
  const sb = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await sb
    .from("client_reviews")
    .update({ submit_count: submitCount + 1, submitted_at: now, updated_at: now })
    .eq("id", reviewId);
  if (error) console.error("[pregled] markSubmitted failed:", error.message);
}
