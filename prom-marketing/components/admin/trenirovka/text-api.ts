export async function textRequest<T>(body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/trening/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: body.action === "answer",
    });
  } catch {
    throw new Error("Връзката прекъсна. Провери интернет връзката и опитай отново.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("Входът ти е изтекъл. Влез отново в админ панела и опитай пак.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Не успяхме да запишем тренировката. Опитай отново.");
  }
  return data as T;
}

export const trainingButton =
  "min-h-16 min-w-16 rounded-xl border border-[var(--color-border-default)] px-5 py-4 text-base font-semibold transition-colors hover:border-[var(--color-accent-cyan)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 disabled:cursor-wait disabled:opacity-50 touch-manipulation";

export const trainingPrimary = `${trainingButton} bg-cyan-300 text-slate-950 hover:bg-cyan-200`;
