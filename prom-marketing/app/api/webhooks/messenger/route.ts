import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyMessengerSignature } from "@/lib/messenger/signature";
import { sendMessengerText, fetchMessengerUserProfile } from "@/lib/messenger/graph";
import { callChatProvider, type ProviderMessage } from "@/lib/chatbot/providers";
import { qualifyTurn } from "@/lib/chatbot/qualifier";
import { upsertContactAndLog } from "@/lib/contacts/repository";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = [
  `Ти си AI асистентът на ProMarketing в Messenger. Говориш на български, кратко и приятелски (1-2 изречения).`,
  `Цел: разбираш бизнеса на човека, какво автоматизира иска, и уговаряш безплатна 30-мин среща.`,
  `Не пращай линкове в първите 2 съобщения — клиентът току що влиза. Питай първо.`,
    `Цени: никога не давай числа — казвай, че офертата е индивидуална след кратък разговор.`,
  `Когато потребителят се съгласи на среща, прати линк promarketing.pw/booking.`,
].join(" ");

// ─── Webhook verification (GET) ──────────────────────────────────────────
// Meta calls this once when you set the callback URL in the App dashboard.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Look up the page that registered this token. We support multiple pages —
  // each has its own verify token stored in meta_pages.webhook_verify_token.
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("meta_pages")
    .select("id")
    .eq("webhook_verify_token", token)
    .maybeSingle();

  if (!data) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  // Meta requires echoing the challenge as plain text.
  return new NextResponse(challenge, { status: 200 });
}

// ─── Inbound events (POST) ───────────────────────────────────────────────
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!verifyMessengerSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createServiceClient();
  let payload: MessengerWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MessengerWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "page") {
    // Instagram DM uses object="instagram" — we'll handle it the same way later.
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Process each entry. Meta batches events; we never want a single bad event
  // to block the rest, so we collect promises and Promise.allSettled at the end.
  const work: Array<Promise<unknown>> = [];
  for (const entry of payload.entry ?? []) {
    const pageId = entry.id;
    for (const messagingEvent of entry.messaging ?? []) {
      // Skip our own echoes — Meta sends them when "echo" is subscribed.
      if (messagingEvent.message?.is_echo) continue;
      if (!messagingEvent.message?.text) continue; // Ignore non-text for now.
      work.push(handleMessage(supabase, pageId, messagingEvent));
    }
  }

  await Promise.allSettled(work);

  // Always 200 — Meta retries non-2xx aggressively, and a failing reply
  // shouldn't block the next message.
  return NextResponse.json({ ok: true });
}

async function handleMessage(
  supabase: ReturnType<typeof createServiceClient>,
  pageId: string,
  evt: MessengerEvent
) {
  const psid = evt.sender.id;
  const text = evt.message?.text ?? "";
  const tsIso = new Date(evt.timestamp ?? Date.now()).toISOString();

  // Find the page record. If we don't know this page, log + bail.
  const { data: page } = await supabase
    .from("meta_pages")
    .select("id, page_id, page_name, access_token, status")
    .eq("page_id", pageId)
    .maybeSingle();

  if (!page || page.status !== "connected" || !page.access_token) {
    return;
  }

  // Conversation key = (page_id, psid). Try to find or create.
  const { data: existing } = await supabase
    .from("chatbot_conversations")
    .select("id, status, visitor_name, visitor_email, visitor_phone, contact_id, qualification_score")
    .eq("meta_page_id", page.id)
    .eq("external_user_id", psid)
    .maybeSingle();

  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
    await supabase
      .from("chatbot_conversations")
      .update({ last_message_at: tsIso })
      .eq("id", conversationId);
  } else {
    // Fetch the user's public profile (name + pic) for nicer CRM display.
    const profile = await fetchMessengerUserProfile(page.access_token, psid);
    const sessionId = `fb:${pageId}:${psid}`;
    const insertRes = await supabase
      .from("chatbot_conversations")
      .insert({
        scope: "sales_bot",
        channel: "facebook_messenger",
        session_id: sessionId,
        meta_page_id: page.id,
        external_user_id: psid,
        visitor_name: profile?.name ?? null,
        meta: { profile_pic: profile?.profile_pic, locale: profile?.locale },
        status: "open",
        started_at: tsIso,
        last_message_at: tsIso,
      })
      .select("id")
      .single();
    if (insertRes.error || !insertRes.data) return;
    conversationId = insertRes.data.id;
  }

  // Persist the inbound message.
  await supabase.from("chatbot_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: text,
    metadata: { source: "messenger", external_message_id: evt.message?.mid },
    created_at: tsIso,
  });

  // Build history (last 20 turns) for the model.
  const { data: prior } = await supabase
    .from("chatbot_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history: ProviderMessage[] = ((prior ?? []) as Array<{ role: string; content: string }>).map(
    (m) => ({
      role: (m.role === "user" || m.role === "assistant" || m.role === "system" ? m.role : "user") as ProviderMessage["role"],
      content: m.content,
    })
  );

  // Pull lean knowledge for grounded answers.
  const { data: kb } = await supabase
    .from("chatbot_knowledge")
    .select("title, answer")
    .eq("scope", "sales_bot")
    .eq("enabled", true)
    .order("priority", { ascending: false })
    .limit(6);
  const knowledge = (kb ?? []).map((k) => `• ${k.title}: ${k.answer}`).join("\n");

  const result = await callChatProvider({
    scope: "sales_bot",
    messages: history,
    knowledge,
    systemPersona: SYSTEM_PROMPT,
  });

  // Save assistant turn before sending so we never lose it on a network blip.
  await supabase.from("chatbot_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: result.reply,
    model: result.model,
    tokens_in: result.tokens_in,
    tokens_out: result.tokens_out,
    latency_ms: result.latency_ms,
  });

  // Send the reply via Meta Graph. Failures are logged silently — the user
  // sees a missed reply rather than a 500.
  try {
    await sendMessengerText({
      pageAccessToken: page.access_token,
      recipientPsid: psid,
      text: result.reply,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase
      .from("chatbot_messages")
      .update({ metadata: { send_error: message } })
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1);
  }

  // Update last_message_at on the page row for the admin overview.
  await supabase.from("meta_pages").update({ last_message_at: new Date().toISOString() }).eq("id", page.id);

  // Qualify + maybe promote to CRM (Messenger rarely shares email upfront,
  // so promotion happens when the user volunteers it in the conversation).
  const visitor = {
    name: existing?.visitor_name ?? null,
    email: existing?.visitor_email ?? null,
    phone: existing?.visitor_phone ?? null,
  };
  const qual = qualifyTurn({
    scope: "sales_bot",
    message: text,
    userTurns: history.filter((h) => h.role === "user").length,
    visitor,
  });

  await supabase
    .from("chatbot_conversations")
    .update({
      qualification_score: qual.score,
      status: qual.qualified ? "qualified" : "open",
    })
    .eq("id", conversationId);

  if (qual.qualified && (visitor.email || visitor.phone)) {
    await upsertContactAndLog({
      full_name: visitor.name,
      email: visitor.email,
      phone: visitor.phone,
      source: "facebook_messenger",
      source_ref: conversationId,
      initial_stage: "contacted",
      activity: {
        type: "chatbot",
        title: `Messenger разговор · ${page.page_name}`,
        body: `Първо съобщение: ${text.slice(0, 200)}`,
        metadata: {
          conversation_id: conversationId,
          qualification_score: qual.score,
          page_id: pageId,
          psid,
        },
        dedupe_key: `messenger:${conversationId}`,
      },
    }).catch(() => null);
  }
}

// ─── Types — only the fields we touch ────────────────────────────────────
interface MessengerWebhookPayload {
  object: string;
  entry?: MessengerEntry[];
}
interface MessengerEntry {
  id: string;
  time?: number;
  messaging?: MessengerEvent[];
}
interface MessengerEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
  postback?: { payload: string; title?: string };
}
