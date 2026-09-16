/**
 * Каналите, по които се стига до един лийд от опашката „Затопли".
 *
 * Тук няма изпращане — само сглобяване на адреса, който отваря готовия чат.
 * Причината е проста: нито един от трите месинджъра не позволява да пишеш
 * пръв на непознат номер програмно.
 *
 *   WhatsApp — `wa.me` отваря чата С ПРЕДВАРИТЕЛНО ПОПЪЛНЕН текст. Това е
 *              най-чистият канал: един клик и остава само Enter. Истинската
 *              автоматика иска Cloud API с одобрен темплейт и верифициран
 *              бизнес номер (1–2 седмици при Meta).
 *   Viber    — `viber://chat?number=` отваря точния човек по телефон, но
 *              схемата НЕ приема текст. Текстът минава през клипборда —
 *              рецептата е в scripts/viber-send.applescript.
 *   Telegram — по номер се намира само човек, който е разрешил да го търсят
 *              така. Затова линкът е „опитай", а не канал, на който се разчита.
 *              Надеждният път за Telegram е обратният: t.me линк към бота в
 *              имейлите, човекът натиска Start и оттам нататък сме свободни.
 *
 * Без "server-only": ползва се и в сървърния рендер на опашката, и в
 * браузъра при клик, и в тестовете.
 */

import { toE164 } from "@/lib/cal/create-booking";

export const CHANNELS = ["whatsapp", "viber", "telegram", "phone"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  viber: "Viber",
  telegram: "Telegram",
  phone: "Обади се",
};

export const CHANNEL_ICON: Record<Channel, string> = {
  whatsapp: "💬",
  viber: "💜",
  telegram: "✈️",
  phone: "📞",
};

export const CHANNEL_COLOR: Record<Channel, string> = {
  whatsapp: "#22c55e",
  viber: "#a78bfa",
  telegram: "#00d4ff",
  phone: "#facc15",
};

/**
 * Активността, с която се отбелязва изпратено съобщение по този канал.
 *
 * Отделни типове, за да се вижда в картона по кой канал сме минали — и за да
 * може по-късно да се мери кой канал носи срещи.
 */
export const CHANNEL_ACTIVITY: Record<Channel, string> = {
  whatsapp: "whatsapp_sent",
  viber: "viber_sent",
  telegram: "telegram_sent",
  phone: "call",
};

/**
 * Дали каналът пренася текста сам.
 *
 * При `false` текстът се копира в клипборда и се лепи ръчно — единственият
 * начин при Viber, а той е най-масовият месинджър в България.
 */
export const CARRIES_TEXT: Record<Channel, boolean> = {
  whatsapp: true,
  viber: false,
  telegram: false,
  phone: false,
};

export interface ChannelLink {
  channel: Channel;
  /** Адресът, който отваря чата. `null`, ако телефонът не става за този канал. */
  href: string | null;
  /** Текстът пътува ли с линка, или трябва клипборд. */
  carries_text: boolean;
  /** Защо каналът не е сигурен — показва се като предупреждение, не като грешка. */
  caveat: string | null;
}

/**
 * Сглобява линковете за всички канали по телефона на човека.
 *
 * `text` се вгражда само там, където схемата го приема; другаде се връща
 * гол адрес и текстът се взима от `warmMessage` за клипборда.
 */
export function channelLinks(phone: string | null | undefined, text: string): ChannelLink[] {
  const e164 = toE164(phone);
  if (!e164) {
    return CHANNELS.map((channel) => ({
      channel,
      href: null,
      carries_text: CARRIES_TEXT[channel],
      caveat: `няма телефон`,
    }));
  }

  // wa.me иска голи цифри — без плюс, без нули отпред.
  const bare = e164.replace(/\D/g, "");

  return CHANNELS.map((channel): ChannelLink => {
    switch (channel) {
      case "whatsapp":
        return {
          channel,
          href: `https://wa.me/${bare}?text=${encodeURIComponent(text)}`,
          carries_text: true,
          caveat: null,
        };
      case "viber":
        return {
          channel,
          // Плюсът трябва да е кодиран — иначе Viber чете номера като локален.
          href: `viber://chat?number=${encodeURIComponent(e164)}`,
          carries_text: false,
          caveat: `текстът е в клипборда · Cmd+V`,
        };
      case "telegram":
        return {
          channel,
          href: `https://t.me/${e164}`,
          carries_text: false,
          caveat: `само ако е разрешил търсене по номер`,
        };
      case "phone":
        return { channel, href: `tel:${e164}`, carries_text: false, caveat: null };
    }
  });
}

/**
 * Каналът, с който да се започне.
 *
 * WhatsApp пръв, защото носи текста сам — един клик вместо три. Viber е
 * втори, но по-масов в България, затова е винаги видим до него.
 */
export function preferredChannel(phone: string | null | undefined): Channel | null {
  return toE164(phone) ? "whatsapp" : null;
}
