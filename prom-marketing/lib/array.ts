/** Реже списък на парчета по `size` елемента (за `.in(...)` заявки с дълги списъци). */
export function chunks<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
