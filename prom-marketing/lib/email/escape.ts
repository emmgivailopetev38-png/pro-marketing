// Escape user-provided values before interpolating them into HTML email bodies.
// Lead names, messages, company text and Meta campaign/ad names are attacker-
// controllable, so they must never be injected raw into HTML (phishing / markup
// injection). Use only for HTML — plain-text bodies should keep the raw value.
export function escapeHtml(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
