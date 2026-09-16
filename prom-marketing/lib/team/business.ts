import { BUSINESS_OPTIONS } from "./types";

/** „Услуги / кабинет / салон · фризьорски салон в Русе“ — опцията плюс уточнението. */
export function joinBusiness(option: string, detail: string): string | null {
  const opt = (BUSINESS_OPTIONS as readonly string[]).includes(option) ? option : "";
  const parts = [opt && opt !== "Друго" ? opt : "", detail.trim()].filter(Boolean);
  if (parts.length === 0) return opt === "Друго" ? "Друго" : null;
  return parts.join(" · ");
}
