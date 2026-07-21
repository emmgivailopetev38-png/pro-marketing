import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { chatRequestSchema, chatReplySchema } from "@/lib/chatbot/types";
import { callChatProvider, type ProviderMessage } from "@/lib/chatbot/providers";
import { qualifyTurn, extractIdentity } from "@/lib/chatbot/qualifier";
import { upsertContactAndLog } from "@/lib/contacts/repository";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ти си AI асистентът на ProMarketing — българска агенция за AI автоматизации и маркетинг, основана от Ивайло Петев, базирана в Пловдив.

КАКВО ПРАВИ АГЕНЦИЯТА:
- AI чат агенти (Messenger, Instagram, WhatsApp, сайт)
- Личен AI CRM с автоматичен lead pipeline
- AI софтуер по поръчка (например пожарогасителен сервиз, бижутерия, ресторанти)
- Гласови AI агенти за обаждания
- Имейл и SMS автоматизация
- CRM интеграции (Salesforce, HubSpot, собствени системи)
- Квалификация на лидове с AI
- Генериране на съдържание (постове, Reels)
- Meta/Google реклами с автоматичен отчет

КАК РАБОТИ ПРОЦЕСЪТ:
1. Разговор — кратък безплатен 30-мин разговор за бизнеса
2. Дизайн — измисляме персонализирано решение
3. Изграждане — 30 дни средно за пълна система
4. Старт — инсталация на място + обучение + 30 дни безплатна поддръжка

ЦЕНИ (ориентир, без обвързване):
- Стартираме от около 2000€ без ДДС за пълна AI операционна система
- Точна цена след разговор и оферта
- Никога не казвай точни цени за конкретни модули — насочи към среща

ЗА КОГО:
Е-търговия · Имоти · Ресторанти · Медицински клиники · Юристи · Фитнес студия · B2B услуги · Сервизи · Туризъм

КОНТАКТ:
- Имейл: emmgivailopetev38@gmail.com
- Телефон: +359 877 399 963
- Локация: Пловдив, България
- Работно време: пон-пет 9:00 – 19:00

КАК ДА СЕ ДЪРЖИШ:
- Говориш на български, кратко (под 80 думи освен при директен въпрос).
- Питай за бизнеса на посетителя преди да предложиш решение.
- Когато човек иска СРЕЩА / КОНСУЛТАЦИЯ / РАЗГОВОР → кажи "Веднага ти показвам календара" — клиентът ще види embed-натия Cal.com.
- Никога не измисляй цени, функции или клиенти.
- Не споделяй други клиенти на агенцията.
- Без emoji, освен ако клиентът не започне.
- Ако не знаеш — предложи да се свърже на телефона или имейла.`;

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { sessionId, scope, channel, message, visitor: visitorInput, sourceUrl } = parsed.data;

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  // Pull or extract identity. Inline matches inside the user message take
  // priority over older client-supplied state — visitors often type their
  // email mid-conversation.
  const inline = extractIdentity(message);
  const visitor = {
    name: visitorInput?.name?.trim() || null,
    email: (inline.email ?? visitorInput?.email)?.toLowerCase().trim() || null,
    phone: (inline.phone ?? visitorInput?.phone)?.trim() || null,
  };

  // Upsert conversation row. We key on session_id only — conversations
  // outlive the session record while the visitor is around.
  const { data: existing } = await supabase
    .from("chatbot_conversations")
    .select("id, status, qualification_score, visitor_name, visitor_email, visitor_phone, contact_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  let conversationId: string;
  const storedVisitor = {
    name: existing?.visitor_name ?? visitor.name,
    email: existing?.visitor_email ?? visitor.email,
    phone: existing?.visitor_phone ?? visitor.phone,
  };
  // Inline identity from this turn always wins.
  if (visitor.email) storedVisitor.email = visitor.email;
  if (visitor.phone) storedVisitor.phone = visitor.phone;
  if (visitor.name) storedVisitor.name = visitor.name;

  if (existing) {
    conversationId = existing.id;
    await supabase
      .from("chatbot_conversations")
      .update({
        last_message_at: nowIso,
        visitor_name: storedVisitor.name,
        visitor_email: storedVisitor.email,
        visitor_phone: storedVisitor.phone,
      })
      .eq("id", conversationId);
  } else {
    const insertRes = await supabase
      .from("chatbot_conversations")
      .insert({
        scope,
        channel,
        session_id: sessionId,
        visitor_name: storedVisitor.name,
        visitor_email: storedVisitor.email,
        visitor_phone: storedVisitor.phone,
        source_url: sourceUrl ?? null,
        status: "open",
        started_at: nowIso,
        last_message_at: nowIso,
      })
      .select("id")
      .single();
    if (insertRes.error || !insertRes.data) {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    conversationId = insertRes.data.id;
  }

  // Load recent message history (last 20) for context.
  const { data: priorMessages } = await supabase
    .from("chatbot_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Record user turn before generating reply (so the LLM always sees the
  // freshest user message in history).
  await supabase.from("chatbot_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  const userTurns =
    (priorMessages ?? []).filter((m) => m.role === "user").length + 1;

  // Pull a small knowledge slice for the provider.
  const { data: kb } = await supabase
    .from("chatbot_knowledge")
    .select("title, answer")
    .eq("scope", scope)
    .eq("enabled", true)
    .order("priority", { ascending: false })
    .limit(6);
  const knowledge = (kb ?? [])
    .map((k) => `• ${k.title}: ${k.answer}`)
    .join("\n");

  const messages: ProviderMessage[] = [
    ...((priorMessages ?? []) as Array<{ role: string; content: string }>).map((m) => ({
      role: (m.role === "user" || m.role === "assistant" || m.role === "system"
        ? m.role
        : "user") as ProviderMessage["role"],
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const result = await callChatProvider({
    scope,
    messages,
    knowledge,
    systemPersona: SYSTEM_PROMPT,
  });

  await supabase.from("chatbot_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: result.reply,
    model: result.model,
    tokens_in: result.tokens_in,
    tokens_out: result.tokens_out,
    latency_ms: result.latency_ms,
  });

  const qual = qualifyTurn({
    scope,
    message,
    userTurns,
    visitor: storedVisitor,
  });

  // Determine next action based on intent.
  let action: "none" | "open_booking" | "open_contact_form" | "show_pricing" = "none";
  if (/среща|консулт|запиши|booking|кога/i.test(message)) action = "open_booking";
  else if (/цен|оферт|колко/i.test(message)) action = "show_pricing";
  else if (qual.qualified && !storedVisitor.email) action = "open_contact_form";

  // Update qualification + maybe promote to contact.
  let promoted = existing?.contact_id ?? null;
  if (qual.qualified && storedVisitor.email && !promoted) {
    const res = await upsertContactAndLog({
      full_name: storedVisitor.name,
      email: storedVisitor.email,
      phone: storedVisitor.phone,
      source: "site_chatbot",
      source_ref: conversationId,
      initial_stage: "contacted",
      activity: {
        type: "chatbot",
        title: `Чатбот разговор · ${scope}`,
        occurred_at: nowIso,
        body: `Първо съобщение: ${message.slice(0, 200)}`,
        metadata: {
          conversation_id: conversationId,
          qualification_score: qual.score,
          source_url: sourceUrl ?? null,
        },
        dedupe_key: `chatbot:${conversationId}`,
      },
    }).catch(() => null);
    promoted = res?.contact_id ?? null;
  }

  await supabase
    .from("chatbot_conversations")
    .update({
      qualification_score: qual.score,
      status: qual.qualified ? "qualified" : "open",
      contact_id: promoted,
    })
    .eq("id", conversationId);

  // Suggestion chips — light heuristic.
  const suggestions: string[] = [];
  if (action !== "open_booking") suggestions.push("Запиши среща");
  if (action !== "show_pricing") suggestions.push("Кажи цените");
  suggestions.push("Какво правите?");
  if (!storedVisitor.email && action !== "open_contact_form") suggestions.push("Изпрати ми оферта по имейл");

  const body = chatReplySchema.parse({
    reply: result.reply,
    qualified: qual.qualified,
    suggestions: suggestions.slice(0, 4),
    collect: qual.collect,
    action,
  });
  return NextResponse.json(body);
}
