// Pluggable AI providers for the chatbot. Selected via `CHATBOT_PROVIDER` env
// var. Default is `scripted` — a small rule-based responder that needs zero
// external services. Once Hermes / Anthropic / OpenAI keys are wired up,
// flipping the env var picks them up at runtime.

import type { ChatScope } from "./types";

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderInput {
  scope: ChatScope;
  /** Full message history (oldest first), including the new user message. */
  messages: ProviderMessage[];
  /** Optional knowledge-base context to ground the answer. */
  knowledge: string;
  /** What the bot is trying to do (e.g. "qualify the visitor for a booking"). */
  systemPersona: string;
}

export interface ProviderResult {
  reply: string;
  /** Estimate of input/output tokens for analytics; null if unknown. */
  tokens_in: number | null;
  tokens_out: number | null;
  model: string;
  latency_ms: number;
}

export type ChatProvider = (input: ProviderInput) => Promise<ProviderResult>;

// ─── Scripted (default fallback) ──────────────────────────────────────────
// Returns a brand-friendly canned reply with light keyword routing. Lets us
// ship the widget today and swap providers tomorrow without touching the
// widget or the API route.
function pickScripted(userMessage: string, knowledge: string): string {
  const m = userMessage.toLowerCase();
  if (/(цен|оферт|колко|стру|пакет)/.test(m)) {
    return [
              "Цените зависят от обхвата на автоматизацията — правим индивидуална оферта",
      "за пълна AI операционна система с CRM, имейли и интеграции.",
      "Кажи ми накратко с какъв бизнес работиш и ще ти изпратя точна оферта.",
    ].join(" ");
  }
  if (/(среща|консулт|запиши|booking|кога)/.test(m)) {
    return [
      "С удоволствие — резервирай безплатна 30-минутна консултация",
      "тук: promarketing.pw/booking. Виждаме се през Google Meet.",
      "Преди срещата ще те питам за бизнеса ти, за да ти подготвя конкретно решение.",
    ].join(" ");
  }
  if (/(услуг|какво прав|кои)/.test(m)) {
    return [
      "ProMarketing изгражда AI операционни системи за бизнеса —",
      "CRM с автоматичен lead pipeline, Meta/Google реклами с отчети,",
      "имейл и WhatsApp кампании, чатботове за сайта, content engine за социалните мрежи,",
      "и инфраструктура с Hermes агенти, които работят 24/7.",
    ].join(" ");
  }
  if (/(zdrast|здрав|хей|hi|hello|добър ден|здр)/.test(m)) {
    return "Здравей! Аз съм AI асистентът на ProMarketing. Какъв бизнес имаш и с какво да помогна — автоматизация, реклами, CRM?";
  }
  if (knowledge) {
    return `${knowledge}\n\nКажи ми повече за бизнеса си, за да ти препоръчам конкретен подход.`;
  }
  return [
    "Благодаря за съобщението. Кажи ми накратко с какъв бизнес работиш",
    "и какъв е основният проблем — пропуснати лидове, ръчни процеси, ниска конверсия?",
    "Така ще мога да предложа конкретна автоматизация.",
  ].join(" ");
}

export const scriptedProvider: ChatProvider = async ({ messages, knowledge }) => {
  const t0 = Date.now();
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const reply = pickScripted(lastUser?.content ?? "", knowledge);
  return {
    reply,
    tokens_in: null,
    tokens_out: null,
    model: "scripted-v1",
    latency_ms: Date.now() - t0,
  };
};

// ─── OpenAI provider ─────────────────────────────────────────────────────
// Uses Chat Completions API directly via fetch — no SDK dependency. Default
// model is gpt-4o-mini (cheap + good Bulgarian). Override via OPENAI_MODEL.
//
// If OPENAI_API_KEY is missing OR the request fails, we fall back to the
// scripted provider so the widget never goes silent on the user.

interface OpenAIChoice {
  message?: { content?: string | null };
}
interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}
interface OpenAIResponse {
  choices?: OpenAIChoice[];
  usage?: OpenAIUsage;
  error?: { message?: string };
}

export const openaiProvider: ChatProvider = async ({ messages, knowledge, systemPersona }) => {
  const t0 = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return scriptedProvider({ messages, knowledge, systemPersona, scope: "site_chatbot" });
  }
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  // Compose system prompt with knowledge baked in. We don't trust the model
  // to invent facts — knowledge slice is the source of truth.
  const systemContent = [
    systemPersona,
    knowledge ? `\n\nИНФОРМАЦИЯ ЗА АГЕНЦИЯТА И FAQ:\n${knowledge}` : "",
    `\n\nВАЖНИ ПРАВИЛА:`,
    `- Отговаряй кратко и точно (под 80 думи освен при директен въпрос).`,
    `- Не измисляй цени, факти или функции, които не са в информацията по-горе.`,
    `- Когато потребителят иска среща, попитай го за бизнеса му и кажи че ще му покажеш календара.`,
    `- Винаги на български. Без emoji освен при поздрав от потребителя.`,
  ].join("");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
      }),
    });
    const data = (await res.json()) as OpenAIResponse;
    if (!res.ok || !data.choices?.[0]?.message?.content) {
      throw new Error(data.error?.message ?? `OpenAI HTTP ${res.status}`);
    }
    return {
      reply: data.choices[0].message.content.trim(),
      tokens_in: data.usage?.prompt_tokens ?? null,
      tokens_out: data.usage?.completion_tokens ?? null,
      model,
      latency_ms: Date.now() - t0,
    };
  } catch {
    // Network/quota issues — fall back to scripted so the user still gets a reply.
    return scriptedProvider({ messages, knowledge, systemPersona, scope: "site_chatbot" });
  }
};

// ─── Resolver ─────────────────────────────────────────────────────────────
// `CHATBOT_PROVIDER` picks the active provider. Currently wired: `scripted`,
// `openai`. `hermes` and `anthropic` are placeholders that fall back to
// scripted until their adapters land.
export async function callChatProvider(input: ProviderInput): Promise<ProviderResult> {
  const provider = (process.env.CHATBOT_PROVIDER ?? "scripted").toLowerCase();
  switch (provider) {
    case "openai":
      return openaiProvider(input);
    case "hermes":
    case "anthropic":
    case "scripted":
    default:
      return scriptedProvider(input);
  }
}
