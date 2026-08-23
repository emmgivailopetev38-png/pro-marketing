import { listContacts } from "@/lib/crm/list-read";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * „Панчев" → един конкретен ред в базата.
 *
 * По телефона никой не диктува UUID. Затова всеки инструмент, който пипа
 * контакт, минава оттук. Когато има повече от едно съвпадение, НЕ се избира
 * първото — връща се въпрос, който агентът да зададе. Тихият избор на грешен
 * човек е най-трудната за забелязване грешка в CRM.
 */
export type Resolved =
  | { ok: true; id: string; name: string; company: string | null; email: string | null; phone: string | null }
  | { ok: false; spoken: string; candidates?: { id: string; name: string; company: string | null }[] };

export async function resolveContact(args: { contact_id?: string; q?: string }): Promise<Resolved> {
  if (args.contact_id) {
    const { data } = await createServiceClient()
      .from("contacts")
      .select("id, full_name, company, email, phone")
      .eq("id", args.contact_id)
      .maybeSingle();
    if (data) return asResolved(data);
    return { ok: false, spoken: "Не намирам този контакт." };
  }

  const q = args.q?.trim();
  if (!q) return { ok: false, spoken: "Кажи за кого става дума — име, фирма или телефон." };

  const { items } = await listContacts({ q, limit: 5, offset: 0 });
  if (items.length === 0) return { ok: false, spoken: `Няма никой на име ${q} в CRM-а.` };
  if (items.length === 1) return asResolved(items[0]);

  // Точно съвпадение по цялото име бие частичните — „Иван Иванов" не бива да
  // задава въпрос само защото има и „Иван Петров".
  const exact = items.filter((c) => String(c.full_name ?? "").trim().toLowerCase() === q.toLowerCase());
  if (exact.length === 1) return asResolved(exact[0]);

  const candidates = items.map((c) => ({
    id: String(c.id),
    name: String(c.full_name ?? "без име"),
    company: (c.company as string | null) ?? null,
  }));
  return {
    ok: false,
    spoken:
      `Намерих ${candidates.length}: ` +
      candidates.map((c) => `${c.name}${c.company ? ` от ${c.company}` : ""}`).join(", ") +
      ". За кого точно?",
    candidates,
  };
}

function asResolved(c: Record<string, unknown>): Resolved {
  return {
    ok: true,
    id: String(c.id),
    name: String(c.full_name ?? "без име"),
    company: (c.company as string | null) ?? null,
    email: (c.email as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
  };
}
