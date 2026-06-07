import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { callChatProvider, type ProviderMessage } from "@/lib/chatbot/providers";
import { buildCrmSnapshot } from "@/lib/crm/snapshot";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  /** Optional context — page slug, contact id, etc. */
  context: z
    .object({
      page: z.string().optional(),
      contact_id: z.string().uuid().optional(),
      contact_name: z.string().optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .optional(),
});

const SYSTEM = [
  "Ти си вътрешният AI co-pilot на ProMarketing CRM. Работиш за управителя Ивайло.",
  "Имаш ЖИВА СНИМКА на CRM данните по-долу — ползвай точните числа и имена ОТ НЕЯ в отговорите. Не измисляй данни.",
  "Винаги отговаряй на български, кратко и по същество. Може ✓ за потвърждение.",
  "За четене/анализ (кой да чуя, колко неплатени, кои са топ сделките) — отговаряй директно с реалните числа от снимката.",
  "За ДЕЙСТВИЯ които променят данни или пращат имейли — кажи какво ще стане; изпълнението идва когато Hermes агентите са свързани.",
  "Спестявай му време. Предлагай конкретна следваща стъпка.",
].join(" ");

// Detect intents the scripted bot can confidently handle and reply with what
// would actually happen. Real execution lives in dedicated endpoints — this
// route is the conversational shell.
function intentReply(
  msg: string,
  ctx?: { contact_name?: string; page?: string; contact_id?: string }
): string | null {
  const m = msg.toLowerCase();
  const name = ctx?.contact_name;
  const onContact = !!ctx?.contact_id;

  // Order matters: more specific intents first. The "stale clients" check
  // must run before "add contact" because both mention клиент/лид.
  if (/(промени|смени|премести|set)\s*(.*)?(етап|стадий|stage|stadium)/i.test(m)) {
    return `✓ Готов съм да премествам стадии${name ? ` за ${name}` : ""}. Кажи целевия етап — напр. 'на преговори' или 'спечелен'. Когато Hermes е свързан, ще го прави с едно изречение.`;
  }
  if (/(напиши|изпрати|съчини|drafт|подготви)\s*(.*)?\bимейл/i.test(m)) {
    return `✓ Ще подготвя чернова${name ? ` за ${name}` : ""}. Засега я виждаш в /admin/email преди да я пратиш. С Hermes от утре — пише и изпраща сам след одобрение.`;
  }
  if (/(добав|нов|създай)\s*(.*)?(контакт|клиент|лид)/i.test(m)) {
    return `✓ За нов контакт — натисни '+ Контакт' долу вдясно (или Ctrl+Shift+K). Лепиш име, имейл, телефон, и какво каза. Аз ще го запиша автоматично с източник 'manual'.`;
  }
  if (/(среща|booking|резервац)/i.test(m)) {
    return `✓ За нова среща — изпрати на клиента линк promarketing.pw/booking. Cal.com webhook автоматично създава контакт и Google Meet линк.`;
  }
  if (/(анализ|отчет|статистик|repор)/i.test(m)) {
    return onContact
      ? `✓ Анализ за ${name}: ще ти подготвя обобщение на всички активности и последна тенденция. Може и да предложа следваща стъпка.`
      : `✓ Кой период — последните 7 дни, месец, тримесечие? И за кой канал — Meta, имейл, срещи?`;
  }
  if (/(здрав|здр|hey|hi|hello|добро\s*утро)/i.test(m)) {
    return `Здравей! Аз съм AI co-pilot на CRM-а. Пиши ми като на колега — 'напиши имейл', 'кои клиенти забравих', 'смени етап', или каквото е нужно.`;
  }
  return null;
}

export async function POST(request: Request) {
  // Same-cookie auth as the rest of /admin — no extra tokens.
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? null;
  if (!verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { message, context, history } = parsed.data;

  // 1) Try a rule-based reply for fast, confident actions.
  const intent = intentReply(message, context);
  if (intent) {
    return NextResponse.json({ reply: intent, source: "intent" });
  }

  // 2) Fall back to the same chat provider pipeline used by the site bot.
  const messages: ProviderMessage[] = [
    ...(history ?? []).map((m) => ({ role: m.role as ProviderMessage["role"], content: m.content })),
    { role: "user", content: message },
  ];

  // Bring in light context — pull the contact row so the assistant grounds
  // answers in real CRM data when there's a contact_id.
  let knowledge = await buildCrmSnapshot().catch(() => "");
  if (context?.contact_id) {
    const supabase = createServiceClient();
    const { data: contact } = await supabase
      .from("contacts")
      .select("full_name, email, phone, company, stage, deal_value_eur, notes, next_followup_at")
      .eq("id", context.contact_id)
      .maybeSingle();
    if (contact) {
      knowledge +=
        `\n\nФОКУС КОНТАКТ: ${contact.full_name ?? "—"} (${contact.email ?? "—"})\n` +
        `Компания: ${contact.company ?? "—"} · Етап: ${contact.stage} · Сделка €${contact.deal_value_eur ?? 0}\n` +
        (contact.notes ? `Бележки: ${contact.notes}\n` : "") +
        (contact.next_followup_at ? `Следваща стъпка: ${contact.next_followup_at}\n` : "");
    }
  }

  const result = await callChatProvider({
    scope: "site_chatbot", // reuse the same provider routing
    messages,
    knowledge,
    systemPersona: SYSTEM,
  });

  return NextResponse.json({ reply: result.reply, source: result.model, latency_ms: result.latency_ms });
}
