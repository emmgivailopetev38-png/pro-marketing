import { describe, it, expect } from "vitest";
import { escapeHtml } from "./escape";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>alert('x')&"</script>`)).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&amp;&quot;&lt;/script&gt;"
    );
  });

  it("returns an empty string for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("leaves safe Cyrillic text unchanged", () => {
    expect(escapeHtml("Иван Петров")).toBe("Иван Петров");
  });
});
