"use client";

/** „Запази като PDF“ — отваря печата на браузъра; стиловете за печат махат менютата и бутоните. */
export function PrintButton({ dark = false }: { dark?: boolean }) {
  return (
    <button type="button" className={`pd-ghost${dark ? " pd-ghost-dark" : ""}`} onClick={() => window.print()}>
      <span aria-hidden>⤓</span> Запази като PDF
    </button>
  );
}
