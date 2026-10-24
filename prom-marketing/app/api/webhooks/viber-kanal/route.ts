import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Webhook за Viber канала „AI България · Пари с AI“ (Viber Post API).
 *
 * Viber не публикува в канала (status 10 „webhookNotSet“), докато каналът няма
 * webhook, който отговаря с HTTP 200. Събитията от канала не ни трябват —
 * само потвърждаваме. Задава се еднократно със set_webhook към този адрес.
 */
export async function POST() {
  return NextResponse.json({ status: 0, status_message: "ok" });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
