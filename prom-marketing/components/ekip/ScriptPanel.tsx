/**
 * Скриптът за уговаряне на среща — това, което Ивайло каза на срещата на
 * 16.09.2026: разговор от 1–2 минути, който кара човека да говори; целта е
 * срещата с експерта, не продажба. Без цени — те се казват на срещата.
 */
export function ScriptPanel({ name = "[твоето име]" }: { name?: string }) {
  return (
    <details className="rounded-2xl border border-[var(--color-accent-cyan)]/25 bg-[var(--color-accent-cyan)]/5 p-4">
      <summary className="cursor-pointer select-none text-sm font-semibold text-[var(--color-accent-cyan)]">
        📋 Скриптът за разговора (1–2 минути) · разгъни
      </summary>
      <ol className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        <li>
          <b className="text-[var(--color-text-primary)]">1. Отваряне.</b> „Здравей, [име], {name} съм от ProMarketing.
          Оставил си телефона си на рекламата ни за [това, което е избрал във формата]. Имаш ли две минути?“
        </li>
        <li>
          <b className="text-[var(--color-text-primary)]">2. Болката — той говори, ти слушаш.</b> „С какво се занимаваш и
          какво най-много ти яде времето в момента?“ Не обяснявай услуги. Един въпрос, после тишина.
        </li>
        <li>
          <b className="text-[var(--color-text-primary)]">3. Мостът.</b> „Точно с това Ивайло помага — гледа конкретния
          бизнес и казва какво може да се автоматизира и как. Половин час онлайн, безплатно, без ангажимент.“
        </li>
        <li>
          <b className="text-[var(--color-text-primary)]">4. Срещата — с избор, не с въпрос „дали“.</b> „Кога ти е
          по-удобно — утре сутрин или следобед?“ Записваш веднага с бутона „Записах среща“ или в календара.
        </li>
        <li>
          <b className="text-[var(--color-text-primary)]">Ако каже „не помня / не се интересувам“.</b> „Разбирам. Оставил
          си телефона си на [дата] за [тема] — ако сега не е моментът, кога да ти звънна?“ и насрочваш.
        </li>
        <li>
          <b className="text-[var(--color-text-primary)]">Правилата.</b> Не казвай цени. Не продавай — уговаряш. Записвай
          дейността и една реплика от човека: така Ивайло влиза в срещата подготвен.
        </li>
      </ol>
    </details>
  );
}
