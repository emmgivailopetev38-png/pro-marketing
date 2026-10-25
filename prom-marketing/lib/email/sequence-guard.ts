/**
 * Общият предпазител на автоматичните поредици (25.10.2026).
 *
 * Повод: на 25.10 топлият кръг и студената поредица тръгнаха към картони
 * „ДУБЛИКАТ …“ (служебни копия, не хора) и към загубен контакт (stage=lost).
 * Оттук нататък никоя автоматика не пише на:
 *   - картон с full_name, което започва с „ДУБЛИКАТ“ (без значение главни/малки);
 *   - stage `won` (клиент — говорим му лично) или `lost` (казал е „не“).
 * Ползва се и от warm-sequence.ts, и от lead-sequence.ts — едно място, една истина.
 */

export const AUTOMATION_EXCLUDED_STAGES: readonly string[] = ["won", "lost"];

export const DUPLICATE_PREFIX = "ДУБЛИКАТ";

/** Служебен картон-дубликат: full_name ilike 'ДУБЛИКАТ%'. */
export function isDuplicateCard(fullName: string | null | undefined): boolean {
  return (fullName ?? "").trimStart().toLocaleUpperCase("bg").startsWith(DUPLICATE_PREFIX);
}

export type AutomationSkip = "duplicate" | "stage_excluded";

/** Защо автоматиката мълчи за този картон — или null, ако може да му пише. */
export function automationSkipReason(c: {
  full_name?: string | null;
  stage?: string | null;
}): AutomationSkip | null {
  if (isDuplicateCard(c.full_name)) return "duplicate";
  if (c.stage && AUTOMATION_EXCLUDED_STAGES.includes(c.stage)) return "stage_excluded";
  return null;
}
