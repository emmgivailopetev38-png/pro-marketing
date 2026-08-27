import { createServiceClient } from "@/lib/supabase/service";

/* Разборите на разговорите — чист достъп до базата, без проверка кой пита.
   Пазенето на вратата е работа на извикващия: админските действия минават
   през requireAdmin, споделеният линк — през подписа си. */

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

/** Последните разбори, най-новият отгоре. */
export async function fetchCallReviews(limit = 60): Promise<CallReview[]> {
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
