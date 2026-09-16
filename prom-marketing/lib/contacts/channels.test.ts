import { describe, it, expect } from "vitest";
import { channelLinks, preferredChannel, CHANNEL_ACTIVITY } from "./channels";

const TEXT = `Здравей, Иван — Ивайло от ProMarketing.`;

function linkFor(phone: string | null, channel: string) {
  return channelLinks(phone, TEXT).find((l) => l.channel === channel)!;
}

describe("channelLinks", () => {
  it("WhatsApp носи текста и иска голи цифри", () => {
    const wa = linkFor("0899123456", "whatsapp");
    expect(wa.href).toContain("https://wa.me/359899123456?text=");
    expect(wa.carries_text).toBe(true);
    expect(decodeURIComponent(wa.href!.split("?text=")[1])).toBe(TEXT);
  });

  it("кирилицата в текста оцелява през URL-а", () => {
    const wa = linkFor("+359888123456", "whatsapp");
    // Ако кирилицата не е кодирана, Viber/WhatsApp получават счупен текст —
    // същият клас грешка като pbcopy без UTF-8 локал.
    expect(wa.href).not.toContain("Здравей");
    expect(decodeURIComponent(wa.href!.split("?text=")[1])).toContain("Здравей");
  });

  it("Viber иска кодиран плюс и НЕ носи текст", () => {
    const v = linkFor("0899123456", "viber");
    expect(v.href).toBe("viber://chat?number=%2B359899123456");
    expect(v.carries_text).toBe(false);
    expect(v.caveat).toContain("клипборда");
  });

  it("Telegram излиза с уговорка, защото номерът не е гаранция", () => {
    const t = linkFor("0899123456", "telegram");
    expect(t.href).toBe("https://t.me/+359899123456");
    expect(t.caveat).toContain("разрешил");
  });

  it("телефонът се нормализира еднакво от всички формати", () => {
    for (const raw of ["0899123456", "+359899123456", "359899123456", "089 912 34 56"]) {
      expect(linkFor(raw, "phone").href).toBe("tel:+359899123456");
    }
  });

  it("чуждият номер не се превръща в български", () => {
    expect(linkFor("+14754269084", "phone").href).toBe("tel:+14754269084");
    expect(linkFor("+14754269084", "whatsapp").href).toContain("wa.me/14754269084");
  });

  it("без телефон всички канали са мъртви, но не гърмят", () => {
    for (const l of channelLinks(null, TEXT)) {
      expect(l.href).toBeNull();
      expect(l.caveat).toBe("няма телефон");
    }
    expect(channelLinks("", TEXT)[0].href).toBeNull();
    expect(channelLinks("не е телефон", TEXT)[0].href).toBeNull();
  });
});

describe("preferredChannel", () => {
  it("WhatsApp пръв — единственият, който носи текста сам", () => {
    expect(preferredChannel("0899123456")).toBe("whatsapp");
  });

  it("без телефон няма предпочитан канал", () => {
    expect(preferredChannel(null)).toBeNull();
  });
});

describe("CHANNEL_ACTIVITY", () => {
  it("всеки месинджър има свой тип активност, за да се мери после", () => {
    expect(CHANNEL_ACTIVITY.whatsapp).toBe("whatsapp_sent");
    expect(CHANNEL_ACTIVITY.viber).toBe("viber_sent");
    expect(CHANNEL_ACTIVITY.telegram).toBe("telegram_sent");
  });

  it("обаждането влиза като call — то вече се брои от followupState", () => {
    expect(CHANNEL_ACTIVITY.phone).toBe("call");
  });
});
