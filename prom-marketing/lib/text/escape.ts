// Единственото място за екраниране на текст във HTML (имейли, Telegram, страници).
// Имена на лийдове, съобщения, фирми и имена на реклами идват отвън и никога не
// се слагат суров в HTML (фишинг / вмъкване на маркъп). Само за HTML — в
// текстовите (plain) тела на писмата остава суровата стойност.
export function escapeHtml(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
