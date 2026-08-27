"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";

export type CallReview = {
  id: string;
  call_date: string;
  client_name: string | null;
  channel: string;
  reached_stage: string | null;
  client_words: string | null;
  client_number: string | null;
  root_cause: string | null;
  client_picture: string | null;
  objections: string[];
  outcome: string;
  deal_value: number | null;
  next_step: string | null;
  next_step_at: string | null;
  prep: Record<string, boolean>;
  scores: Record<string, number>;
  avg_score: number | null;
  lesson: string | null;
  notes: string | null;
};

export type ReviewInput = {
  call_date: string;
  client_name: string;
  channel: string;
  reached_stage: string;
  client_words: string;
  client_number: string;
  root_cause: string;
  client_picture: string;
  objections: string[];
  outcome: string;
  deal_value: string;
  next_step: string;
  next_step_at: string;
  prep: Record<string, boolean>;
  scores: Record<string, number>;
  lesson: string;
  notes: string;
};

function toNumberOrNull(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toDateOrNull(v: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Записва разбора на един разговор. Връща id-то на записа. */
export async function saveCallReview(input: ReviewInput): Promise<{ id: string }> {
  await requireAdmin();

  const filled = Object.values(input.scores ?? {}).filter((v) => v > 0);
  const avg = filled.length
    ? Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10
    : null;

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sales_call_reviews")
    .insert({
      call_date: toDateOrNull(input.call_date) ?? new Date().toISOString().slice(0, 10),
      client_name: input.client_name.trim() || null,
      channel: input.channel || "onlain",
      reached_stage: input.reached_stage || null,
      client_words: input.client_words.trim() || null,
      client_number: input.client_number.trim() || null,
      root_cause: input.root_cause.trim() || null,
      client_picture: input.client_picture.trim() || null,
      objections: input.objections ?? [],
      outcome: input.outcome || "sledvashta_stapka",
      deal_value: toNumberOrNull(input.deal_value),
      next_step: input.next_step.trim() || null,
      next_step_at: toDateOrNull(input.next_step_at),
      prep: input.prep ?? {},
      scores: input.scores ?? {},
      avg_score: avg,
      lesson: input.lesson.trim() || null,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Записът не мина: ${error.message}`);
  revalidatePath("/admin/skript");
  return { id: data.id as string };
}

export async function deleteCallReview(id: string): Promise<void> {
  await requireAdmin();
  const svc = createServiceClient();
  const { error } = await svc.from("sales_call_reviews").delete().eq("id", id);
  if (error) throw new Error(`Изтриването не мина: ${error.message}`);
  revalidatePath("/admin/skript");
}

/** Последните разбори, най-новият отгоре. */
export async function listCallReviews(limit = 60): Promise<CallReview[]> {
  await requireAdmin();
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sales_call_reviews")
    .select("*")
    .order("call_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as CallReview[];
}
