/**
 * PostgREST връща най-много 1000 реда на заявка (max-rows) — `.limit(20000)` не
 * помага и отрязва ТИХО: заявката изглежда успешна, само числата са грешни.
 * (26.09.2026: 3 532 студени фирми, а броячите в /admin/studeni показаха 1000.)
 * Тук заявката се прави на страници по 1000 — с `.order(...)` за стабилен ред —
 * докато страницата излезе непълна.
 */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function allRows<T>(page: (from: number, to: number) => Page<T>, max = 100_000): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; from < max; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { rows, error: null };
}
