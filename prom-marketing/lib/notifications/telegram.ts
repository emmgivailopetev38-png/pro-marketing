// ─────────────────────────────────────────────────────────────────────────
// Telegram мост: CRM-ът се обажда САМ на собственика при важни събития.
//
// Ползва СЪЩИЯ бот като Hermes (един канал за всичко). Нужни env (Vercel):
//   TELEGRAM_BOT_TOKEN — токенът на бота (собственикът го добавя; никога в git)
//   TELEGRAM_CHAT_ID   — chat id-то на Ивайло
// Без тях всичко е безшумен no-op — нищо не се чупи.
// ─────────────────────────────────────────────────────────────────────────

export interface TelegramButton {
  text: string;
  url: string;
}

export function isTelegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Сглобява payload-а за sendMessage (отделено за тестваемост). */
export function buildTelegramPayload(
  text: string,
  opts?: { buttons?: TelegramButton[] }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (opts?.buttons?.length) {
    payload.reply_markup = {
      inline_keyboard: [opts.buttons.map((b) => ({ text: b.text, url: b.url }))],
    };
  }
  return payload;
}

/**
 * Праща съобщение в Telegram. Никога не хвърля — нотификацията е странична
 * спрямо бизнес операцията и не бива да я проваля.
 */
export async function sendTelegram(text: string, opts?: { buttons?: TelegramButton[] }): Promise<boolean> {
  if (!isTelegramConfigured()) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildTelegramPayload(text, opts)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw";

/** Готови нотификации за ключовите CRM събития. */
export const tgNotify = {
  offerViewed: (title: string, contactName: string | null, contactId: string | null) =>
    sendTelegram(
      `🔥 <b>${escapeHtml(contactName ?? "Клиент")}</b> гледа офертата „${escapeHtml(title)}" В МОМЕНТА`,
      contactId ? { buttons: [{ text: "👤 Профил", url: `${SITE}/admin/clients/${contactId}` }] } : undefined
    ),
  offerAccepted: (title: string, contactId: string | null) =>
    sendTelegram(
      `✅ Приета оферта „${escapeHtml(title)}" — създадени са проект и чернова фактура.`,
      {
        buttons: [
          { text: "🏗 Проекти", url: `${SITE}/admin/projects` },
          { text: "🧾 Черновата", url: `${SITE}/admin/invoices` },
        ],
      }
    ),
  paymentMatched: (amount: string, invoiceNo: string) =>
    sendTelegram(`💰 Засечено плащане <b>${escapeHtml(amount)}</b> ↔ фактура ${escapeHtml(invoiceNo)} — закрита автоматично.`),
  reviewNeeded: (title: string) =>
    sendTelegram(`🔍 Чака те решение: ${escapeHtml(title)}`, {
      buttons: [{ text: "Ръчна проверка", url: `${SITE}/admin/manual-review` }],
    }),
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
