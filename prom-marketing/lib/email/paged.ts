/**
 * Четене на ВСИЧКИ редове от Supabase, не само на първата страница.
 *
 * PostgREST връща най-много 1 000 реда на заявка и мълчи за останалите.
 * До 10.11.2026 топлият кръг четеше активностите на 300 души с една заявка
 * (4 263 реда) → виждаше само първите 1 000, „не знаеше“, че е пратил писмо,
 * и стоеше на първото писмо; не виждаше и част от отказите. Оттук нататък
 * всяка такава заявка минава през `readAllPages`.
 */

/** Колко реда връща Supabase на една страница. */
export const PAGE_SIZE = 1000;

/** Колко id-та в един `.in()` — иначе адресът на заявката става твърде дълъг. */
export const ID_CHUNK = 150;

type PageResult = { data: unknown[] | null; error: unknown };

/**
 * Чете страница след страница, докато една не излезе по-къса от пълната.
 * Грешка → хвърля: по-добре днес нищо, отколкото писмо, пратено без да знаем
 * историята на човека (кое е получил, дали се е отписал).
 */
export async function readAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult>,
  pageSize: number = PAGE_SIZE,
  maxPages = 200
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < maxPages; i++) {
    const from = i * pageSize;
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) {
      const msg = typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error);
      throw new Error(`readAllPages: ${msg}`);
    }
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) return out;
  }
  throw new Error(`readAllPages: повече от ${maxPages} страници — спирам, вместо да чета безкрай`);
}

/** Разделя списък на парчета по `size` (за `.in()` с много id-та). */
export function chunks<T>(items: readonly T[], size: number = ID_CHUNK): T[][] {
  if (size <= 0) throw new Error("chunks: size трябва да е > 0");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Имейл за сравнение: без интервали, малки букви. */
export function normEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}
