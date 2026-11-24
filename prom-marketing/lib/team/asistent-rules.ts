/**
 * Малките решения на AI асистента — чисти функции, без база и без модел.
 *
 * Целта е скорост: човекът пита по време на разговор и чака. Затова тежкото
 * (числата му от CRM-а, по-дълбокото мислене на модела) се включва само когато
 * въпросът наистина го иска.
 */

/** Въпросът е за собствените числа (обаждания, срещи, класация) → зареждат се от CRM-а. */
export function wantsNumbers(question: string): boolean {
  return /числ|статист|класаци|напредък|оборот|явяван|show\s?rate|\bdq\b|колко\s+(обаждан|срещ|сделк|лийд|съм|имам|записах|ми\b)|как\s+(се\s+)?(справям|вървя)/i.test(question);
}

/**
 * Кратък въпрос за реплика, цена или „как се прави“ → бърз отговор без дълго мислене.
 * Писане на по-дълъг текст (съобщение, имейл, скрипт, план) → с повече мислене.
 */
export function quickQuestion(question: string): boolean {
  return question.trim().length <= 160 && !/напиши|съобщение|имейл|скрипт|план|сравни|анализ/i.test(question);
}

/**
 * „Застраховани“ опити: тръгва първият; ако не е отговорил до `staggerMs`, тръгва и
 * следващият, БЕЗ първият да се спира — печели който отговори пръв. Грешка на един пуска
 * следващия веднага. Така претоварен модел не изяжда времето на всички, а почти готов
 * отговор не се хвърля (на 24.11.2026 трите опита с таван изтекоха един след друг).
 */
export function hedged<T>(count: number, start: (index: number) => Promise<T>, opts: { staggerMs: number; budgetMs: number }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (count <= 0) {
      reject(new Error("Няма какво да се пусне."));
      return;
    }
    let next = 0;
    let pending = 0;
    let settled = false;
    let lastError: unknown = null;
    let stagger: ReturnType<typeof setTimeout> | null = null;
    let budget: ReturnType<typeof setTimeout> | null = null;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (stagger) clearTimeout(stagger);
      if (budget) clearTimeout(budget);
      fn();
    };
    const launch = () => {
      if (settled || next >= count) return;
      const i = next++;
      pending++;
      if (stagger) clearTimeout(stagger);
      stagger = next < count ? setTimeout(launch, opts.staggerMs) : null;
      start(i).then(
        (value) => finish(() => resolve(value)),
        (error) => {
          lastError = error;
          pending--;
          if (settled) return;
          if (next < count) launch();
          else if (pending === 0) finish(() => reject(lastError));
        },
      );
    };
    budget = setTimeout(() => finish(() => reject(lastError ?? new Error("Времето за отговор изтече."))), opts.budgetMs);
    launch();
  });
}
