/**
 * Демо достъпът на екипа до /admin (23.10.2026, клоузърът Джордж).
 *
 * Човек от екипа с модул `demo` може да отвори САМО тези страници — те са
 * за показване пред клиент и не носят числата на фирмата: JARVIS и
 * Палубата получават измислена снимка (lib/admin/demo-data.ts), Гласовото
 * демо е измисленият автосервиз. Всичко друго под /admin остава само за
 * собственика. Списъкът е нарочно изброен, не шаблон — нова страница влиза
 * тук с ръка.
 */
export const DEMO_ADMIN_PATHS = ["/admin/jarvis", "/admin/deck", "/admin/demo-glas"] as const;

export function isDemoAdminPath(path: string): boolean {
  const p = path.replace(/\/+$/, "") || "/";
  return (DEMO_ADMIN_PATHS as readonly string[]).includes(p);
}
